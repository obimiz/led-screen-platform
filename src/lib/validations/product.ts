import { z } from "zod";
import {
  defaultCurrency,
  indoorOutdoorOptions,
  maintenanceTypes,
  priceTypes,
  productStatuses,
  productTypes,
  stockStatuses,
} from "@/lib/constants/products";
import { objectIdSchema } from "@/lib/validations/common";

const text = (max: number) => z.string().trim().max(max).default("");
const optionalUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .url()
      .refine(
        (value) => /^https?:\/\//.test(value),
        "URL must use http or https",
      ),
  ])
  .default("");
// LED media can use existing public assets as well as external image URLs.
const ledImageUrl = optionalUrl.removeDefault().or(
  z.string().trim().regex(/^\/(?!\/)[^\\\s?#]+$/, "Use a local path or http(s) URL"),
);
const stringList = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).default([]);
const sharedFields = {
  name: z.string().trim().min(2, "Product name is required").max(160),
  category: objectIdSchema,
  shortDescription: z.string().trim().min(10).max(300),
  description: z.string().trim().min(20).max(10000),
  features: stringList(40, 200),
  specifications: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(100),
        value: z.string().trim().min(1).max(300),
      }),
    )
    .max(60)
    .default([]),
  imageUrls: z
    .array(
      z
        .string()
        .trim()
        .url()
        .refine((value) => /^https?:\/\//.test(value)),
    )
    .max(20)
    .default([]),
  featuredImageUrl: optionalUrl,
  videoUrl: optionalUrl,
  price: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().min(0).nullable(),
  ),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a three-letter currency code")
    .default(defaultCurrency),
  priceType: z.enum(priceTypes),
  stockStatus: z.enum(stockStatuses),
  quantity: z.coerce.number().int().min(0).default(0),
  isPurchasableOnline: z.boolean().default(false),
  minOrderQuantity: z.coerce.number().int().min(1).default(1),
  maxOrderQuantity: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().int().min(1).nullable()).default(null),
  allowBackorder: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  lowStockThreshold: z.coerce.number().int().min(0).default(1),
  shippingRequired: z.boolean().default(true),
  orderNotes: text(500),
  isRentable: z.boolean().default(false),
  rentalQuantityAvailable: z.coerce.number().int().min(0).default(0),
  rentalDailyRate: z
    .preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.coerce.number().min(0).nullable(),
    )
    .default(null),
  rentalHourlyRate: z
    .preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.coerce.number().min(0).nullable(),
    )
    .default(null),
  minimumRentalDays: z.coerce.number().int().min(1).max(365).default(1),
  rentalDepositAmount: z.coerce.number().min(0).default(0),
  featured: z.boolean().default(false),
  status: z.enum(productStatuses).default("draft"),
  seoTitle: text(160),
  seoDescription: text(320),
};
function priceRule(
  value: { priceType: string; price: number | null },
  context: z.RefinementCtx,
) {
  if (["fixed", "from", "per_sqm"].includes(value.priceType) && value.price === null)
    context.addIssue({
      code: "custom",
      path: ["price"],
      message: "Price is required for this price type",
    });
}

export const productSchema = z
  .object({
    ...sharedFields,
    featuredImageUrl: ledImageUrl.default(""),
    imageUrls: z.array(ledImageUrl.refine((value) => Boolean(value), "Image URL is required")).max(20).default([]),
    imageFit: z.enum(["cover", "contain"]).default("cover"),
    indoorOutdoor: z.enum(indoorOutdoorOptions),
    pixelPitch: text(50),
    displayTechnology: text(100),
    brightness: text(100),
    refreshRate: text(100),
    viewingAngle: text(100),
    cabinetSize: text(100),
    moduleSize: text(100),
    resolution: text(100),
    weight: text(100),
    powerConsumption: text(100),
    voltage: text(100),
    waterproofRating: text(100),
    lifespan: text(100),
    maintenanceType: z.enum(maintenanceTypes).default("not-specified"),
    minimumViewingDistance: text(100),
    maximumViewingDistance: text(100),
    supportedInputs: stringList(30, 100),
    usageApplications: stringList(40, 100),
  })
  .strict()
  .superRefine(priceRule);

export const accessorySchema = z
  .object({
    ...sharedFields,
    productType: z.literal("led-accessory"),
    brand: text(100),
    modelNumber: text(100),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .max(80)
      .regex(
        /^[A-Z0-9._-]*$/,
        "SKU may contain letters, numbers, dots, underscores, and hyphens",
      )
      .default(""),
    compatibility: stringList(50, 200),
  })
  .strict()
  .superRefine(priceRule);
export const bellAlarmSchema = z.object({ ...sharedFields, productType: z.enum(["bell-alarm-system","bell-alarm-accessory"]), brand: text(100), modelNumber: text(100), sku: z.string().trim().toUpperCase().max(80).regex(/^[A-Z0-9._-]*$/).default(""), compatibility: stringList(50,200), bellSystemType:text(120), applicationType:text(120), operatingMode:text(80), programmable:z.boolean().default(false), numberOfSchedules:z.coerce.number().int().min(0).default(0), outputZones:z.coerce.number().int().min(0).default(0), audioOutput:text(120), speakerSupport:z.boolean().default(false), sirenSupport:z.boolean().default(false), amplifierRequired:z.boolean().default(false), timerIncluded:z.boolean().default(false), controllerIncluded:z.boolean().default(false), batteryBackupSupported:z.boolean().default(false), remoteControlSupported:z.boolean().default(false), networkSupported:z.boolean().default(false), wifiSupported:z.boolean().default(false), gsmSupported:z.boolean().default(false), powerRequirement:text(120), coverageDescription:text(500), installationRequired:z.boolean().default(false), recommendedFor:stringList(30,120), includedComponents:stringList(50,200), optionalComponents:stringList(50,200) }).strict().superRefine(priceRule);

export const productCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: text(1000),
    imageUrl: optionalUrl,
    active: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
    productType: z.enum(productTypes).default("led-screen"),
  })
  .strict();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12),
  search: z.string().trim().max(100).default(""),
  productType: z.enum(productTypes).default("led-screen"),
  category: z.string().trim().default(""),
  indoorOutdoor: z
    .union([z.literal(""), z.enum(indoorOutdoorOptions)])
    .default(""),
  status: z.union([z.literal(""), z.enum(productStatuses)]).default(""),
  stockStatus: z.union([z.literal(""), z.enum(stockStatuses)]).default(""),
  priceType: z.union([z.literal(""), z.enum(priceTypes)]).default(""),
  pixelPitch: z.string().trim().max(50).default(""),
  brand: z.string().trim().max(100).default(""),
});

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductValues = z.output<typeof productSchema>;
export type AccessoryFormInput = z.input<typeof accessorySchema>;
export type AccessoryValues = z.output<typeof accessorySchema>;
export type ProductCategoryInput = z.input<typeof productCategorySchema>;
export type ProductCategoryValues = z.output<typeof productCategorySchema>;
export type ProductQuery = z.output<typeof productQuerySchema>;
