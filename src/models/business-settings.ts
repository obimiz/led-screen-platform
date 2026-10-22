import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const businessSettingsSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
      immutable: true,
      select: false,
    },
    homepageImages: {
      bellImageUrl: { type: String, default: "" },
      bellImageAlt: { type: String, default: "", maxlength: 300 },
      cameraImageUrl: { type: String, default: "" },
      cameraImageAlt: { type: String, default: "", maxlength: 300 },
    },
    bellPageDraft: { type: Schema.Types.Mixed, default: null },
    bellPagePublished: { type: Schema.Types.Mixed, default: null },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    shortName: { type: String, trim: true, maxlength: 50, default: "" },
    tagline: { type: String, trim: true, maxlength: 160, default: "" },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    faviconUrl: { type: String, trim: true, default: "" },
    seoDefaultTitle: { type: String, trim: true, default: "" },
    seoDefaultDescription: { type: String, trim: true, default: "" },
    ogImageUrl: { type: String, trim: true, default: "" },
    twitterHandle: { type: String, trim: true, default: "" },
    googleSiteVerification: { type: String, trim: true, default: "" },
    bingSiteVerification: { type: String, trim: true, default: "" },
    primaryEmail: { type: String, trim: true, lowercase: true, default: "" },
    secondaryEmail: { type: String, trim: true, lowercase: true, default: "" },
    primaryPhone: { type: String, trim: true, default: "" },
    secondaryPhone: { type: String, trim: true, default: "" },
    whatsappNumber: { type: String, trim: true, default: "" },
    addressLine1: { type: String, trim: true, default: "" },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "Nigeria" },
    postalCode: { type: String, trim: true, default: "" },
    businessHours: { type: String, trim: true, default: "" },
    googleMapsUrl: { type: String, trim: true, default: "" },
    facebookUrl: { type: String, trim: true, default: "" },
    instagramUrl: { type: String, trim: true, default: "" },
    youtubeUrl: { type: String, trim: true, default: "" },
    linkedinUrl: { type: String, trim: true, default: "" },
    xUrl: { type: String, trim: true, default: "" },
    tiktokUrl: { type: String, trim: true, default: "" },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      select: false,
    },
  },
  { timestamps: true },
);

export type BusinessSettingsDocument = InferSchemaType<
  typeof businessSettingsSchema
>;
export const BusinessSettingsModel =
  (models.BusinessSettings as Model<BusinessSettingsDocument> | undefined) ??
  model<BusinessSettingsDocument>("BusinessSettings", businessSettingsSchema);
