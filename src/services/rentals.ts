import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RentalRequest } from "@/models/rental-request";
import { RentalBooking } from "@/models/rental-booking";
import { Product } from "@/models/product";
import { Admin } from "@/models/admin";
import { Quotation } from "@/models/quotation";
import { SalesError } from "@/lib/sales/calculations";
import { generateSalesNumber } from "@/services/sales";
import {
  calculateBalance,
  calculateRentalDuration,
} from "@/lib/rentals/calculations";
import {
  createRentalRequestSchema,
  updateRentalRequestSchema,
  createRentalBookingSchema,
  rentalBookingStatusSchema,
  type RentalBookingInput,
} from "@/lib/validations/rentals";
/* eslint-disable @typescript-eslint/no-explicit-any */

const validId = (id: string) => Types.ObjectId.isValid(id);
const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
function clean(doc: any) {
  const value = JSON.parse(JSON.stringify(doc.toObject()));
  delete value._id;
  delete value.__v;
  return { ...value, id: doc.id, version: doc.__v };
}
async function requestDto(doc: any) {
  const value = clean(doc);
  return {
    ...value,
    selectedProductId: doc.selectedProductId?.toString() ?? "",
    assignedTo: doc.assignedTo?.toString() ?? "",
    quotationId: doc.quotationId?.toString() ?? "",
    eventStartDate: doc.eventStartDate?.toISOString().slice(0, 10),
    eventEndDate: doc.eventEndDate?.toISOString().slice(0, 10),
    setupDate: doc.setupDate?.toISOString().slice(0, 10) ?? "",
    teardownDate: doc.teardownDate?.toISOString().slice(0, 10) ?? "",
    assignedName: doc.assignedTo
      ? ((await Admin.findById(doc.assignedTo).select("name"))?.name ??
        "Former admin")
      : "Unassigned",
  };
}
function bookingDto(doc: any) {
  const value = clean(doc);
  return {
    ...value,
    rentalRequestId: doc.rentalRequestId?.toString() ?? "",
    quotationId: doc.quotationId?.toString() ?? "",
    assignedStaff: doc.assignedStaff?.toString() ?? "",
    bookingStart: doc.bookingStart.toISOString(),
    bookingEnd: doc.bookingEnd.toISOString(),
    setupDateTime: doc.setupDateTime?.toISOString() ?? null,
    teardownDateTime: doc.teardownDateTime?.toISOString() ?? null,
    balanceDue: doc.balanceDue,
  };
}

export async function createRentalRequest(raw: unknown) {
  const input = createRentalRequestSchema.parse(raw);
  await connectToDatabase();
  const product = input.productSlug
    ? await Product.findOne({
        slug: input.productSlug,
        productType: "led-screen",
        status: "published",
        isRentable: true,
      })
    : null;
  if (input.productSlug && !product)
    throw new SalesError("The selected screen is not available for rental.");
  const doc = await RentalRequest.create({
    ...input,
    eventStartDate: toDate(input.eventStartDate),
    eventEndDate: toDate(input.eventEndDate),
    setupDate: input.setupDate ? toDate(input.setupDate) : null,
    teardownDate: input.teardownDate ? toDate(input.teardownDate) : null,
    selectedProductId: product?._id ?? null,
    productNameSnapshot: product?.name ?? "",
    source: "website",
    referenceNumber: await generateSalesNumber("RR"),
  });
  return {
    referenceNumber: doc.referenceNumber,
    eventName: doc.eventName,
    eventType: doc.eventType === "other" ? doc.eventTypeOther : doc.eventType,
    eventStartDate: input.eventStartDate,
    eventEndDate: input.eventEndDate,
    productName: doc.productNameSnapshot,
  };
}
function queryFilter(query: any) {
  const filter: any = {};
  if (query.status) filter.status = query.status;
  if (query.eventType) filter.eventType = query.eventType;
  if (query.indoorOutdoor) filter.indoorOutdoor = query.indoorOutdoor;
  if (query.assignedTo)
    filter.assignedTo =
      query.assignedTo === "unassigned" ? null : query.assignedTo;
  if (query.from || query.to)
    filter.eventStartDate = {
      ...(query.from ? { $gte: toDate(query.from) } : {}),
      ...(query.to ? { $lte: toDate(query.to) } : {}),
    };
  if (query.search) {
    const regex = {
      $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    filter.$or = [
      "referenceNumber",
      "customerName",
      "companyName",
      "customerPhone",
      "venueName",
      "venueAddress",
    ].map((key) => ({ [key]: regex }));
  }
  return filter;
}
export async function getRentalRequests(query: any) {
  await connectToDatabase();
  const filter = queryFilter(query);
  const total = await RentalRequest.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const docs = await RentalRequest.find(filter)
    .sort({ eventStartDate: 1, createdAt: -1 })
    .skip((page - 1) * query.limit)
    .limit(query.limit);
  return {
    records: await Promise.all(docs.map(requestDto)),
    total,
    page,
    pages,
  };
}
export async function getRentalRequestById(id: string) {
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await RentalRequest.findById(id);
  return doc ? requestDto(doc) : null;
}
export async function updateRentalRequest(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const input = updateRentalRequestSchema.parse(raw);
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await RentalRequest.findById(id);
  if (!doc) return null;
  if (doc.__v !== input.version)
    throw new SalesError(
      "This rental request changed. Reload before saving.",
      409,
    );
  if (
    input.assignedTo &&
    !(await Admin.exists({ _id: input.assignedTo, isActive: true }))
  )
    throw new SalesError("Select an active admin.");
  doc.set({
    status: input.status,
    assignedTo: input.assignedTo || null,
    adminNotes: input.adminNotes,
    updatedBy: adminId,
  });
  await doc.save();
  return requestDto(doc);
}

export async function checkRentalAvailability(
  productId: string,
  quantity: number,
  start: Date | string,
  end: Date | string,
  excludeBookingId?: string,
) {
  if (!validId(productId)) throw new SalesError("Invalid rental product.");
  await connectToDatabase();
  const product = await Product.findOne({
    _id: productId,
    productType: "led-screen",
    isRentable: true,
  });
  if (!product) throw new SalesError("Product is not rentable.");
  const overlapping = await RentalBooking.find({
    bookingStatus: { $in: ["pending-confirmation", "confirmed"] },
    bookingStart: { $lt: new Date(end) },
    bookingEnd: { $gt: new Date(start) },
    ...(excludeBookingId && validId(excludeBookingId)
      ? { _id: { $ne: excludeBookingId } }
      : {}),
  });
  const reserved = overlapping.reduce(
    (sum, booking) =>
      sum +
      booking.equipment
        .filter((item: any) => item.productId.toString() === productId)
        .reduce((n: number, item: any) => n + item.quantity, 0),
    0,
  );
  const available = Math.max(
    0,
    (product.rentalQuantityAvailable ?? 0) - reserved,
  );
  return {
    productId,
    requestedQuantity: quantity,
    reservedQuantity: reserved,
    availableQuantity: available,
    isAvailable: available >= quantity,
  };
}
export async function getRentableProducts() {
  await connectToDatabase();
  return (
    await Product.find({
      productType: "led-screen",
      status: "published",
      isRentable: true,
    })
      .select(
        "name slug shortDescription indoorOutdoor pixelPitch sku currency rentalDailyRate rentalHourlyRate rentalQuantityAvailable",
      )
      .sort({ name: 1 })
  ).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.shortDescription,
    indoorOutdoor: p.indoorOutdoor,
    pixelPitch: p.pixelPitch,
    sku: p.sku ?? "",
    currency: p.currency,
    rentalDailyRate: p.rentalDailyRate ?? null,
    rentalHourlyRate: p.rentalHourlyRate ?? null,
  }));
}

function bookingTotals(input: RentalBookingInput) {
  const equipment = input.equipment.map((i) => ({
    ...i,
    lineTotal: Math.round(i.dailyRate * i.quantity * i.rentalDays),
  }));
  const services = input.services.map((i) => ({
    ...i,
    lineTotal: Math.round(i.unitPrice * i.quantity),
  }));
  const subtotal =
    equipment.reduce((n, i) => n + i.lineTotal, 0) +
    services.reduce((n, i) => n + i.lineTotal, 0);
  const total = subtotal;
  return {
    equipment,
    services,
    subtotal,
    total,
    balanceDue: calculateBalance(total, input.amountPaid),
  };
}
export async function createRentalBooking(raw: unknown, adminId: string) {
  const input = createRentalBookingSchema.parse(raw);
  await connectToDatabase();
  const values = bookingTotals(input);
  for (const item of input.equipment) {
    const availability = await checkRentalAvailability(
      item.productId,
      item.quantity,
      input.bookingStart,
      input.bookingEnd,
    );
    if (!availability.isAvailable)
      throw new SalesError(
        `${item.name}: only ${availability.availableQuantity} units remain for those dates.`,
        409,
      );
  }
  const doc = await RentalBooking.create({
    ...input,
    ...values,
    rentalRequestId: input.rentalRequestId || null,
    quotationId: input.quotationId || null,
    assignedStaff: input.assignedStaff || null,
    bookingNumber: await generateSalesNumber("RB"),
    bookingStatus: "pending-confirmation",
    createdBy: adminId,
    updatedBy: adminId,
  });
  if (input.rentalRequestId)
    await RentalRequest.findByIdAndUpdate(input.rentalRequestId, {
      quotationId: input.quotationId || null,
      status: "converted",
    });
  return bookingDto(doc);
}
export async function getRentalBookings(query: any) {
  await connectToDatabase();
  const filter: any = {};
  if (query.status) filter.bookingStatus = query.status;
  if (query.search) {
    const regex = {
      $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    filter.$or = [
      "bookingNumber",
      "customerSnapshot.name",
      "customerSnapshot.companyName",
      "customerSnapshot.phone",
      "venue",
    ].map((key) => ({ [key]: regex }));
  }
  if (query.from || query.to)
    filter.bookingStart = {
      ...(query.from ? { $gte: toDate(query.from) } : {}),
      ...(query.to ? { $lte: toDate(query.to) } : {}),
    };
  const total = await RentalBooking.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, pages);
  const docs = await RentalBooking.find(filter)
    .sort({ bookingStart: 1 })
    .skip((page - 1) * query.limit)
    .limit(query.limit);
  return { records: docs.map(bookingDto), total, page, pages };
}
export async function getRentalBookingById(id: string) {
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await RentalBooking.findById(id);
  return doc ? bookingDto(doc) : null;
}
export async function updateRentalBooking(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const input = createRentalBookingSchema.parse(raw);
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await RentalBooking.findById(id);
  if (!doc) return null;
  if (doc.__v !== input.version)
    throw new SalesError("This booking changed. Reload before saving.", 409);
  const values = bookingTotals(input);
  if (input.bookingStatus === "confirmed")
    for (const item of input.equipment) {
      const availability = await checkRentalAvailability(
        item.productId,
        item.quantity ?? 0,
        input.bookingStart,
        input.bookingEnd,
        id,
      );
      if (!availability.isAvailable)
        throw new SalesError(`${item.name}: insufficient availability.`, 409);
    }
  doc.set({ ...input, ...values, updatedBy: adminId });
  await doc.save();
  return bookingDto(doc);
}
export async function updateRentalBookingStatus(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const input = rentalBookingStatusSchema.parse(raw);
  if (!validId(id)) return null;
  await connectToDatabase();
  const doc = await RentalBooking.findById(id);
  if (!doc) return null;
  if (doc.__v !== input.version)
    throw new SalesError("This booking changed. Reload before saving.", 409);
  if (input.bookingStatus === "confirmed")
    for (const item of doc.equipment) {
      const availability = await checkRentalAvailability(
        item.productId.toString(),
        item.quantity ?? 0,
        doc.bookingStart,
        doc.bookingEnd,
        id,
      );
      if (!availability.isAvailable)
        throw new SalesError(`${item.name}: insufficient availability.`, 409);
    }
  if (input.amountPaid !== undefined) {
    doc.amountPaid = input.amountPaid;
    doc.balanceDue = calculateBalance(doc.total ?? 0, input.amountPaid);
  }
  if (input.bookingStatus) doc.bookingStatus = input.bookingStatus;
  if (input.operationalStatus) doc.operationalStatus = input.operationalStatus;
  if (input.depositStatus) doc.depositStatus = input.depositStatus;
  doc.updatedBy = new Types.ObjectId(adminId);
  await doc.save();
  return bookingDto(doc);
}
export async function getUpcomingRentals(limit = 20) {
  await connectToDatabase();
  const docs = await RentalBooking.find({
    bookingStatus: { $in: ["pending-confirmation", "confirmed"] },
    bookingEnd: { $gte: new Date() },
  })
    .sort({ bookingStart: 1 })
    .limit(limit);
  return docs.map(bookingDto);
}
export async function createRentalQuotationFromRequest(
  id: string,
  adminId: string,
) {
  const request = await getRentalRequestById(id);
  if (!request) return null;
  const product = request.selectedProductId
    ? await Product.findById(request.selectedProductId)
    : null;
  const quotation = await Quotation.create({
    quotationNumber: await generateSalesNumber("QT"),
    quotationType: "rental",
    rentalRequestId: id,
    quoteRequestId: null,
    customer: {
      name: request.customerName,
      companyName: request.companyName,
      email: request.customerEmail,
      phone: request.customerPhone,
      whatsappNumber: request.whatsappNumber,
    },
    items: product
      ? [
          {
            itemType: "led-screen",
            productId: product._id,
            name: product.name,
            description: `Rental ${request.eventStartDate} to ${request.eventEndDate}`,
            quantity: request.quantity,
            unit: "day",
            unitPrice: 0,
            discount: 0,
            lineTotal: 0,
            skuSnapshot: product.sku ?? "",
            cataloguePriceSnapshot: product.rentalDailyRate ?? null,
          },
        ]
      : [
          {
            itemType: "custom",
            name: "LED screen rental",
            description: "Rental equipment",
            quantity: 1,
            unit: "quote",
            unitPrice: 0,
            discount: 0,
            lineTotal: 0,
            skuSnapshot: "",
            cataloguePriceSnapshot: null,
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
    currency: request.budgetCurrency,
    notes: request.message,
    terms: "Availability is subject to confirmation.",
    validityDays: 30,
    validUntil: new Date(Date.now() + 30 * 86400000),
    status: "draft",
    createdBy: adminId,
    updatedBy: adminId,
  });
  await RentalRequest.findByIdAndUpdate(id, {
    status: "quoted",
    quotationId: quotation._id,
  });
  return quotation.id;
}

export async function createRentalBookingFromQuotation(
  id: string,
  adminId: string,
) {
  if (!validId(id)) return null;
  await connectToDatabase();
  const quotation = await Quotation.findById(id);
  if (
    !quotation ||
    quotation.quotationType !== "rental" ||
    quotation.status !== "accepted"
  )
    throw new SalesError("Only an accepted rental quotation can be converted.");
  const request = quotation.rentalRequestId
    ? await RentalRequest.findById(quotation.rentalRequestId)
    : null;
  if (!request)
    throw new SalesError(
      "The rental request linked to this quotation is unavailable.",
    );
  const days = calculateRentalDuration(
    request.eventStartDate,
    request.eventEndDate,
  );
  const equipment = quotation.items
    .filter((item: any) => item.itemType === "led-screen" && item.productId)
    .map((item: any) => ({
      productId: item.productId.toString(),
      name: item.name,
      sku: item.skuSnapshot ?? "",
      quantity: Math.max(1, Math.round(item.quantity)),
      dailyRate: Math.round(item.unitPrice / days),
      rentalDays: days,
      lineTotal: item.lineTotal,
    }));
  if (!equipment.length)
    throw new SalesError(
      "Add a rentable LED screen to the quotation before converting.",
    );
  const services = quotation.items
    .filter((item: any) => item.itemType !== "led-screen")
    .map((item: any) => ({
      name: item.name,
      description: item.description ?? "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));
  return createRentalBooking(
    {
      rentalRequestId: request.id,
      quotationId: quotation.id,
      customerSnapshot: {
        ...quotation.customer,
        name: quotation.customer.name,
      },
      eventSnapshot: {
        eventType:
          request.eventType === "other"
            ? request.eventTypeOther
            : request.eventType,
        eventName: request.eventName,
        startDate: request.eventStartDate.toISOString().slice(0, 10),
        endDate: request.eventEndDate.toISOString().slice(0, 10),
      },
      equipment,
      services,
      bookingStart: request.eventStartDate.toISOString(),
      bookingEnd: request.eventEndDate.toISOString(),
      setupDateTime: request.setupDate ? request.setupDate.toISOString() : null,
      teardownDateTime: request.teardownDate
        ? request.teardownDate.toISOString()
        : null,
      venue: [
        request.venueName,
        request.venueAddress,
        request.city,
        request.state,
        request.country,
      ]
        .filter(Boolean)
        .join(", "),
      subtotal: quotation.subtotal,
      depositRequired: quotation.total > 0,
      depositAmount: 0,
      depositStatus: quotation.total > 0 ? "pending" : "not-required",
      total: quotation.total,
      amountPaid: 0,
      currency: quotation.currency,
      notes: quotation.notes,
      assignedStaff: "",
    },
    adminId,
  );
}
