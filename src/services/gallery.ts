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
    await GalleryItem.find({ status: "published", featured: true })
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
  return plain(
    await GalleryItem.create({
      ...i,
      videoUrl: i.videoUrl
        ? normalizeGalleryVideoUrl(i.videoUrl) || i.videoUrl
        : "",
      slug: i.slug || (await unique(i.title, GalleryItem)),
      categoryId: Types.ObjectId.isValid(i.categoryId) ? i.categoryId : null,
      portfolioProjectId: Types.ObjectId.isValid(i.portfolioProjectId)
        ? i.portfolioProjectId
        : null,
      createdBy: adminId,
      updatedBy: adminId,
    }),
  );
}
export async function updateGalleryItem(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const i = galleryItemSchema.parse(raw);
  if (i.mediaType === "video" && !normalizeGalleryVideoUrl(i.videoUrl))
    throw new Error("Unsupported video provider");
  await connectToDatabase();
  const d = await GalleryItem.findByIdAndUpdate(
    id,
    {
      $set: {
        ...i,
        videoUrl: i.videoUrl
          ? normalizeGalleryVideoUrl(i.videoUrl) || i.videoUrl
          : "",
        updatedBy: adminId,
      },
    },
    { new: true },
  );
  return d ? plain(d) : null;
}
export async function createGalleryCategory(raw: unknown) {
  const i = galleryCategorySchema.parse(raw);
  await connectToDatabase();
  return plain(
    await GalleryCategory.create({
      ...i,
      slug: i.slug || (await unique(i.name, GalleryCategory)),
    }),
  );
}
export async function getGalleryCategories() {
  await connectToDatabase();
  return (
    await GalleryCategory.find({ isActive: true }).sort({
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
