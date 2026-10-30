import { z } from "zod";
import { objectIdSchema } from "./common";
import { salesCurrencies } from "@/lib/sales/constants";
import {
  installationRequestStatuses,
  installationTypes,
  intendedUses,
  assessmentStatuses,
  projectStatuses,
  taskStatuses,
} from "@/lib/installations/constants";
const s = (n: number) => z.string().trim().max(n).default("");
const required = (n: number, m: string) => z.string().trim().min(2, m).max(n);
const phone = z
  .string()
  .trim()
  .max(40)
  .refine(
    (v) =>
      !v ||
      (/^[+\d ()-]+$/.test(v) &&
        v.replace(/\D/g, "").length >= 7 &&
        v.replace(/\D/g, "").length <= 15),
    "Enter a valid phone number",
  )
  .default("");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(""), z.string().email().max(254)]))
  .default("");
const date = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .default("");
const pos = z.number().finite().positive().max(100000).optional();
export const installationRequestSchema = z
  .object({
    customerName: required(100, "Enter your name"),
    companyName: s(160),
    customerType: s(60),
    customerEmail: email,
    customerPhone: phone,
    whatsappNumber: phone,
    projectName: s(180),
    projectDescription: s(5000),
    installationType: z.enum(installationTypes).default("custom"),
    intendedUse: z.enum(intendedUses).default("other"),
    indoorOutdoor: z
      .enum(["", "indoor", "outdoor", "both", "not-sure"])
      .default(""),
    selectedProductSlug: s(180),
    requiredWidth: pos,
    requiredHeight: pos,
    sizeUnit: z.enum(["m", "ft"]).default("m"),
    preferredPixelPitch: s(80),
    quantity: z.number().int().min(1).max(100000).default(1),
    venueName: s(180),
    address: s(500),
    city: s(100),
    state: s(100),
    country: s(100),
    buildingType: s(120),
    mountingLocation: s(240),
    mountingHeight: pos,
    structureAvailable: z.enum(["", "yes", "no", "not-sure"]).default(""),
    powerAvailable: z.enum(["", "yes", "no", "not-sure"]).default(""),
    internetRequired: z.boolean().default(false),
    controlRoomAvailable: z.enum(["", "yes", "no", "not-sure"]).default(""),
    preferredInstallationDate: date,
    budget: z.number().int().min(0).optional(),
    budgetCurrency: z.enum(salesCurrencies).default("NGN"),
    preferredContactMethod: z
      .enum(["phone", "whatsapp", "email"])
      .default("phone"),
    message: s(5000),
    source: z
      .enum([
        "website",
        "product-page",
        "admin",
        "whatsapp",
        "referral",
        "other",
      ])
      .default("website"),
  })
  .superRefine((v, c) => {
    if (!(v.customerEmail || v.customerPhone || v.whatsappNumber))
      c.addIssue({
        code: "custom",
        path: ["customerEmail"],
        message: "Provide an email, phone or WhatsApp number",
      });
    if (v.preferredContactMethod === "email" && !v.customerEmail)
      c.addIssue({
        code: "custom",
        path: ["preferredContactMethod"],
        message: "Provide an email",
      });
    if (
      v.preferredContactMethod !== "email" &&
      !v.customerPhone &&
      !v.whatsappNumber
    )
      c.addIssue({
        code: "custom",
        path: ["preferredContactMethod"],
        message: "Provide a phone number",
      });
  });
export const updateInstallationRequestSchema = z.object({
  status: z.enum(installationRequestStatuses),
  assignedTo: z.union([objectIdSchema, z.literal("")]).default(""),
  adminNotes: s(10000),
  version: z.number().int().nonnegative(),
});
export const siteAssessmentSchema = z.object({
  scheduledDate: date,
  scheduledTime: s(30),
  assignedStaff: z.array(objectIdSchema).default([]),
  venueName: s(180),
  address: s(500),
  locationNotes: s(1000),
  buildingType: s(120),
  mountingSurface: s(500),
  structuralCondition: s(1000),
  availableWidth: pos,
  availableHeight: pos,
  mountingHeight: pos,
  powerSupply: s(500),
  powerRequirement: s(500),
  cableRoute: s(1000),
  controlRoomLocation: s(500),
  ventilation: s(500),
  weatherExposure: s(500),
  internetConnectivity: s(500),
  accessRestrictions: s(1000),
  safetyNotes: s(2000),
  technicianNotes: s(5000),
  recommendedProductId: z.union([objectIdSchema, z.literal("")]).default(""),
  recommendedWidth: pos,
  recommendedHeight: pos,
  recommendedPixelPitch: s(80),
  recommendedMountingMethod: s(500),
  recommendedAccessories: z
    .array(
      z.object({
        productId: objectIdSchema,
        name: s(180),
        quantity: z.number().int().min(1).max(100000).default(1),
      }),
    )
    .default([]),
  estimatedInstallationDuration: s(100),
  siteImageUrls: z.array(z.string().url().max(1000)).max(30).default([]),
  status: z.enum(assessmentStatuses).default("scheduled"),
  version: z.number().int().nonnegative().optional(),
});
export const installationTaskSchema = z.object({
  title: required(160, "Task title required"),
  description: s(1000),
  assignedTo: z.union([objectIdSchema, z.literal("")]).default(""),
  status: z.enum(taskStatuses).default("pending"),
  dueDate: date,
  completedAt: date,
});
export const installationProjectUpdateSchema = z.object({
  scheduledStartDate: date,
  scheduledCompletionDate: date,
  actualStartDate: date,
  actualCompletionDate: date,
  projectManager: z.union([objectIdSchema, z.literal("")]).default(""),
  assignedStaff: z.array(objectIdSchema).default([]),
  progressPercentage: z.number().int().min(0).max(100),
  status: z.enum(projectStatuses),
  tasks: z.array(installationTaskSchema).max(100).default([]),
  equipment: z.array(z.record(z.string(), z.unknown())).max(200).default([]),
  materials: z.array(z.record(z.string(), z.unknown())).max(200).default([]),
  displayPowerTested: z.boolean().default(false),
  controllerConfigured: z.boolean().default(false),
  contentTested: z.boolean().default(false),
  brightnessChecked: z.boolean().default(false),
  connectivityChecked: z.boolean().default(false),
  finalInspectionCompleted: z.boolean().default(false),
  customerTrainingCompleted: z.boolean().default(false),
  commissioningNotes: s(5000),
  handoverDate: date,
  handedOverTo: s(160),
  customerRepresentative: s(160),
  handoverNotes: s(3000),
  warrantyStartDate: date,
  warrantyEndDate: date,
  warrantyNotes: s(2000),
  internalNotes: s(10000),
  customerNotes: s(5000),
  amountPaid: z.number().int().min(0).default(0),
  version: z.number().int().nonnegative(),
});
export const installationProjectStatusSchema = z.object({
  status: z.enum(projectStatuses),
  progressPercentage: z.number().int().min(0).max(100),
  version: z.number().int().nonnegative(),
});
