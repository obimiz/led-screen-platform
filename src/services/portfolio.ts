import "server-only";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PortfolioProject } from "@/models/portfolio-project";
import { PortfolioCategory } from "@/models/portfolio-category";
import {
  portfolioProjectSchema,
  portfolioCategorySchema,
} from "@/lib/validations/portfolio";
import { createSlug } from "@/lib/utils/slug";
import { SalesError } from "@/lib/sales/calculations";
import { redactPortfolio } from "@/lib/seo/privacy";
import {
  sanitizeRichContent,
  richText,
  safeImage,
  safeLink,
} from "@/lib/publishing/rich-content";
export type ContentKind = "project" | "article";
export const projectKindFilter = { contentType: { $ne: "article" } };
export const publicContentFilter = {
  status: "published",
  $and: [
    {
      $or: [
        { contentType: "article" },
        { projectStatus: "completed" },
        { projectStatus: { $exists: false } },
      ],
    },
    {
      $or: [
        { publishedAt: null },
        { publishedAt: { $exists: false } },
        { publishedAt: { $lte: new Date() } },
      ],
    },
  ],
};
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Existing Mongoose models are untyped; all mutation payloads are validated below.
export function contentDto(doc: any, publicOnly = false): any {
  const raw = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, createdBy, updatedBy, ...value } = JSON.parse(
    JSON.stringify(raw),
  );
  void __v;
  void createdBy;
  void updatedBy;
  value.id = String(_id);
  value.contentType = value.contentType || "project";
  if (value.richContent) {
    try {
      value.richContent = sanitizeRichContent(value.richContent);
    } catch {
      value.richContent = null;
    }
  }
  if (!publicOnly) return value;
  if (value.coverImageUrl && !safeImage(value.coverImageUrl))
    value.coverImageUrl = "";
  const images = (value.imageUrls || [])
    .map((url: string, index: number) => ({
      url,
      alt: value.imageAlts?.[index] || "",
    }))
    .filter((image: { url: string }) => safeImage(image.url));
  value.imageUrls = images.map((image: { url: string }) => image.url);
  value.imageAlts = images.map((image: { alt: string }) => image.alt);
  if (
    value.videoUrl &&
    (!safeLink(value.videoUrl) || !/^https?:/.test(value.videoUrl))
  )
    value.videoUrl = "";

  const hidden = value.hideCustomerName || !value.clientPermissionConfirmed;
  value.clientName = !hidden
    ? value.customerDisplayName || value.customerName || ""
    : "";
  value.hideCustomerName = hidden;
  if (hidden) value.customerDisplayName = "Private Client";
  const privateName = value.customerName;
  const result = redactPortfolio(value);
  if (hidden && privateName) {
    const pattern = new RegExp(escaped(privateName), "gi");
    const scrub = (v: unknown): unknown =>
      typeof v === "string"
        ? v.replace(pattern, "Private client")
        : Array.isArray(v)
          ? v.map(scrub)
          : v && typeof v === "object"
            ? Object.fromEntries(
                Object.entries(v).map(([k, n]) => [k, scrub(n)]),
              )
            : v;
    for (const key of [
      "richContent",
      "servicesProvided",
      "productsUsed",
      "tags",
      "author",
      "coverAlt",
      "imageAlts",
    ])
      result[key] = scrub(result[key]);
  }
  if (!value.mediaPermissionConfirmed) {
    result.coverImageUrl = "";
    result.imageUrls = [];
    result.videoUrl = "";
    result.richContent = null;
  }
  for (const key of [
    "clientPermissionConfirmed",
    "mediaPermissionConfirmed",
    "hideCustomerName",
  ])
    delete result[key];
  return result;
}
export function publicPortfolioFilter() {
  return {
    ...publicContentFilter,
    $and: [
      publicContentFilter.$and[0],
      {
        $or: [
          { publishedAt: null },
          { publishedAt: { $exists: false } },
          { publishedAt: { $lte: new Date() } },
        ],
      },
    ],
  };
}
function refresh() {
  for (const path of [
    "/",
    "/blog",
    "/projects",
    "/admin/blog",
    "/admin/portfolio",
    "/sitemap.xml",
  ])
    revalidatePath(path);
  for (const path of ["/blog/[slug]", "/projects/[slug]"])
    revalidatePath(path, "page");
}
export async function getContentPage(
  query: {
    q?: string;
    category?: string;
    status?: string;
    type?: string;
    page?: string;
  },
  publicOnly = true,
  kind?: ContentKind,
) {
  await connectToDatabase();
  const filter: Record<string, unknown> = publicOnly
    ? publicPortfolioFilter()
    : {};
  const type = kind || query.type;
  if (type === "article") filter.contentType = "article";
  else if (type === "project") Object.assign(filter, projectKindFilter);
  if (
    !publicOnly &&
    ["draft", "published", "archived"].includes(query.status || "")
  )
    filter.status = query.status;
  if (query.category && Types.ObjectId.isValid(query.category))
    filter.categoryId = query.category;
  if (typeof query.q === "string" && query.q) {
    const regex = { $regex: escaped(query.q.slice(0, 100)), $options: "i" };
    filter.$or = [
      { title: regex },
      { shortDescription: regex },
      { tags: regex },
    ];
  }
  const total = await PortfolioProject.countDocuments(filter),
    pages = Math.max(1, Math.ceil(total / 12)),
    page = Math.min(pages, Math.max(1, Math.floor(Number(query.page) || 1)));
  const rows = await PortfolioProject.find(filter)
    .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
    .skip((page - 1) * 12)
    .limit(12)
    .populate("categoryId", "name slug scope");
  return {
    rows: rows.map((d) => contentDto(d, publicOnly)),
    total,
    page,
    pages,
  };
}
export async function getFeaturedContent(limit = 4, kind?: ContentKind) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    ...publicPortfolioFilter(),
    featured: true,
  };
  if (kind === "article") filter.contentType = "article";
  else if (kind === "project") Object.assign(filter, projectKindFilter);
  return (
    await PortfolioProject.find(filter)
      .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
      .limit(Math.min(limit, 12))
      .populate("categoryId", "name slug")
  ).map((d) => contentDto(d, true));
}
export const getContentBySlug = cache(
  async (slug: string, kind: ContentKind) => {
    await connectToDatabase();
    const d = await PortfolioProject.findOne({
      ...publicPortfolioFilter(),
      slug,
      ...(kind === "article" ? { contentType: "article" } : projectKindFilter),
    }).populate("categoryId", "name slug");
    return d ? contentDto(d, true) : null;
  },
);
export async function getPortfolioProjectById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await PortfolioProject.findById(id);
  return d ? contentDto(d) : null;
}
async function uniqueSlug(base: string, id?: string) {
  const stem = createSlug(base) || "story";
  let slug = stem,
    n = 2;
  while (
    await PortfolioProject.exists({ slug, ...(id ? { _id: { $ne: id } } : {}) })
  )
    slug = `${stem}-${n++}`;
  return slug;
}
async function prepare(raw: unknown, existing?: any) {
  const merged = { ...existing, ...(raw as object) };
  merged.categoryId ??= "";
  merged.publishedAt = merged.publishedAt || null;
  for (const field of [
    "installationProjectId",
    "rentalBookingId",
    "bellAlarmProjectId",
    "maintenanceJobId",
  ])
    merged[field] ??= "";
  const i = portfolioProjectSchema.parse(merged);
  if (i.categoryId) {
    if (!Types.ObjectId.isValid(i.categoryId))
      throw new SalesError("Select a valid category", 400);
    const category = await PortfolioCategory.findById(i.categoryId);
    if (
      !category ||
      (!category.isActive && i.categoryId !== existing?.categoryId) ||
      (category.scope &&
        category.scope !== "all" &&
        category.scope !== i.contentType)
    )
      throw new SalesError(
        "Choose an active category for this content type",
        400,
      );
  }
  const {
    installationProjectId,
    rentalBookingId,
    bellAlarmProjectId,
    maintenanceJobId,
    ...editable
  } = i;
  // Operational associations are preserved on edit and never created or changed by this CMS.
  void installationProjectId;
  void rentalBookingId;
  void bellAlarmProjectId;
  void maintenanceJobId;
  let slug = i.slug || existing?.slug || i.title;
  if (
    i.contentType === "project" &&
    i.customerName &&
    (i.hideCustomerName || !i.clientPermissionConfirmed)
  ) {
    slug = slug.replace(
      new RegExp(escaped(i.customerName), "gi"),
      "private-client",
    );
    const privateSlug = createSlug(i.customerName);
    if (privateSlug)
      slug = slug.replace(
        new RegExp(escaped(privateSlug), "gi"),
        "private-client",
      );
  }
  const publishedAt = i.publishedAt
    ? new Date(i.publishedAt)
    : i.status === "published"
      ? new Date()
      : null;
  if (publishedAt && publishedAt.getTime() > Date.now() + 60000)
    throw new SalesError(
      "Future publication dates are not supported. Save as draft until ready.",
      400,
    );
  return {
    ...editable,
    slug: await uniqueSlug(slug, existing?.id),
    description: i.richContent ? richText(i.richContent) : i.description,
    categoryId: i.categoryId || null,
    publishedAt,
  };
}
async function withSlugRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const e = error as { code?: number; keyPattern?: { slug?: unknown } };
      if (e.code !== 11000 || !e.keyPattern?.slug) throw error;
    }
  }
  throw new SalesError("Another post used this URL. Try saving again.", 409);
}
export async function createPortfolioProject(raw: unknown, adminId: string) {
  await connectToDatabase();
  const d = await withSlugRetry(async () => {
    const i = await prepare(raw);
    return PortfolioProject.create({
      ...i,
      createdBy: adminId,
      updatedBy: adminId,
    });
  });
  refresh();
  return contentDto(d);
}
export async function updatePortfolioProject(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const existing = await getPortfolioProjectById(id);
  if (!existing) throw new SalesError("Content not found", 404);
  const d = await withSlugRetry(async () => {
    const i = await prepare(raw, existing);
    return PortfolioProject.findByIdAndUpdate(
      id,
      { $set: { ...i, updatedBy: adminId } },
      { returnDocument: "after", runValidators: true },
    );
  });
  if (!d) throw new SalesError("Content not found", 404);
  refresh();
  return contentDto(d);
}
export async function deletePortfolioProject(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new SalesError("Invalid content", 400);
  await connectToDatabase();
  const d = await PortfolioProject.findByIdAndDelete(id);
  if (!d) throw new SalesError("Content not found", 404);
  refresh();
  return { id };
}
export async function getPortfolioCategories(includeInactive = false) {
  await connectToDatabase();
  return (
    await PortfolioCategory.find(
      includeInactive ? {} : { isActive: true },
    ).sort({ sortOrder: 1, name: 1 })
  ).map((d) => contentDto(d));
}
export async function savePortfolioCategory(raw: unknown, id?: string) {
  await connectToDatabase();
  let existing = null;
  if (id) {
    if (!Types.ObjectId.isValid(id))
      throw new SalesError("Invalid category", 400);
    existing = await PortfolioCategory.findById(id);
    if (!existing) throw new SalesError("Category not found", 404);
  }
  const i = portfolioCategorySchema.parse({
    ...existing?.toObject(),
    ...(raw as object),
  });
  if (
    await PortfolioCategory.exists({
      name: { $regex: `^${escaped(i.name)}$`, $options: "i" },
      ...(id ? { _id: { $ne: id } } : {}),
    })
  )
    throw new SalesError("Category already exists", 409);
  if (
    existing &&
    i.scope !== (existing.scope || "all") &&
    (await PortfolioProject.exists({ categoryId: id }))
  )
    throw new SalesError(
      "The category type cannot change while posts use it",
      400,
    );
  let slug = existing?.slug || createSlug(i.slug || i.name) || "category",
    n = 2;
  const base = slug;
  while (
    await PortfolioCategory.exists({
      slug,
      ...(id ? { _id: { $ne: id } } : {}),
    })
  )
    slug = `${base}-${n++}`;
  const d = id
    ? await PortfolioCategory.findByIdAndUpdate(
        id,
        { $set: { ...i, slug } },
        { returnDocument: "after", runValidators: true },
      )
    : await PortfolioCategory.create({ ...i, slug });
  refresh();
  return contentDto(d);
}
export const createPortfolioCategory = (raw: unknown) =>
  savePortfolioCategory(raw);
// Compatibility helpers keep existing modules and links working with the same records.
export async function getPublishedPortfolioProjects(limit = 100) {
  await connectToDatabase();
  return (
    await PortfolioProject.find({
      ...publicPortfolioFilter(),
      ...projectKindFilter,
    })
      .sort({ sortOrder: 1, completionDate: -1 })
      .limit(limit)
      .populate("categoryId", "name slug")
  ).map((d) => contentDto(d, true));
}
export const getFeaturedPortfolioProjects = (limit = 6) =>
  getFeaturedContent(limit, "project");
export const getPortfolioProjectBySlug = (slug: string) =>
  getContentBySlug(slug, "project");
export const getPortfolioProjects = async () =>
  (await getContentPage({}, false, "project")).rows;
export async function getRelatedPortfolioProjects(current: any) {
  await connectToDatabase();
  const type = current.contentType || "project";
  return (
    await PortfolioProject.find({
      ...publicPortfolioFilter(),
      _id: { $ne: current.id },
      ...(type === "article" ? { contentType: "article" } : projectKindFilter),
    })
      .sort({ featured: -1, publishedAt: -1 })
      .limit(3)
      .populate("categoryId", "name slug")
  ).map((d) => contentDto(d, true));
}
export const searchPortfolioProjects = async (q: string) =>
  (await getContentPage({ q }, true, "project")).rows;

export async function getHomepageArticles() {
  await connectToDatabase();
  return (
    await PortfolioProject.find({
      ...publicPortfolioFilter(),
      contentType: "article",
    })
      .sort({ featured: -1, publishedAt: -1, createdAt: -1, _id: 1 })
      .limit(3)
      .populate("categoryId", "name slug")
  ).map((d) => contentDto(d, true));
}
