import { revalidatePath } from "next/cache";
import { musicAudioBucket } from "@/lib/music/storage";
import { SalesError } from "@/lib/sales/calculations";
import { cache } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */ import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { MusicContent } from "@/models/music-content";
import { MusicCategory } from "@/models/music-category";
import { MusicArtist } from "@/models/music-artist";
import { createSlug, escapeRegExp } from "@/lib/utils/slug";
import {
  musicContentSchema,
  musicCategorySchema,
  musicArtistSchema,
} from "@/lib/validations/music";
import { normalizeMusicSourceUrl } from "@/lib/music/embeds";
const plain = (d: any, publicOnly = false) => {
  const { _id, __v, ...r } = JSON.parse(JSON.stringify(d.toObject()));
  void __v;
  if (publicOnly)
    for (const key of [
      "createdBy",
      "updatedBy",
      "rightsNotes",
      "rightsOwner",
      "licenceInformation",
      "permissionToDistribute",
    ])
      delete r[key];
  return { ...r, id: String(_id) };
};
async function unique(base: string, model: any) {
  let s = createSlug(base) || "music";
  let n = 2;
  while (await model.exists({ slug: s })) s = `${createSlug(base)}-${n++}`;
  return s;
}
export async function getPublishedMusic(limit = 100) {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published" })
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .populate("categoryId", "name slug")
  ).map((d) => plain(d, true));
}
export const getFeaturedMusic = async (limit = 12) => {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published", featured: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .populate("categoryId", "name slug")
  ).map((d) => plain(d, true));
};
export const getLatestMusic = async (limit = 12) => {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published" })
      .sort({ releaseDate: -1, createdAt: -1 })
      .limit(limit)
  ).map((d) => plain(d, true));
};
export const getMusicBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const d = await MusicContent.findOne({ slug, status: "published" }).populate(
    "categoryId",
    "name slug",
  );
  return d ? plain(d, true) : null;
});
export async function getMusicAdmin() {
  await connectToDatabase();
  return (await MusicContent.find().sort({ createdAt: -1 }).limit(300)).map(
    (d) => plain(d),
  );
}
export async function getMusicById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await MusicContent.findById(id);
  return d ? plain(d) : null;
}
function refreshMusic() {
  for (const path of ["/music", "/music/browse", "/admin/music", "/"])
    revalidatePath(path);
  for (const path of [
    "/music/[slug]",
    "/music/category/[slug]",
    "/music/artists/[slug]",
  ])
    revalidatePath(path, "page");
}
async function prepareMusic(raw: unknown, existing?: any) {
  const merged = { ...(existing || {}), ...(raw as object) };
  for (const key of ["categoryId", "audioAssetId"]) merged[key] ??= "";
  const i = musicContentSchema.parse(merged);
  if (i.categoryId) {
    if (
      !Types.ObjectId.isValid(i.categoryId) ||
      !(await MusicCategory.exists({ _id: i.categoryId }))
    )
      throw new SalesError("Choose a valid music category", 400);
    if (
      i.categoryId !== existing?.categoryId &&
      !(await MusicCategory.exists({ _id: i.categoryId, isActive: true }))
    )
      throw new SalesError("Choose an active category", 400);
  }
  if (i.audioAssetId) {
    const bucket = await musicAudioBucket();
    if (
      !(await bucket
        .find({
          _id: new Types.ObjectId(i.audioAssetId),
          "metadata.ready": true,
        })
        .next())
    )
      throw new SalesError("Select a stored audio upload", 400);
  }
  const embed =
    normalizeMusicSourceUrl(i.sourceUrl) ||
    normalizeMusicSourceUrl(i.embedUrl) ||
    "";
  return {
    ...i,
    categoryId: i.categoryId || null,
    audioAssetId: i.audioAssetId || null,
    audioUrl: i.audioAssetId
      ? `/api/music/audio/${i.audioAssetId}`
      : i.audioUrl,
    embedUrl: embed,
  };
}
export async function createMusicContent(raw: unknown, adminId: string) {
  await connectToDatabase();
  const i = await prepareMusic(raw);
  const d = await MusicContent.create({
    ...i,
    slug: await unique(i.title, MusicContent),
    createdBy: adminId,
    updatedBy: adminId,
  });
  refreshMusic();
  return plain(d);
}
export async function updateMusicContent(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const existing = await getMusicById(id);
  if (!existing) throw new SalesError("Music not found", 404);
  const i = await prepareMusic(raw, existing);
  const d = await MusicContent.findByIdAndUpdate(
    id,
    { $set: { ...i, updatedBy: adminId } },
    { returnDocument: "after", runValidators: true },
  );
  refreshMusic();
  return d ? plain(d) : null;
}
export async function getMusicPublicById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await MusicContent.findOne({ _id: id, status: "published" });
  return d ? plain(d, true) : null;
}
export async function getMusicPage(
  query: { q?: string; category?: string; status?: string; page?: string },
  publicOnly = true,
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
  if (typeof query.q === "string" && query.q) {
    const pattern = {
      $regex: escapeRegExp(query.q.slice(0, 100)),
      $options: "i",
    };
    filter.$or = [{ title: pattern }, { artistName: pattern }];
  }
  const total = await MusicContent.countDocuments(filter),
    pages = Math.max(1, Math.ceil(total / 24));
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(query.page) || 1)),
  );
  const rows = await MusicContent.find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .skip((page - 1) * 24)
    .limit(24)
    .populate("categoryId", "name slug");
  return { rows: rows.map((d) => plain(d, publicOnly)), total, page, pages };
}
export async function updateMusicCategory(id: string, raw: unknown) {
  if (!Types.ObjectId.isValid(id))
    throw new SalesError("Invalid category", 400);
  await connectToDatabase();
  const existing = await MusicCategory.findById(id);
  if (!existing) throw new SalesError("Category not found", 404);
  const i = musicCategorySchema.parse({
    ...existing.toObject(),
    ...(raw as object),
  });
  if (
    await MusicCategory.exists({
      _id: { $ne: id },
      name: { $regex: `^${escapeRegExp(i.name)}$`, $options: "i" },
    })
  )
    throw new SalesError("Category already exists", 409);
  const d = await MusicCategory.findByIdAndUpdate(
    id,
    { $set: i },
    { returnDocument: "after", runValidators: true },
  );
  refreshMusic();
  return plain(d);
}
export async function createMusicCategory(raw: unknown) {
  const i = musicCategorySchema.parse(raw);
  await connectToDatabase();
  if (
    await MusicCategory.exists({
      name: { $regex: `^${escapeRegExp(i.name)}$`, $options: "i" },
    })
  )
    throw new SalesError("Category already exists", 409);
  return plain(
    await MusicCategory.create({
      ...i,
      slug: i.slug || (await unique(i.name, MusicCategory)),
    }),
  );
}
export const getMusicCategories = cache(async (includeInactive = false) => {
  await connectToDatabase();
  return (
    await MusicCategory.find(includeInactive ? {} : { isActive: true }).sort({
      sortOrder: 1,
      name: 1,
    })
  ).map((d) => plain(d, true));
});
export async function createMusicArtist(raw: unknown) {
  const i = musicArtistSchema.parse(raw);
  await connectToDatabase();
  return plain(
    await MusicArtist.create({
      ...i,
      slug: i.slug || (await unique(i.name, MusicArtist)),
    }),
  );
}
export async function getFeaturedArtists() {
  await connectToDatabase();
  return (
    await MusicArtist.find({ status: "published", featured: true })
      .sort({ name: 1 })
      .limit(20)
  ).map((d) => plain(d, true));
}
export const getMusicArtistBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const a = await MusicArtist.findOne({ slug, status: "published" });
  return a ? plain(a) : null;
});
export async function getRelatedMusic(current: any) {
  await connectToDatabase();
  const filter: any = { status: "published", _id: { $ne: current.id } };
  const category =
    current.categoryId?.id || current.categoryId?._id || current.categoryId;
  if (category && Types.ObjectId.isValid(category))
    filter.categoryId = category;
  return (
    await MusicContent.find(filter).limit(6).populate("categoryId", "name slug")
  ).map((d) => plain(d, true));
}
export async function searchMusic(search: string) {
  await connectToDatabase();
  const q = escapeRegExp(search.slice(0, 100));
  return (
    await MusicContent.find({
      status: "published",
      $or: [
        { title: { $regex: q, $options: "i" } },
        { artistName: { $regex: q, $options: "i" } },
        { albumTitle: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    }).limit(100)
  ).map((d) => plain(d, true));
}

export async function getPublishedArtists() {
  await connectToDatabase();
  return (
    await MusicArtist.find({ status: "published" }).sort({ name: 1 })
  ).map((d) => plain(d, true));
}
export async function getMusicForArtist(slug: string) {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published", artistSlug: slug })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .limit(100)
  ).map((d) => plain(d, true));
}
export async function getMusicForCategory(id: string) {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published", categoryId: id })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .limit(100)
  ).map((d) => plain(d, true));
}
