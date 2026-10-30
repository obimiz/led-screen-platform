/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { MaintenanceRequest } from "@/models/maintenance-request";
import { MaintenanceJob } from "@/models/maintenance-job";
import { InstallationProject } from "@/models/installation-project";
import { Product } from "@/models/product";
import { Quotation } from "@/models/quotation";
import { generateSalesNumber } from "@/services/sales";
import { SalesError } from "@/lib/sales/calculations";
import {
  maintenanceRequestSchema,
  updateMaintenanceRequestSchema,
  maintenanceJobSchema,
} from "@/lib/validations/maintenance";
const plain = (d: any) => {
  const v = d.toObject();
  const { _id, __v, ...r } = JSON.parse(JSON.stringify(v));
  return { ...r, id: String(_id), version: __v ?? 0 };
};
const oid = (v: string) =>
  Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : null;
export function determineWarrantyStatus(start?: string, end?: string) {
  if (!start || !end) return "unknown";
  const now = Date.now();
  const e = new Date(end).getTime();
  return Number.isNaN(e)
    ? "unknown"
    : e >= now
      ? "potentially-covered"
      : "expired";
}
export async function createMaintenanceRequest(raw: unknown) {
  const input = maintenanceRequestSchema.parse(raw);
  await connectToDatabase();
  let product = null;
  if (input.productId) {
    product = await Product.findOne({
      _id: input.productId,
      productType: "led-screen",
      status: "published",
    });
    if (!product) throw new SalesError("Selected product is not available.");
  }
  let installation = null;
  if (input.installationProjectId) {
    installation = await InstallationProject.findById(
      input.installationProjectId,
    );
    if (!installation) throw new SalesError("Installation project not found.");
  }
  const installationEquipment = (installation as any)?.equipment as
    any[] | undefined;
  const doc = await MaintenanceRequest.create({
    ...input,
    productId: product ? product._id : null,
    productNameSnapshot:
      product?.name || (installationEquipment?.[0] as any)?.name || "",
    installationProjectId: installation ? installation._id : null,
    referenceNumber: await generateSalesNumber("MR"),
  });
  return { referenceNumber: doc.referenceNumber };
}
export async function getMaintenanceRequests() {
  await connectToDatabase();
  return (
    await MaintenanceRequest.find()
      .sort({ createdAt: -1 })
      .limit(250)
      .populate("assignedTo", "name")
  ).map(plain);
}
export async function getMaintenanceRequestById(id: string) {
  await connectToDatabase();
  const d = await MaintenanceRequest.findById(id)
    .populate("installationProjectId")
    .populate("productId", "name sku brand modelNumber");
  return d ? plain(d) : null;
}
export async function updateMaintenanceRequest(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const i = updateMaintenanceRequestSchema.parse(raw);
  await connectToDatabase();
  const d = await MaintenanceRequest.findOneAndUpdate(
    { _id: id, __v: i.version },
    {
      $set: {
        status: i.status,
        assignedTo: oid(i.assignedTo),
        adminNotes: i.adminNotes,
        warrantyStatus: i.warrantyStatus,
        warrantyDecisionReason: i.warrantyDecisionReason,
        warrantyApprovedBy: adminId,
        warrantyDecisionDate: new Date(),
      },
    },
    { new: true },
  );
  if (!d) throw new SalesError("Request changed or not found.", 409);
  return plain(d);
}
export async function createMaintenanceJob(requestId: string, adminId: string) {
  await connectToDatabase();
  const req = await MaintenanceRequest.findById(requestId);
  if (!req) throw new SalesError("Maintenance request not found.", 404);
  const existing = await MaintenanceJob.findOne({
    maintenanceRequestId: req._id,
  });
  if (existing) return plain(existing);
  const job = await MaintenanceJob.create({
    jobNumber: await generateSalesNumber("MJ"),
    maintenanceRequestId: req._id,
    installationProjectId: req.installationProjectId,
    customerSnapshot: {
      name: req.customerName,
      companyName: req.companyName,
      email: req.customerEmail,
      phone: req.customerPhone,
      whatsappNumber: req.whatsappNumber,
    },
    equipmentSnapshot: {
      productId: req.productId,
      name: req.productNameSnapshot,
      brand: req.screenBrand,
      model: req.screenModel,
      pixelPitch: req.pixelPitch,
      width: req.screenWidth,
      height: req.screenHeight,
      sizeUnit: req.sizeUnit,
      indoorOutdoor: req.indoorOutdoor,
    },
    locationSnapshot: {
      venueName: req.venueName,
      address: req.address,
      city: req.city,
      state: req.state,
      country: req.country,
    },
    reportedIssue: req.issueDescription || req.issueTitle,
    partsUsed: [],
    repairActions: [],
    labourItems: [],
    testsPerformed: [],
    warrantyStatus: req.warrantyStatus,
    createdBy: adminId,
    updatedBy: adminId,
  });
  await MaintenanceRequest.findByIdAndUpdate(req._id, { status: "diagnosing" });
  return plain(job);
}
export async function getMaintenanceJobs() {
  await connectToDatabase();
  return (
    await MaintenanceJob.find()
      .sort({ serviceScheduledAt: 1, createdAt: -1 })
      .limit(250)
  ).map(plain);
}
export async function getMaintenanceJobById(id: string) {
  await connectToDatabase();
  const d = await MaintenanceJob.findById(id);
  return d ? plain(d) : null;
}
export async function updateMaintenanceJob(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const i = maintenanceJobSchema.parse(raw);
  await connectToDatabase();
  const total =
    (i.partsUsed || []).reduce((s, p) => s + p.lineTotal, 0) +
    (i.labourItems || []).reduce((s, p) => s + p.lineTotal, 0);
  const set: any = {
    ...i,
    quotationTotal: i.quotationTotal || total,
    balanceDue: Math.max(0, (i.quotationTotal || total) - i.amountPaid),
    updatedBy: adminId,
  };
  delete set.version;
  const d = await MaintenanceJob.findOneAndUpdate(
    { _id: id, __v: i.version },
    { $set: set },
    { new: true },
  );
  if (!d) throw new SalesError("Job changed or not found.", 409);
  return plain(d);
}
export async function updateMaintenanceJobStatus(
  id: string,
  status: string,
  version: number,
  adminId: string,
) {
  await connectToDatabase();
  const d = await MaintenanceJob.findOneAndUpdate(
    { _id: id, __v: version },
    {
      $set: {
        status,
        updatedBy: adminId,
        actualCompletedAt: status === "completed" ? new Date() : undefined,
      },
    },
    { new: true },
  );
  if (!d) throw new SalesError("Job changed or not found.", 409);
  return plain(d);
}
export async function createMaintenanceQuotation(
  requestId: string,
  adminId: string,
) {
  await connectToDatabase();
  const req = await MaintenanceRequest.findById(requestId);
  if (!req) throw new SalesError("Request not found.", 404);
  const q = await Quotation.create({
    quotationNumber: await generateSalesNumber("QT"),
    quotationType: "maintenance",
    maintenanceRequestId: req._id,
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
        name: req.issueTitle || "LED maintenance service",
        description: req.issueDescription || "Diagnosis and repair",
        quantity: 1,
        unit: "job",
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
    currency: "NGN",
    notes: "",
    terms: "",
    validityDays: 30,
    validUntil: new Date(Date.now() + 2592000000),
    status: "draft",
    createdBy: adminId,
    updatedBy: adminId,
  });
  await MaintenanceRequest.findByIdAndUpdate(req._id, {
    quotationId: q._id,
    status: "quoted",
  });
  return plain(q);
}
export async function getUpcomingMaintenance() {
  await connectToDatabase();
  return (
    await MaintenanceJob.find({
      serviceScheduledAt: { $gte: new Date() },
      status: { $nin: ["completed", "cancelled", "closed"] },
    })
      .sort({ serviceScheduledAt: 1 })
      .limit(100)
  ).map(plain);
}
export async function getEquipmentServiceHistory(projectId: string) {
  await connectToDatabase();
  const reqs = await MaintenanceRequest.find({
    installationProjectId: projectId,
  }).sort({ createdAt: 1 });
  const jobs = await MaintenanceJob.find({
    installationProjectId: projectId,
  }).sort({ createdAt: 1 });
  return [...reqs.map(plain), ...jobs.map(plain)].sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt)),
  );
}
