import { revalidatePath } from "next/cache";
import { Product } from "@/models/product";
import { SalesError } from "@/lib/sales/calculations";
import { cache } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */ import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { GalleryItem } from "@/models/gallery-item";
import { GalleryCategory } from "@/models/gallery-category";
import { Testimonial } from "@/models/testimonial";
import {
  galleryItemSchema,
  galleryCategorySchema,
  testimonialSchema,
} from "@/lib/validations/gallery";
import { createSlug, escapeRegExp } from "@/lib/utils/slug";
import { normalizeGalleryVideoUrl } from "@/lib/gallery/media";
const plain = (d: any) => {
  const v = d.toObject();
  const { _id, __v, createdBy, updatedBy, customerName, ...r } = JSON.parse(
    JSON.stringify(v),
  );
  return { ...r, id: String(_id) };
};
async function unique(base: string, m: any) {
  const b = createSlug(base) || "item";
  let s = b,
    n = 2;
  while (await m.exists({ slug: s })) s = `${b}-${n++}`;
  return s;
}
export async function getPublishedGalleryItems(limit = 100) {
  await connectToDatabase();
  return (
    await GalleryItem.find({ status: "published" })
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .limit(limit)
  ).map(plain);
}
export async function getFeaturedGalleryItems(limit = 8) {
  await connectToDatabase();
  return (
    await GalleryItem.find({
      status: "published",
      featured: true,
      mediaType: "image",
    })
      .sort({ sortOrder: 1 })
      .limit(limit)
  ).map(plain);
}
export async function getGalleryItems() {
  await connectToDatabase();
  return (await GalleryItem.find().sort({ createdAt: -1 }).limit(300)).map(
    plain,
  );
}
export async function getGalleryItemById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await GalleryItem.findById(id);
  return d ? plain(d) : null;
}
export const getGalleryItemBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const d = await GalleryItem.findOne({ slug, status: "published" });
  return d ? plain(d) : null;
});
export async function createGalleryItem(raw: unknown, adminId: string) {
  const i = galleryItemSchema.parse(raw);
  if (i.mediaType === "video" && !normalizeGalleryVideoUrl(i.videoUrl))
    throw new Error("Unsupported video provider");
  await connectToDatabase();
  await validateGalleryReferences(i);
  const created = plain(
    await GalleryItem.create({
      ...i,
      videoUrl: i.videoUrl
        ? normalizeGalleryVideoUrl(i.videoUrl) || i.videoUrl
        : "",
      slug: i.slug || (await unique(i.title, GalleryItem)),
      categoryId: i.categoryId || null,
      productId: i.productId || null,
      portfolioProjectId: Types.ObjectId.isValid(i.portfolioProjectId)
        ? i.portfolioProjectId
        : null,
      createdBy: adminId,
      updatedBy: adminId,
    }),
  );
  refreshGallery();
  return created;
}
export async function updateGalleryItem(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const existing = await getGalleryItemById(id);
  if (!existing) throw new SalesError("Gallery item not found", 404);
  const merged = { ...existing, ...(raw as object) };
  for (const key of ["categoryId", "productId", "portfolioProjectId"])
    merged[key] ??= "";
  const i = galleryItemSchema.parse(merged);
  if (i.mediaType === "video" && !normalizeGalleryVideoUrl(i.videoUrl))
    throw new SalesError("Unsupported video provider", 400);
  await validateGalleryReferences(i, existing.categoryId);
  const d = await GalleryItem.findByIdAndUpdate(
    id,
    {
      $set: {
        ...i,
        categoryId: i.categoryId || null,
        productId: i.productId || null,
        portfolioProjectId: i.portfolioProjectId || null,
        videoUrl: i.videoUrl
          ? normalizeGalleryVideoUrl(i.videoUrl) || i.videoUrl
          : "",
        updatedBy: adminId,
      },
    },
    { returnDocument: "after", runValidators: true },
  );
  refreshGallery();
  return d ? plain(d) : null;
}
function refreshGallery() {
  for (const path of ["/", "/gallery", "/admin/gallery"]) revalidatePath(path);
  revalidatePath("/gallery/[slug]", "page");
}
async function validateGalleryReferences(
  i: { categoryId: string; productId: string },
  previousCategory?: string,
) {
  for (const [key, value, model] of [
    ["category", i.categoryId, GalleryCategory],
    ["product", i.productId, Product],
  ] as const) {
    if (
      value &&
      (!Types.ObjectId.isValid(value) || !(await model.exists({ _id: value })))
    )
      throw new SalesError(`Choose a valid ${key}`, 400);
  }
  if (
    i.categoryId &&
    i.categoryId !== previousCategory &&
    !(await GalleryCategory.exists({ _id: i.categoryId, isActive: true }))
  )
    throw new SalesError("Choose an active category", 400);
}
export async function getGalleryPage(
  query: { q?: string; category?: string; status?: string; page?: string },
  publicOnly = false,
) {
  await connectToDatabase();
  const filter: Record<string, unknown> = publicOnly
    ? { status: "published" }
    : {};
  if (
    !publicOnly &&
    ["draft", "published", "archived"].includes(query.status || "")
  )
    filter.status = query.status;
  if (query.category && Types.ObjectId.isValid(query.category))
    filter.categoryId = query.category;
  if (query.q)
    filter.title = {
      $regex: escapeRegExp(query.q.slice(0, 100)),
      $options: "i",
    };
  const total = await GalleryItem.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / 24));
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(query.page) || 1)),
  );
  const rows = await GalleryItem.find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .skip((page - 1) * 24)
    .limit(24);
  return { rows: rows.map(plain), total, page, pages };
}
export async function getGalleryFormOptions() {
  await connectToDatabase();
  const products = await Product.find().select("name").sort({ name: 1 }).lean();
  return {
    categories: await getGalleryCategories(true),
    products: products.map((p) => ({ id: String(p._id), name: p.name })),
  };
}
export async function updateGalleryCategory(id: string, raw: unknown) {
  if (!Types.ObjectId.isValid(id))
    throw new SalesError("Invalid category", 400);
  const existing = await GalleryCategory.findById(id);
  if (!existing) throw new SalesError("Category not found", 404);
  const i = galleryCategorySchema.parse({
    ...existing.toObject(),
    ...(raw as object),
  });
  if (
    await GalleryCategory.exists({
      _id: { $ne: id },
      name: { $regex: `^${escapeRegExp(i.name)}$`, $options: "i" },
    })
  )
    throw new SalesError("Category already exists", 409);
  const result = await GalleryCategory.findByIdAndUpdate(
    id,
    { $set: i },
    { returnDocument: "after", runValidators: true },
  );
  refreshGallery();
  return plain(result);
}
export async function createGalleryCategory(raw: unknown) {
  const i = galleryCategorySchema.parse(raw);
  await connectToDatabase();
  if (
    await GalleryCategory.exists({
      name: { $regex: `^${escapeRegExp(i.name)}$`, $options: "i" },
    })
  )
    throw new SalesError("Category already exists", 409);
  return plain(
    await GalleryCategory.create({
      ...i,
      slug: i.slug || (await unique(i.name, GalleryCategory)),
    }),
  );
}
export async function getGalleryCategories(includeInactive = false) {
  await connectToDatabase();
  return (
    await GalleryCategory.find(includeInactive ? {} : { isActive: true }).sort({
      sortOrder: 1,
      name: 1,
    })
  ).map(plain);
}
export async function getPublishedTestimonials(limit = 100) {
  await connectToDatabase();
  return (
    await Testimonial.find({ status: "published", consentConfirmed: true })
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .limit(limit)
  ).map(plain);
}
export async function getFeaturedTestimonials(limit = 6) {
  await connectToDatabase();
  return (
    await Testimonial.find({
      status: "published",
      consentConfirmed: true,
      featured: true,
    })
      .sort({ sortOrder: 1 })
      .limit(limit)
  ).map(plain);
}
export async function getTestimonials() {
  await connectToDatabase();
  return (await Testimonial.find().sort({ createdAt: -1 }).limit(300)).map(
    plain,
  );
}
export async function getTestimonialsByProject(id: string) {
  await connectToDatabase();
  return (
    await Testimonial.find({
      portfolioProjectId: id,
      status: "published",
      consentConfirmed: true,
    }).limit(20)
  ).map(plain);
}
export async function createTestimonial(raw: unknown, adminId: string) {
  const i = testimonialSchema.parse(raw);
  await connectToDatabase();
  return plain(
    await Testimonial.create({
      ...i,
      portfolioProjectId: Types.ObjectId.isValid(i.portfolioProjectId)
        ? i.portfolioProjectId
        : null,
      createdBy: adminId,
      updatedBy: adminId,
    }),
  );
}
export async function updateTestimonial(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const i = testimonialSchema.parse(raw);
  await connectToDatabase();
  const d = await Testimonial.findByIdAndUpdate(
    id,
    { $set: { ...i, updatedBy: adminId } },
    { new: true },
  );
  return d ? plain(d) : null;
}
export async function getGalleryItemsByProject(id: string) {
  await connectToDatabase();
  return (
    await GalleryItem.find({
      portfolioProjectId: id,
      status: "published",
    }).limit(50)
  ).map(plain);
}
export async function searchGallery(q: string) {
  await connectToDatabase();
  const r = escapeRegExp(q.slice(0, 100));
  return (
    await GalleryItem.find({
      status: "published",
      $or: [
        { title: { $regex: r, $options: "i" } },
        { city: { $regex: r, $options: "i" } },
      ],
    }).limit(100)
  ).map(plain);
}
