import { z } from "zod";
import { objectIdSchema, paginationSchema } from "@/lib/validations/common";
import { customerTypes } from "@/lib/sales/constants";
import {
  rentalStatuses,
  rentalEventTypes,
  bookingStatuses,
  operationalStatuses,
  depositStatuses,
} from "@/lib/rentals/constants";
const text = (max: number) => z.string().trim().max(max).default("");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(""), z.string().email().max(254)]))
  .default("");
const phone = text(40)
  .refine(
    (v) =>
      !v ||
      (/^\+?[\d ()-]+$/.test(v) &&
        v.replace(/\D/g, "").length >= 7 &&
        v.replace(/\D/g, "").length <= 15),
    "Enter a valid phone number",
  )
  .default("");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()),
    "Enter a valid date",
  );
const optionalDate = z.union([z.literal(""), date]).default("");
const money = z.number().int().min(0).max(1_000_000_000_000);
const contact = z
  .object({
    customerName: z.string().trim().min(2, "Enter your full name").max(100),
    customerEmail: email,
    customerPhone: phone,
    whatsappNumber: phone,
    companyName: text(160),
    customerType: z.enum(customerTypes).default("individual"),
  })
  .superRefine((v, c) => {
    if (!(v.customerEmail || v.customerPhone || v.whatsappNumber))
      c.addIssue({
        code: "custom",
        path: ["customerEmail"],
        message: "Provide an email, phone or WhatsApp number",
      });
  });
export const createRentalRequestSchema = contact
  .extend({
    eventType: z.enum(rentalEventTypes).default("other"),
    eventTypeOther: text(120),
    eventName: text(180),
    eventDescription: text(3000),
    expectedAudience: z.coerce.number().int().min(0).max(10_000_000).optional(),
    eventStartDate: date,
    eventEndDate: date,
    setupDate: optionalDate,
    teardownDate: optionalDate,
    eventStartTime: z
      .string()
      .regex(/^$|^\d{2}:\d{2}$/)
      .default(""),
    eventEndTime: z
      .string()
      .regex(/^$|^\d{2}:\d{2}$/)
      .default(""),
    venueName: text(180),
    venueAddress: text(500),
    city: text(100),
    state: text(100),
    country: text(100),
    indoorOutdoor: z.enum(["", "indoor", "outdoor", "both"]).default(""),
    requiredWidth: z.coerce.number().positive().max(100000).optional(),
    requiredHeight: z.coerce.number().positive().max(100000).optional(),
    sizeUnit: z.enum(["m", "ft"]).default("m"),
    quantity: z.coerce.number().int().min(1).max(100000).default(1),
    preferredPixelPitch: text(80),
    productSlug: text(180),
    installationSupportRequired: z.boolean().default(false),
    operatorRequired: z.boolean().default(false),
    generatorPowerRequired: z.boolean().default(false),
    transportationRequired: z.boolean().default(false),
    accessoriesRequested: text(1000),
    budget: money.optional(),
    budgetCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .default("NGN"),
    preferredContactMethod: z
      .enum(["phone", "whatsapp", "email"])
      .default("phone"),
    message: text(5000),
  })
  .superRefine((v, c) => {
    if (v.eventEndDate < v.eventStartDate)
      c.addIssue({
        code: "custom",
        path: ["eventEndDate"],
        message: "End date must be on or after start date",
      });
    if (v.setupDate && v.setupDate > v.eventStartDate)
      c.addIssue({
        code: "custom",
        path: ["setupDate"],
        message: "Setup date cannot be after the event starts",
      });
    if (v.teardownDate && v.teardownDate < v.eventEndDate)
      c.addIssue({
        code: "custom",
        path: ["teardownDate"],
        message: "Teardown date cannot be before the event ends",
      });
    if (v.preferredContactMethod === "email" && !v.customerEmail)
      c.addIssue({
        code: "custom",
        path: ["preferredContactMethod"],
        message: "Provide an email for email contact",
      });
    if (
      v.preferredContactMethod === "whatsapp" &&
      !(v.whatsappNumber || v.customerPhone)
    )
      c.addIssue({
        code: "custom",
        path: ["preferredContactMethod"],
        message: "Provide a WhatsApp number",
      });
    if (v.eventType === "other" && !v.eventTypeOther)
      c.addIssue({
        code: "custom",
        path: ["eventTypeOther"],
        message: "Describe the event type",
      });
  });
export const rentalRequestSchema = createRentalRequestSchema;
export const updateRentalRequestSchema = z.object({
  status: z.enum(rentalStatuses),
  assignedTo: z.union([objectIdSchema, z.literal("")]).default(""),
  adminNotes: text(10000),
  version: z.number().int().nonnegative(),
});
export const rentalEquipmentSchema = z.object({
  productId: objectIdSchema,
  name: z.string().trim().min(1).max(180),
  sku: text(80),
  quantity: z.number().int().positive().max(100000),
  dailyRate: money,
  rentalDays: z.number().positive().max(365),
  lineTotal: money,
});
export const rentalServiceSchema = z.object({
  name: z.string().trim().min(1).max(180),
  description: text(500),
  quantity: z.number().positive().max(100000),
  unitPrice: money,
  lineTotal: money,
});
export const createRentalBookingSchema = z
  .object({
    rentalRequestId: z.union([objectIdSchema, z.literal("")]).default(""),
    quotationId: z.union([objectIdSchema, z.literal("")]).default(""),
    customerSnapshot: z.object({
      name: z.string().trim().min(2).max(100),
      companyName: text(160),
      email,
      phone,
      whatsappNumber: phone,
    }),
    eventSnapshot: z.object({
      eventType: z.string().max(120),
      eventName: text(180),
      startDate: date,
      endDate: date,
    }),
    equipment: z.array(rentalEquipmentSchema).min(1).max(100),
    services: z.array(rentalServiceSchema).max(100).default([]),
    bookingStart: z.string().datetime(),
    bookingEnd: z.string().datetime(),
    setupDateTime: z.string().datetime().nullable().default(null),
    teardownDateTime: z.string().datetime().nullable().default(null),
    venue: text(1000),
    subtotal: money,
    depositRequired: z.boolean().default(false),
    depositAmount: money.default(0),
    depositStatus: z.enum(depositStatuses).default("not-required"),
    total: money,
    amountPaid: money.default(0),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .default("NGN"),
    notes: text(5000),
    assignedStaff: z.union([objectIdSchema, z.literal("")]).default(""),
    version: z.number().int().nonnegative().optional(),
    bookingStatus: z.enum(bookingStatuses).default("draft"),
    operationalStatus: z.enum(operationalStatuses).default("preparing"),
  })
  .superRefine((v, c) => {
    if (new Date(v.bookingEnd) <= new Date(v.bookingStart))
      c.addIssue({
        code: "custom",
        path: ["bookingEnd"],
        message: "Booking end must be after booking start",
      });
    if (v.depositAmount > v.total)
      c.addIssue({
        code: "custom",
        path: ["depositAmount"],
        message: "Deposit cannot exceed total",
      });
    if (v.amountPaid > v.total)
      c.addIssue({
        code: "custom",
        path: ["amountPaid"],
        message: "Amount paid cannot exceed total",
      });
  });
export const rentalBookingSchema = createRentalBookingSchema;
export const rentalBookingStatusSchema = z.object({
  bookingStatus: z.enum(bookingStatuses).optional(),
  operationalStatus: z.enum(operationalStatuses).optional(),
  depositStatus: z.enum(depositStatuses).optional(),
  amountPaid: money.optional(),
  version: z.number().int().nonnegative(),
});
export const rentalQuerySchema = paginationSchema.extend({
  search: text(100),
  status: text(40),
  eventType: text(50),
  indoorOutdoor: text(20),
  assignedTo: text(30),
  from: optionalDate,
  to: optionalDate,
});
export type RentalRequestInput = z.infer<typeof createRentalRequestSchema>;
export type RentalBookingInput = z.infer<typeof createRentalBookingSchema>;
