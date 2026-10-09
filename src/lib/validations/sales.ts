import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common";
import {
  customerTypes,
  projectTypes,
  enquiryStatuses,
  enquirySources,
  quotationStatuses,
  salesCurrencies,
  defaultSalesCurrency,
  itemTypes,
} from "@/lib/sales/constants";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),
      "Remove unsupported control characters",
    );
const optionalText = (max: number) => text(max).default("");
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
    "Enter a valid phone number with country code",
  )
  .default("");
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Enter a valid date");
const optionalDate = z.union([z.literal(""), dateOnly]).default("");
const optionalPositive = z.number().finite().positive().max(100000).optional();
export const minorMoney = z.number().int().min(0).max(1_000_000_000_000);
const rate = z.number().min(0).max(100).multipleOf(0.01);
export const customerSchema = z
  .object({
    name: text(100).min(2),
    companyName: optionalText(160),
    email,
    phone,
    whatsappNumber: phone,
  })
  .refine((v) => Boolean(v.email || v.phone || v.whatsappNumber), {
    message: "Provide an email, phone or WhatsApp number",
    path: ["email"],
  });
export const createQuoteRequestSchema = z
  .object({
    customerName: text(100).min(2, "Enter your full name"),
    customerEmail: email,
    customerPhone: phone,
    whatsappNumber: phone,
    companyName: optionalText(160),
    customerType: z.enum(customerTypes).default("individual"),
    productSlug: optionalText(180),
    projectType: z.enum(projectTypes).default("purchase"),
    intendedUse: optionalText(500),
    indoorOutdoor: z
      .enum(["", "indoor", "outdoor", "both", "not-sure"])
      .default(""),
    requiredWidth: optionalPositive,
    requiredHeight: optionalPositive,
    sizeUnit: z.enum(["m", "ft"]).default("m"),
    quantity: z.number().int().min(1).max(100000).default(1),
    preferredPixelPitch: optionalText(80),
    installationLocation: optionalText(500),
    city: optionalText(100),
    state: optionalText(100),
    country: optionalText(100),
    eventDate: optionalDate,
    budget: minorMoney.optional(),
    budgetCurrency: z.enum(salesCurrencies).default(defaultSalesCurrency),
    message: optionalText(5000),
    preferredContactMethod: z
      .enum(["phone", "whatsapp", "email"])
      .default("phone"),
  })
  .superRefine((v, ctx) => {
    if (!(v.customerEmail || v.customerPhone || v.whatsappNumber))
      ctx.addIssue({
        code: "custom",
        path: ["customerEmail"],
        message: "Provide an email, phone or WhatsApp number",
      });
    const contact =
      v.preferredContactMethod === "email"
        ? v.customerEmail
        : v.preferredContactMethod === "whatsapp"
          ? v.whatsappNumber || v.customerPhone
          : v.customerPhone;
    if (!contact)
      ctx.addIssue({
        code: "custom",
        path: ["preferredContactMethod"],
        message: "Provide a number or email for your preferred contact method",
      });
  });
export const quoteRequestSchema = createQuoteRequestSchema;
export const updateQuoteRequestSchema = z.object({
  status: z.enum(enquiryStatuses),
  source: z.enum(enquirySources),
  assignedTo: z.union([objectIdSchema, z.literal("")]).default(""),
  adminNotes: optionalText(10000),
  version: z.number().int().nonnegative(),
});
export const quotationItemSchema = z
  .object({
    itemType: z.enum(itemTypes),
    productId: z.union([objectIdSchema, z.literal("")]).default(""),
    name: text(180).min(1),
    description: optionalText(2000),
    quantity: z.number().positive().max(100000).multipleOf(0.001),
    unit: text(40).min(1),
    unitPrice: minorMoney,
    discount: minorMoney.default(0),
  })
  .superRefine((v, ctx) => {
    if (
      (v.itemType === "led-screen" || v.itemType === "accessory") &&
      !v.productId
    )
      ctx.addIssue({
        code: "custom",
        path: ["productId"],
        message: "Select a catalogue product",
      });
    if ((v.itemType === "custom" || v.itemType === "service") && v.productId)
      ctx.addIssue({
        code: "custom",
        path: ["productId"],
        message: "Custom and service items cannot reference a product",
      });
  });
export const createQuotationSchema = z
  .object({
    quoteRequestId: z.union([objectIdSchema, z.literal("")]).default(""),
    rentalRequestId: z.union([objectIdSchema, z.literal("")]).default(""),
    installationRequestId: z.union([objectIdSchema, z.literal("")]).default(""),
    maintenanceRequestId: z.union([objectIdSchema, z.literal("")]).default(""),
    maintenanceJobId: z.union([objectIdSchema, z.literal("")]).default(""),
    bellAlarmRequestId: z.union([objectIdSchema, z.literal("")]).default(""),
    quotationType: z.enum(["sales", "rental", "installation", "maintenance", "bell-alarm"]).default("sales"),
    customer: customerSchema,
    billingAddress: optionalText(1000),
    deliveryAddress: optionalText(1000),
    items: z.array(quotationItemSchema).min(1).max(100),
    discountType: z.enum(["none", "fixed", "percentage"]).default("none"),
    discountValue: z.number().min(0).max(1_000_000_000_000).default(0),
    taxRate: rate.default(0),
    deliveryFee: minorMoney.default(0),
    installationFee: minorMoney.default(0),
    otherCharges: minorMoney.default(0),
    currency: z.enum(salesCurrencies).default(defaultSalesCurrency),
    notes: optionalText(5000),
    terms: optionalText(10000),
    validityDays: z.number().int().min(1).max(365).default(30),
    validUntil: optionalDate,
  })
  .superRefine((v, ctx) => {
    if (
      v.discountType === "percentage" &&
      (v.discountValue > 100 ||
        Math.abs(v.discountValue * 100 - Math.round(v.discountValue * 100)) >
          0.000001)
    )
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percentage must be 0–100 with at most two decimal places",
      });
    if (v.discountType === "fixed" && !Number.isInteger(v.discountValue))
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Fixed discount must be whole minor units",
      });
  });
export const quotationSchema = createQuotationSchema;
export const updateQuotationSchema = createQuotationSchema.safeExtend({
  version: z.number().int().nonnegative(),
});
export const quotationStatusSchema = z.object({
  status: z.enum(quotationStatuses),
  version: z.number().int().nonnegative(),
});
export const salesQuerySchema = paginationSchema
  .extend({
    search: text(100).default(""),
    status: text(30).default(""),
    source: z.union([z.enum(enquirySources), z.literal("")]).default(""),
    projectType: z.union([z.enum(projectTypes), z.literal("")]).default(""),
    assignedTo: z
      .union([objectIdSchema, z.literal(""), z.literal("unassigned")])
      .default(""),
    from: optionalDate,
    to: optionalDate,
    currency: z.union([z.enum(salesCurrencies), z.literal("")]).default(""),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "End date must follow start date",
    path: ["to"],
  });
export type QuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
export type QuotationInput = z.infer<typeof createQuotationSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
export type SalesQuery = z.infer<typeof salesQuerySchema>;
