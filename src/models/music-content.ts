import { Schema, model, models } from "mongoose";
import {
  musicContentTypes,
  musicPlatforms,
  musicStatuses,
  musicRights,
} from "@/lib/music/constants";
const schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, required: true, index: true },
    contentType: { type: String, enum: musicContentTypes, default: "song" },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "MusicCategory",
      default: null,
      index: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "MusicArtist",
      default: null,
      index: true,
    },
    artistName: { type: String, default: "", trim: true },
    artistSlug: { type: String, default: "", trim: true },
    albumTitle: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    sourcePlatform: { type: String, enum: musicPlatforms, default: "external" },
    sourceUrl: { type: String, default: "" },
    embedUrl: { type: String, default: "" },
    externalId: { type: String, default: "" },
    duration: { type: String, default: "" },
    releaseDate: { type: String, default: "" },
    language: { type: String, default: "" },
    genre: { type: String, default: "" },
    liturgicalUse: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: musicStatuses,
      default: "draft",
      index: true,
    },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    tags: [String],
    contentRights: { type: String, enum: musicRights, default: "unknown" },
    rightsNotes: { type: String, default: "" },
    audioAssetId: { type: Schema.Types.ObjectId, default: null, index: true },
    releaseYear: { type: Number, default: null },
    rightsConfirmed: { type: Boolean, default: false },
    rightsOwner: { type: String, default: "" },
    licenceInformation: { type: String, default: "" },
    permissionToDistribute: { type: Boolean, default: false },
    audioUrl: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true },
);
schema.index({ status: 1, featured: 1, sortOrder: 1 });
schema.index(
  {
    title: "text",
    artistName: "text",
    albumTitle: "text",
    description: "text",
    tags: "text",
  },
  // The business language field may be blank or a human-readable language name.
  // It must not become MongoDB's restricted text-index language override.
  { language_override: "musicTextIndexLanguage" },
);
export const MusicContent =
  models.MusicContent || model("MusicContent", schema);
