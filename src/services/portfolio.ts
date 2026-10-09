import { redactPortfolio } from "@/lib/seo/privacy";
import { cache } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */ import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PortfolioProject } from "@/models/portfolio-project";
import { PortfolioCategory } from "@/models/portfolio-category";
import {
  portfolioProjectSchema,
  portfolioCategorySchema,
} from "@/lib/validations/portfolio";
import { createSlug, escapeRegExp } from "@/lib/utils/slug";
const plain = (d: any) => {
  const v = d.toObject();
  const { _id, __v, createdBy, updatedBy, ...r } = JSON.parse(
    JSON.stringify(v),
  );
  return { ...r, id: String(_id) };
};
async function unique(base: string, model: any) {
  const b = createSlug(base) || "project";
  let s = b,
    n = 2;
  while (await model.exists({ slug: s })) s = `${b}-${n++}`;
  return s;
}
export async function getPublishedPortfolioProjects(limit = 100) {
  await connectToDatabase();
  return (
    await PortfolioProject.find({ status: "published" })
      .sort({ featured: -1, sortOrder: 1, completionDate: -1, createdAt: -1 })
      .limit(limit)
      .populate("categoryId", "name slug")
  ).map((d) => redactPortfolio(plain(d)));
}
export async function getFeaturedPortfolioProjects(limit = 6) {
  await connectToDatabase();
  return (
    await PortfolioProject.find({ status: "published", featured: true })
      .sort({ sortOrder: 1, completionDate: -1 })
      .limit(limit)
  ).map((d) => redactPortfolio(plain(d)));
}
export const getPortfolioProjectBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const d = await PortfolioProject.findOne({
    slug,
    status: "published",
  }).populate("categoryId", "name slug");
  return d ? redactPortfolio(plain(d)) : null;
});
export async function getPortfolioProjects() {
  await connectToDatabase();
  return (await PortfolioProject.find().sort({ createdAt: -1 }).limit(300)).map(
    plain,
  );
}
export async function getPortfolioProjectById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await PortfolioProject.findById(id);
  return d ? plain(d) : null;
}
export async function createPortfolioProject(raw: unknown, adminId: string) {
  const i = portfolioProjectSchema.parse(raw);
  await connectToDatabase();
  return plain(
    await PortfolioProject.create({
      ...i,
      slug: i.slug || (await unique(i.title, PortfolioProject)),
      categoryId: Types.ObjectId.isValid(i.categoryId) ? i.categoryId : null,
      createdBy: adminId,
      updatedBy: adminId,
    }),
  );
}
export async function updatePortfolioProject(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const i = portfolioProjectSchema.parse(raw);
  await connectToDatabase();
  const d = await PortfolioProject.findByIdAndUpdate(
    id,
    { $set: { ...i, updatedBy: adminId } },
    { new: true },
  );
  return d ? plain(d) : null;
}
export async function createPortfolioCategory(raw: unknown) {
  const i = portfolioCategorySchema.parse(raw);
  await connectToDatabase();
  return plain(
    await PortfolioCategory.create({
      ...i,
      slug: i.slug || (await unique(i.name, PortfolioCategory)),
    }),
  );
}
export async function getPortfolioCategories() {
  await connectToDatabase();
  return (
    await PortfolioCategory.find({ isActive: true }).sort({
      sortOrder: 1,
      name: 1,
    })
  ).map(plain);
}
export async function getRelatedPortfolioProjects(current: any) {
  await connectToDatabase();
  return (
    await PortfolioProject.find({
      status: "published",
      _id: { $ne: current.id },
      $or: [
        { projectType: current.projectType },
        { categoryId: current.categoryId },
        { state: current.state },
      ],
    }).limit(6)
  ).map((d) => redactPortfolio(plain(d)));
}
export async function searchPortfolioProjects(search: string) {
  await connectToDatabase();
  const q = escapeRegExp(search.slice(0, 100));
  return (
    await PortfolioProject.find({
      status: "published",
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { state: { $regex: q, $options: "i" } },
      ],
    }).limit(100)
  ).map((d) => redactPortfolio(plain(d)));
}
