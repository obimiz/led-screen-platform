import { z } from "zod";
import {
  musicContentTypes,
  musicPlatforms,
  musicStatuses,
  musicRights,
} from "@/lib/music/constants";
const s = (n: number) => z.string().trim().max(n).default("");
const url = z
  .union([
    z.literal(""),
    z
      .string()
      .url()
      .refine((v) => /^https?:\/\//.test(v)),
  ])
  .default("");
const mediaUrl = z
  .union([url, z.string().regex(/^\/(?!\/)[^\s]*$/)])
  .default("");
export const musicContentSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    contentType: z.enum(musicContentTypes).default("song"),
    artistName: s(160),
    artistSlug: s(180),
    albumTitle: s(180),
    description: s(10000),
    shortDescription: s(300),
    coverImageUrl: mediaUrl,
    sourcePlatform: z.enum(musicPlatforms).default("external"),
    sourceUrl: url,
    embedUrl: url,
    externalId: s(200),
    duration: s(40),
    releaseDate: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
      .default(""),
    language: s(80),
    genre: s(120),
    liturgicalUse: s(120),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
    status: z.enum(musicStatuses).default("draft"),
    seoTitle: s(180),
    seoDescription: s(320),
    tags: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
    categoryId: z.string().optional(),
    contentRights: z.enum(musicRights).default("unknown"),
    rightsNotes: s(1000),
    audioUrl: mediaUrl,
    audioAssetId: z
      .string()
      .regex(/^$|^[a-f\d]{24}$/i)
      .default(""),
    releaseYear: z.number().int().min(1000).max(9999).nullable().optional(),
    rightsConfirmed: z.boolean().default(false),
    rightsOwner: s(200),
    licenceInformation: s(2000),
    permissionToDistribute: z.boolean().default(false),
  })
  .superRefine((v, c) => {
    if (v.status !== "published") return;
    if (v.sourcePlatform !== "owned" && !v.sourceUrl && !v.embedUrl)
      c.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Provide an official source URL",
      });
    if (v.sourcePlatform === "owned") {
      if (!v.artistName)
        c.addIssue({
          code: "custom",
          path: ["artistName"],
          message: "Enter the artist, choir or composer before publishing",
        });
      if (!v.audioAssetId && !v.audioUrl)
        c.addIssue({
          code: "custom",
          path: ["audioUrl"],
          message: "Upload audio before publishing",
        });
      if (
        !v.rightsConfirmed ||
        !["client-owned", "licensed"].includes(v.contentRights)
      )
        c.addIssue({
          code: "custom",
          path: ["rightsConfirmed"],
          message:
            "Confirm ownership or a licence permitting streaming before publishing",
        });
    }
  });
export const musicCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: s(140),
  description: s(1000),
  imageUrl: url,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});
export const musicArtistSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: s(140),
  bio: s(5000),
  imageUrl: url,
  websiteUrl: url,
  youtubeUrl: url,
  spotifyUrl: url,
  instagramUrl: url,
  facebookUrl: url,
  featured: z.boolean().default(false),
  status: z.enum(musicStatuses).default("draft"),
});
