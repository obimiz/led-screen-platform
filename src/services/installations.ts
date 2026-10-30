/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { InstallationRequest } from "@/models/installation-request";
import { SiteAssessment } from "@/models/site-assessment";
import { InstallationProject } from "@/models/installation-project";
import { Product } from "@/models/product";
import { Quotation } from "@/models/quotation";
import { generateSalesNumber } from "@/services/sales";
import { SalesError } from "@/lib/sales/calculations";
import {
  installationRequestSchema,
  updateInstallationRequestSchema,
  siteAssessmentSchema,
  installationProjectUpdateSchema,
} from "@/lib/validations/installations";
function id(v: string) {
  return Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : null;
}
function plain(doc: any) {
  const v = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...r } = JSON.parse(JSON.stringify(v));
  return { ...r, id: String(_id ?? doc.id), version: doc.__v ?? 0 };
}
export async function createInstallationRequest(raw: unknown) {
  const input = installationRequestSchema.parse(raw);
  await connectToDatabase();
  const product = input.selectedProductSlug
    ? await Product.findOne({
        slug: input.selectedProductSlug,
        status: "published",
        productType: "led-screen",
      })
    : null;
  if (input.selectedProductSlug && !product)
    throw new SalesError("Selected product is not available.");
  const doc = await InstallationRequest.create({
    ...input,
    selectedProductId: product?._id ?? null,
    productNameSnapshot: product?.name ?? "",
    referenceNumber: await generateSalesNumber("IR"),
  });
  return { referenceNumber: doc.referenceNumber };
}
export async function getInstallationRequests() {
  await connectToDatabase();
  return (
    await InstallationRequest.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("assignedTo", "name")
  ).map(plain);
}
export async function getInstallationRequestById(idValue: string) {
  await connectToDatabase();
  const doc = await InstallationRequest.findById(idValue)
    .populate("assignedTo", "name")
    .populate("selectedProductId", "name slug sku");
  return doc ? plain(doc) : null;
}
export async function updateInstallationRequest(idValue: string, raw: unknown) {
  const input = updateInstallationRequestSchema.parse(raw);
  await connectToDatabase();
  const doc = await InstallationRequest.findOneAndUpdate(
    { _id: idValue, __v: input.version },
    {
      $set: {
        status: input.status,
        assignedTo: id(input.assignedTo),
        adminNotes: input.adminNotes,
      },
    },
    { new: true },
  );
  if (!doc) throw new SalesError("Request changed or not found.", 409);
  return plain(doc);
}
export async function createSiteAssessment(
  requestId: string,
  raw: unknown,
  adminId: string,
) {
  const input = siteAssessmentSchema.parse(raw);
  await connectToDatabase();
  const req = await InstallationRequest.findById(requestId);
  if (!req) throw new SalesError("Installation request not found.", 404);
  const existing = await SiteAssessment.findOne({
    installationRequestId: req._id,
  });
  if (existing) return plain(existing);
  const product = input.recommendedProductId
    ? await Product.findOne({
        _id: input.recommendedProductId,
        productType: "led-screen",
      })
    : null;
  const doc = await SiteAssessment.create({
    ...input,
    assessmentNumber: await generateSalesNumber("SA"),
    installationRequestId: req._id,
    recommendedProductId: product?._id ?? null,
    recommendedProductSnapshot: product
      ? {
          name: product.name,
          sku: product.sku,
          description: product.description,
        }
      : null,
    assessedBy: adminId,
  });
  await InstallationRequest.findByIdAndUpdate(req._id, {
    siteAssessmentId: doc._id,
    status: "assessment-scheduled",
  });
  return plain(doc);
}
export async function getSiteAssessmentById(idValue: string) {
  await connectToDatabase();
  const d = await SiteAssessment.findById(idValue).populate(
    "recommendedProductId",
    "name sku description",
  );
  return d ? plain(d) : null;
}
export async function updateSiteAssessment(
  idValue: string,
  raw: unknown,
  adminId: string,
) {
  const input = siteAssessmentSchema.parse(raw);
  await connectToDatabase();
  const set: any = { ...input, assessedBy: adminId };
  delete set.version;
  if (input.recommendedProductId) {
    const p = await Product.findOne({
      _id: input.recommendedProductId,
      productType: "led-screen",
    });
    if (!p) throw new SalesError("Recommended product not found.");
    set.recommendedProductSnapshot = {
      name: p.name,
      sku: p.sku,
      description: p.description,
    };
  }
  if (input.status === "completed") set.completedAt = new Date();
  const d = await SiteAssessment.findOneAndUpdate(
    { _id: idValue, __v: input.version },
    { $set: set },
    { new: true },
  );
  if (!d) throw new SalesError("Assessment changed or not found.", 409);
  await InstallationRequest.findByIdAndUpdate(d.installationRequestId, {
    status: input.status === "completed" ? "assessed" : "assessment-scheduled",
  });
  return plain(d);
}
export async function createInstallationQuotation(
  requestId: string,
  adminId: string,
) {
  await connectToDatabase();
  const req = await InstallationRequest.findById(requestId);
  if (!req) throw new SalesError("Installation request not found.", 404);
  const existing = req.quotationId
    ? await Quotation.findById(req.quotationId)
    : null;
  if (existing) return plain(existing);
  const q = await Quotation.create({
    quotationNumber: await generateSalesNumber("QT"),
    quotationType: "installation",
    installationRequestId: req._id,
    customer: {
      name: req.customerName,
      companyName: req.companyName,
      email: req.customerEmail,
      phone: req.customerPhone,
      whatsappNumber: req.whatsappNumber,
    },
    items: [
      {
        itemType: "service",
        name: req.productNameSnapshot || "LED installation assessment",
        description: req.projectDescription || "Installation service",
        quantity: 1,
        unit: "project",
        unitPrice: 0,
        discount: 0,
        lineTotal: 0,
      },
    ],
    subtotal: 0,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    deliveryFee: 0,
    installationFee: 0,
    otherCharges: 0,
    total: 0,
    currency: req.budgetCurrency || "NGN",
    notes: req.message || "",
    terms: "",
    validityDays: 30,
    validUntil: new Date(Date.now() + 30 * 86400000),
    status: "draft",
    createdBy: adminId,
    updatedBy: adminId,
  });
  await InstallationRequest.findByIdAndUpdate(req._id, {
    quotationId: q._id,
    status: "quoted",
  });
  return plain(q);
}
export async function createInstallationProjectFromQuotation(
  quotationId: string,
  adminId: string,
) {
  await connectToDatabase();
  const q = await Quotation.findById(quotationId);
  if (
    !q ||
    q.quotationType !== "installation" ||
    q.status !== "accepted" ||
    !q.installationRequestId
  )
    throw new SalesError(
      "Only an accepted installation quotation can be converted.",
    );
  const existing = await InstallationProject.findOne({ quotationId: q._id });
  if (existing) return plain(existing);
  const req = await InstallationRequest.findById(q.installationRequestId);
  if (!req) throw new SalesError("Installation request not found.");
  const p = await InstallationProject.create({
    projectNumber: await generateSalesNumber("IP"),
    installationRequestId: req._id,
    quotationId: q._id,
    siteAssessmentId: req.siteAssessmentId,
    customerSnapshot: q.customer,
    eventSnapshot: {
      projectName: req.projectName,
      installationType: req.installationType,
      intendedUse: req.intendedUse,
    },
    projectName: req.projectName,
    installationType: req.installationType,
    intendedUse: req.intendedUse,
    venueName: req.venueName,
    address: req.address,
    city: req.city,
    state: req.state,
    country: req.country,
    quotationTotal: q.total,
    amountPaid: 0,
    balanceDue: q.total,
    currency: q.currency,
    createdBy: adminId,
    updatedBy: adminId,
  });
  await InstallationRequest.findByIdAndUpdate(req._id, { status: "converted" });
  return plain(p);
}
export async function getInstallationProjects() {
  await connectToDatabase();
  return (
    await InstallationProject.find().sort({
      scheduledStartDate: 1,
      createdAt: -1,
    })
  ).map(plain);
}
export async function getInstallationProjectById(idValue: string) {
  await connectToDatabase();
  const d = await InstallationProject.findById(idValue);
  return d ? plain(d) : null;
}
export async function updateInstallationProject(
  idValue: string,
  raw: unknown,
  adminId: string,
) {
  const input = installationProjectUpdateSchema.parse(raw);
  await connectToDatabase();
  const set: any = {
    ...input,
    updatedBy: adminId,
    balanceDue:
      Math.max(
        0,
        (await InstallationProject.findById(idValue))?.quotationTotal ?? 0,
      ) - input.amountPaid,
  };
  delete set.version;
  const d = await InstallationProject.findOneAndUpdate(
    { _id: idValue, __v: input.version },
    { $set: set },
    { new: true },
  );
  if (!d) throw new SalesError("Project changed or not found.", 409);
  return plain(d);
}
export async function getUpcomingInstallations() {
  await connectToDatabase();
  return (
    await InstallationProject.find({
      status: { $nin: ["completed", "cancelled"] },
      scheduledStartDate: { $gte: new Date().toISOString().slice(0, 10) },
    })
      .sort({ scheduledStartDate: 1 })
      .limit(50)
  ).map(plain);
}
