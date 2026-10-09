import "server-only";
import { Types } from "mongoose";
import type { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SalesCounter } from "@/models/sales-counter";
import { QuoteRequest } from "@/models/quote-request";
import { Quotation } from "@/models/quotation";
import { Product } from "@/models/product";
import { Admin } from "@/models/admin";
import { escapeRegExp } from "@/lib/utils/slug";
import {
  createQuoteRequestSchema,
  createQuotationSchema,
  updateQuoteRequestSchema,
  updateQuotationSchema,
  type SalesQuery,
  type QuotationInput,
} from "@/lib/validations/sales";
import {
  calculateQuotationTotals,
  effectiveQuotationStatus,
  assertStatusTransition,
  majorToMinor,
  SalesError,
  type QuotationStatus,
} from "@/lib/sales/calculations";
import { enquiryStatuses, quotationStatuses } from "@/lib/sales/constants";
import type {
  Enquiry,
  Quotation as QuotationDto,
  CatalogueOption,
} from "@/types/sales";

export async function generateSalesNumber(
  prefix: "QR" | "QT" | "RR" | "RB" | "IR" | "SA" | "IP" | "MR" | "MJ" | "BA",
  now = new Date(),
) {
  const key = `${prefix}-${now.getUTCFullYear()}`;
  // _id is uniquely indexed even before application indexes have been built.
  let counter;
  try {
    counter = await SalesCounter.findOneAndUpdate(
      { _id: key },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (!(
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ))
      throw error;
    counter = await SalesCounter.findOneAndUpdate(
      { _id: key },
      { $inc: { value: 1 } },
      { returnDocument: "after" },
    );
  }
  if (!counter) throw new Error("Counter unavailable");
  return `${key}-${String(counter.value).padStart(5, "0")}`;
}
export const generateQuotationNumber = () => generateSalesNumber("QT");
export async function getSalesAdmins() {
  await connectToDatabase();
  return (
    await Admin.find({ isActive: true }).select("name").sort({ name: 1 })
  ).map((a) => ({ id: a.id as string, name: a.name }));
}
function validId(id: string) {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}
function dto<T>(doc: { toObject(): unknown; id: string; __v: number }): T {
  const value = JSON.parse(JSON.stringify(doc.toObject()));
  const { _id: _ignoredId, __v: _ignoredVersion, ...rest } = value;
  void _ignoredId;
  void _ignoredVersion;
  return { ...rest, id: doc.id, version: doc.__v } as T;
}
async function enquiryDto(
  doc: InstanceType<typeof QuoteRequest>,
): Promise<Enquiry> {
  const result = dto<Enquiry>(doc);
  return {
    ...result,
    productId: doc.productId?.toString() ?? "",
    assignedTo: doc.assignedTo?.toString() ?? "",
    assignedName: doc.assignedTo
      ? ((await Admin.findById(doc.assignedTo).select("name"))?.name ??
        "Former admin")
      : "Unassigned",
    updatedBy: doc.updatedBy?.toString() ?? "",
    eventDate: doc.eventDate?.toISOString().slice(0, 10) ?? "",
  };
}
async function quotationDto(
  doc: InstanceType<typeof Quotation>,
): Promise<QuotationDto> {
  const result = dto<QuotationDto>(doc);
  const admins = await Admin.find({
    _id: { $in: [doc.createdBy, doc.updatedBy] },
  }).select("name");
  const name = (id: Types.ObjectId) =>
    admins.find((a) => a.id === id.toString())?.name ?? "Former admin";
  return {
    ...result,
    quoteRequestId: doc.quoteRequestId?.toString() ?? "",
    rentalRequestId: doc.rentalRequestId?.toString() ?? "",
    installationRequestId: doc.installationRequestId?.toString() ?? "",
    maintenanceRequestId: doc.maintenanceRequestId?.toString() ?? "",
    maintenanceJobId: doc.maintenanceJobId?.toString() ?? "",
    bellAlarmRequestId: doc.bellAlarmRequestId?.toString() ?? "",
    items: result.items.map((i) => ({ ...i, productId: i.productId ?? "" })),
    effectiveStatus: effectiveQuotationStatus(doc.status, doc.validUntil),
    createdByName: name(doc.createdBy),
    updatedByName: name(doc.updatedBy),
    acceptedAt: doc.acceptedAt?.toISOString() ?? "",
    rejectedAt: doc.rejectedAt?.toISOString() ?? "",
    convertedToSaleAt: doc.convertedToSaleAt?.toISOString() ?? "",
  };
}
export async function createQuoteRequest(raw: unknown) {
  const input = createQuoteRequestSchema.parse(raw);
  await connectToDatabase();
  const product = input.productSlug
    ? await Product.findOne({
        slug: input.productSlug,
        status: "published",
        productType: { $in: ["led-screen", "led-accessory"] },
      })
    : null;
  if (input.productSlug && !product)
    throw new SalesError(
      "The selected product is no longer available. Please choose another product or send a general request.",
    );
  const doc = await QuoteRequest.create({
    ...input,
    eventDate: input.eventDate || null,
    productId: product?._id ?? null,
    productNameSnapshot: product?.name ?? "",
    productSlug: product?.slug ?? "",
    source: product ? "product-page" : "website",
    referenceNumber: await generateSalesNumber("QR"),
    status: "new",
  });
  return {
    referenceNumber: doc.referenceNumber,
    customerName: doc.customerName,
    productName: doc.productNameSnapshot,
    projectType: doc.projectType,
    quantity: doc.quantity,
  };
}
function listFilter(query: SalesQuery, quotation: boolean) {
  const filter: Record<string, unknown> = {};
  if (query.status) {
    if (
      !(quotation ? quotationStatuses : enquiryStatuses).some(
        (s) => s === query.status,
      )
    )
      throw new SalesError("Invalid status filter.");
    if (quotation && query.status === "expired")
      filter.$or = [
        { status: "expired" },
        {
          status: { $in: ["sent", "viewed"] },
          validUntil: { $lt: new Date() },
        },
      ];
    else {
      filter.status = query.status;
      if (quotation && ["sent", "viewed"].includes(query.status))
        filter.validUntil = { $gte: new Date() };
    }
  }
  if (query.from || query.to)
    filter.createdAt = {
      ...(query.from ? { $gte: new Date(`${query.from}T00:00:00Z`) } : {}),
      ...(query.to ? { $lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    };
  if (query.search) {
    const regex = { $regex: escapeRegExp(query.search), $options: "i" };
    const fields = quotation
      ? [
          "quotationNumber",
          "customer.name",
          "customer.companyName",
          "customer.email",
          "customer.phone",
          "customer.whatsappNumber",
        ]
      : [
          "referenceNumber",
          "customerName",
          "companyName",
          "customerEmail",
          "customerPhone",
          "whatsappNumber",
        ];
    filter.$and = [{ $or: fields.map((f) => ({ [f]: regex })) }];
  }
  if (quotation) {
    if (query.currency) filter.currency = query.currency;
  } else {
    if (query.source) filter.source = query.source;
    if (query.projectType) filter.projectType = query.projectType;
    if (query.assignedTo)
      filter.assignedTo =
        query.assignedTo === "unassigned" ? null : query.assignedTo;
  }
  return filter;
}
export async function getQuoteRequests(query: SalesQuery) {
  await connectToDatabase();
  const filter = listFilter(query, false);
  const total = await QuoteRequest.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const docs = await QuoteRequest.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * query.limit)
    .limit(query.limit);
  return {
    records: await Promise.all(docs.map(enquiryDto)),
    total,
    page,
    pages,
  };
}
export async function getQuoteRequestById(id: string) {
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await QuoteRequest.findById(id);
  return doc ? enquiryDto(doc) : null;
}
export async function updateQuoteRequest(
  id: string,
  raw: z.infer<typeof updateQuoteRequestSchema>,
  adminId: string,
) {
  const input = updateQuoteRequestSchema.parse(raw);
  if (!validId(id)) return null;
  await connectToDatabase();
  if (
    input.assignedTo &&
    !(await Admin.exists({ _id: input.assignedTo, isActive: true }))
  )
    throw new SalesError("Select an active admin.");
  const doc = await QuoteRequest.findById(id);
  if (!doc) return null;
  if (doc.__v !== input.version)
    throw new SalesError("This enquiry changed. Reload before saving.", 409);
  doc.set({
    ...input,
    assignedTo: input.assignedTo || null,
    updatedBy: adminId,
  });
  await doc.save();
  return enquiryDto(doc);
}
export async function getSalesCatalogue(
  search = "",
): Promise<CatalogueOption[]> {
  await connectToDatabase();
  const docs = await Product.find({
    status: { $ne: "archived" },
    ...(search
      ? { name: { $regex: escapeRegExp(search.slice(0, 100)), $options: "i" } }
      : {}),
  })
    .select("name shortDescription sku productType price currency")
    .sort({ name: 1 })
    .limit(50);
  return docs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.shortDescription,
    sku: p.sku ?? "",
    productType: p.productType,
    price: p.price == null ? null : majorToMinor(p.price),
    currency: p.currency,
  }));
}
export async function getSalesCatalogueById(
  id: string,
): Promise<CatalogueOption | undefined> {
  if (!validId(id)) return undefined;
  await connectToDatabase();
  const p = await Product.findOne({ _id: id, status: { $ne: "archived" } });
  if (!p) return undefined;
  return {
    id: p.id,
    name: p.name,
    description: p.shortDescription,
    sku: p.sku ?? "",
    productType: p.productType,
    price: p.price == null ? null : majorToMinor(p.price),
    currency: p.currency,
  };
}

async function quotationValues(
  input: QuotationInput,
  existing?: InstanceType<typeof Quotation>,
) {
  if (
    existing &&
    input.quoteRequestId !== (existing.quoteRequestId?.toString() ?? "")
  )
    throw new SalesError("The original enquiry link cannot be changed.");
  if (
    input.quoteRequestId &&
    !(await QuoteRequest.exists({ _id: input.quoteRequestId }))
  )
    throw new SalesError("The linked enquiry no longer exists.");
  const calculated = calculateQuotationTotals(input);
  const items = await Promise.all(
    calculated.items.map(async (item) => {
      // Match existing snapshot by product identity. Subsequent edits never fetch new prices.
      const old = existing?.items.find(
        (i) =>
          i.productId?.toString() === item.productId &&
          i.itemType === item.itemType,
      );
      if (item.productId && old) {
        if (input.currency !== existing?.currency)
          throw new SalesError(
            "Remove catalogue items before changing currency.",
          );
        return {
          ...item,
          skuSnapshot: old.skuSnapshot,
          cataloguePriceSnapshot: old.cataloguePriceSnapshot,
        };
      }
      if (!item.productId)
        return {
          ...item,
          productId: null,
          skuSnapshot: "",
          cataloguePriceSnapshot: null,
        };
      const p = await Product.findOne({
        _id: item.productId,
        status: { $ne: "archived" },
        productType:
          item.itemType === "accessory" ? "led-accessory" : "led-screen",
      });
      if (!p)
        throw new SalesError(
          "A selected product is unavailable or has the wrong item type.",
        );
      if (p.currency !== input.currency)
        throw new SalesError(
          "Catalogue products must use the quotation currency. Use a custom item for a manually converted price.",
        );
      return {
        ...item,
        name: p.name,
        description: p.shortDescription,
        skuSnapshot: p.sku ?? "",
        cataloguePriceSnapshot: p.price == null ? null : majorToMinor(p.price),
      };
    }),
  );
  const validUntil = input.validUntil
    ? new Date(`${input.validUntil}T23:59:59.999Z`)
    : new Date(Date.now() + input.validityDays * 86400000);
  return {
    ...input,
    ...calculated,
    items,
    quoteRequestId: input.quoteRequestId || null,
    validUntil,
  };
}
export async function createQuotation(raw: unknown, adminId: string) {
  const input = createQuotationSchema.parse(raw);
  await connectToDatabase();
  const values = await quotationValues(input);
  const doc = await Quotation.create({
    ...values,
    quotationNumber: await generateQuotationNumber(),
    status: "draft",
    createdBy: adminId,
    updatedBy: adminId,
  });
  return quotationDto(doc);
}
export async function getQuotations(query: SalesQuery) {
  await connectToDatabase();
  const filter = listFilter(query, true);
  const total = await Quotation.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const docs = await Quotation.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * query.limit)
    .limit(query.limit);
  return {
    records: await Promise.all(docs.map(quotationDto)),
    total,
    page,
    pages,
  };
}
export async function getQuotationById(id: string) {
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await Quotation.findById(id);
  return doc ? quotationDto(doc) : null;
}
export async function updateQuotation(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const input = updateQuotationSchema.parse(raw);
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await Quotation.findById(id);
  if (!doc) return null;
  if (doc.__v !== input.version)
    throw new SalesError("This quotation changed. Reload before saving.", 409);
  if (doc.status !== "draft")
    throw new SalesError("Reopen the quotation as draft before editing.");
  doc.set({ ...(await quotationValues(input, doc)), updatedBy: adminId });
  await doc.save();
  return quotationDto(doc);
}
export async function updateQuotationStatus(
  id: string,
  status: QuotationStatus,
  version: number,
  adminId: string,
) {
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await Quotation.findById(id);
  if (!doc) return null;
  if (doc.__v !== version)
    throw new SalesError("This quotation changed. Reload before saving.", 409);
  assertStatusTransition(
    effectiveQuotationStatus(doc.status, doc.validUntil),
    status,
  );
  if (status === "sent" && doc.validUntil < new Date())
    throw new SalesError(
      "Update the validity date before marking this quotation sent.",
    );
  doc.status = status;
  doc.updatedBy = new Types.ObjectId(adminId);
  if (status === "accepted") doc.acceptedAt = new Date();
  if (status === "rejected") doc.rejectedAt = new Date();
  if (status === "converted") doc.convertedToSaleAt = new Date();
  await doc.save();
  // The enquiry has its own workflow; administrators deliberately update it separately.
  return quotationDto(doc);
}
