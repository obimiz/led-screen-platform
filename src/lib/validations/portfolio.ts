import { z } from "zod";
import {
  portfolioProjectTypes,
  portfolioStatuses,
} from "@/lib/portfolio/constants";
import {
  richContentSchema,
  safeImage,
  safeLink,
  richText,
} from "@/lib/publishing/rich-content";
const s = (n: number) => z.string().trim().max(n).default("");
const image = z
  .string()
  .max(2000)
  .refine((v) => !v || safeImage(v), "Choose a valid image URL")
  .default("");
const url = z
  .string()
  .max(2000)
  .refine(
    (v) => !v || (safeLink(v) && /^https?:/.test(v)),
    "Use a valid HTTP(S) URL",
  )
  .default("");
const date = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Use a valid date",
  )
  .default("");
export const portfolioProjectSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    slug: z
      .string()
      .trim()
      .max(180)
      .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .default(""),
    contentType: z.enum(["project", "article"]).default("project"),
    shortDescription: z.string().trim().min(10).max(500),
    description: s(60000),
    richContent: richContentSchema.default(null),
    author: s(160),
    publishedAt: z
      .union([z.string().datetime(), z.literal(""), z.null()])
      .optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
    projectType: z.enum(portfolioProjectTypes).default("custom"),
    projectStatus: z
      .enum(["planned", "in-progress", "completed"])
      .default("completed"),
    categoryId: s(80),
    serviceType: s(120),
    installationProjectId: s(80),
    rentalBookingId: s(80),
    bellAlarmProjectId: s(80),
    maintenanceJobId: s(80),
    customerName: s(160),
    customerDisplayName: s(160),
    hideCustomerName: z.boolean().default(true),
    clientPermissionConfirmed: z.boolean().default(false),
    mediaPermissionConfirmed: z.boolean().default(false),
    venueName: s(180),
    city: s(100),
    state: s(100),
    country: s(100),
    projectDate: date,
    completionDate: date,
    indoorOutdoor: s(40),
    screenSize: s(100),
    pixelPitch: s(80),
    productsUsed: z.array(z.string().trim().max(180)).max(40).default([]),
    servicesProvided: z.array(z.string().trim().max(180)).max(40).default([]),
    coverImageUrl: image,
    coverAlt: s(300),
    imageUrls: z.array(image).max(40).default([]),
    imageAlts: z.array(s(300)).max(40).default([]),
    videoUrl: url,
    challenge: s(5000),
    solution: s(5000),
    outcome: s(5000),
    featured: z.boolean().default(false),
    status: z.enum(portfolioStatuses).default("draft"),
    sortOrder: z.number().int().min(0).max(100000).default(0),
    seoTitle: s(180),
    seoDescription: s(320),
  })
  .superRefine((v, c) => {
    const issue = (path: string, message: string) =>
      c.addIssue({ code: "custom", path: [path], message });
    if (v.projectDate && v.completionDate && v.projectDate > v.completionDate)
      issue("completionDate", "Completion date must follow project date");
    if (v.status !== "published") return;
    if (
      v.contentType === "project" &&
      (v.projectStatus !== "completed" || !v.completionDate)
    )
      issue(
        "completionDate",
        "Only completed projects with a completion date can be published",
      );
    if (!v.categoryId)
      issue("categoryId", "Select a category before publishing");
    if (v.contentType === "article" && !v.author)
      issue("author", "Enter an author before publishing");
    if (!v.description && !richText(v.richContent))
      issue("richContent", "Add detailed content before publishing");
    if (!v.mediaPermissionConfirmed)
      issue(
        "mediaPermissionConfirmed",
        "Confirm permission to publish the content and photographs",
      );
    if (
      v.contentType === "project" &&
      !v.hideCustomerName &&
      !v.clientPermissionConfirmed
    )
      issue(
        "clientPermissionConfirmed",
        "Confirm client permission before displaying the client name",
      );
    if (v.coverImageUrl && !v.coverAlt)
      issue("coverAlt", "Add alternative text for the cover image");
    if (v.imageUrls.some((_, i) => !v.imageAlts[i]))
      issue("imageAlts", "Add alternative text for every gallery image");
  });
export const portfolioCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: s(140),
  scope: z.enum(["all", "project", "article"]).default("all"),
  description: s(1000),
  imageUrl: image,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});
