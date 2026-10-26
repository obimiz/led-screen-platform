import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  defaultHomepageServicesSettings,
  defaultHomepageHeroSettings,
} from "@/lib/constants/homepage";
import { defaultHomepageAccessorySettings } from "@/lib/constants/homepage-accessories";

function homepageCopyFields(defaults: {
  heading: string;
  description: string;
}) {
  return {
    heading: {
      type: String,
      trim: true,
      maxlength: 160,
      default: defaults.heading,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: defaults.description,
    },
  };
}

const heroCopyFields = {
  ...homepageCopyFields(defaultHomepageHeroSettings),
  headingTwo: { type: String, trim: true, maxlength: 160, default: "" },
};
const accessoryCopyFields = homepageCopyFields(
  defaultHomepageAccessorySettings,
);

const servicesCopyFields = {
  ...homepageCopyFields(defaultHomepageServicesSettings),
  buttonLabel: {
    type: String,
    trim: true,
    maxlength: 80,
    default: defaultHomepageServicesSettings.buttonLabel,
  },
  buttonHref: {
    type: String,
    trim: true,
    maxlength: 300,
    default: defaultHomepageServicesSettings.buttonHref,
  },
  items: {
    type: [
      new Schema(
        { title: String, description: String, href: String },
        { _id: false },
      ),
    ],
    default: defaultHomepageServicesSettings.items,
  },
};

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
    homepageServices: servicesCopyFields,
    homepageHero: heroCopyFields,
    homepageAccessories: accessoryCopyFields,
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
const cachedSettingsModel = models.BusinessSettings as
  Model<BusinessSettingsDocument> | undefined;
// next dev retains compiled models across edits. Register new homepage paths on
// that same model so strict update casting cannot silently discard saved copy.
if (cachedSettingsModel) {
  if (!cachedSettingsModel.schema.path("homepageServices.heading"))
    cachedSettingsModel.schema.add({ homepageServices: servicesCopyFields });
  for (const field of ["headingTwo"] as const) {
    if (!cachedSettingsModel.schema.path(`homepageHero.${field}`))
      cachedSettingsModel.schema.add({
        [`homepageHero.${field}`]: heroCopyFields[field],
      });
  }
  if (!cachedSettingsModel.schema.path("homepageHero.heading"))
    cachedSettingsModel.schema.add({
      homepageHero: heroCopyFields,
    });
  if (!cachedSettingsModel.schema.path("homepageAccessories.heading"))
    cachedSettingsModel.schema.add({
      homepageAccessories: accessoryCopyFields,
    });
}
export const BusinessSettingsModel =
  cachedSettingsModel ??
  model<BusinessSettingsDocument>("BusinessSettings", businessSettingsSchema);
