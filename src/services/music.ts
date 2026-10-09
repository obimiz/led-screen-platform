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
const plain = (d: any) => {
  const v = d.toObject();
  const { _id, __v, ...r } = v;
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
  ).map(plain);
}
export const getFeaturedMusic = async (limit = 12) => {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published", featured: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
  ).map(plain);
};
export const getLatestMusic = async (limit = 12) => {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published" })
      .sort({ releaseDate: -1, createdAt: -1 })
      .limit(limit)
  ).map(plain);
};
export const getMusicBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const d = await MusicContent.findOne({ slug, status: "published" }).populate(
    "categoryId",
    "name slug",
  );
  return d ? plain(d) : null;
});
export async function getMusicAdmin() {
  await connectToDatabase();
  return (await MusicContent.find().sort({ createdAt: -1 }).limit(300)).map(
    plain,
  );
}
export async function getMusicById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const d = await MusicContent.findById(id);
  return d ? plain(d) : null;
}
export async function createMusicContent(raw: unknown, adminId: string) {
  const i = musicContentSchema.parse(raw);
  await connectToDatabase();
  const embed = i.embedUrl || normalizeMusicSourceUrl(i.sourceUrl) || "";
  return plain(
    await MusicContent.create({
      ...i,
      slug: await unique(i.title, MusicContent),
      embedUrl: embed,
      categoryId:
        i.categoryId && Types.ObjectId.isValid(i.categoryId)
          ? i.categoryId
          : null,
      createdBy: adminId,
      updatedBy: adminId,
    }),
  );
}
export async function updateMusicContent(
  id: string,
  raw: unknown,
  adminId: string,
) {
  const i = musicContentSchema.parse(raw);
  await connectToDatabase();
  const d = await MusicContent.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...i,
        embedUrl: i.embedUrl || normalizeMusicSourceUrl(i.sourceUrl) || "",
        updatedBy: adminId,
      },
    },
    { new: true },
  );
  return d ? plain(d) : null;
}
export async function createMusicCategory(raw: unknown) {
  const i = musicCategorySchema.parse(raw);
  await connectToDatabase();
  return plain(
    await MusicCategory.create({
      ...i,
      slug: i.slug || (await unique(i.name, MusicCategory)),
    }),
  );
}
export const getMusicCategories = cache(async () => {
  await connectToDatabase();
  return (
    await MusicCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })
  ).map(plain);
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
  ).map(plain);
}
export const getMusicArtistBySlug = cache(async (slug: string) => {
  await connectToDatabase();
  const a = await MusicArtist.findOne({ slug, status: "published" });
  return a ? plain(a) : null;
});
export async function getRelatedMusic(current: any) {
  await connectToDatabase();
  const filter: any = { status: "published", _id: { $ne: current.id } };
  if (current.categoryId) filter.categoryId = current.categoryId;
  return (await MusicContent.find(filter).limit(6)).map(plain);
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
  ).map(plain);
}

export async function getPublishedArtists() {
  await connectToDatabase();
  return (
    await MusicArtist.find({ status: "published" }).sort({ name: 1 })
  ).map(plain);
}
export async function getMusicForArtist(slug: string) {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published", artistSlug: slug }).sort({
      sortOrder: 1,
      createdAt: -1,
    })
  ).map(plain);
}
export async function getMusicForCategory(id: string) {
  await connectToDatabase();
  return (
    await MusicContent.find({ status: "published", categoryId: id }).sort({
      sortOrder: 1,
      createdAt: -1,
    })
  ).map(plain);
}
