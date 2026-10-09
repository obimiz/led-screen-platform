import "server-only";

import { cache } from "react";

import { siteConfig } from "@/lib/config/site";
import { connectToDatabase } from "@/lib/db/mongoose";
import type { BusinessSettingsValues } from "@/lib/validations/business-settings";
import {
  BusinessSettingsModel,
  type BusinessSettingsDocument,
} from "@/models/business-settings";
import type {
  BusinessSettings,
  PublicBusinessSettings,
} from "@/types/business-settings";

export const defaultBusinessSettings: BusinessSettingsValues = {
  businessName: siteConfig.name,
  seoDefaultTitle: "",
  seoDefaultDescription: "",
  ogImageUrl: "",
  twitterHandle: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  shortName: "",
  tagline: "",
  description: "",
  logoUrl: "/branding/image-grant-technology-logo.jpeg",
  faviconUrl: "",
  primaryEmail: "",
  secondaryEmail: "",
  primaryPhone: "+234 803 930 8982",
  secondaryPhone: "",
  whatsappNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "Nigeria",
  postalCode: "",
  businessHours: "",
  googleMapsUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  xUrl: "",
  tiktokUrl: "",
};

function toSettings(
  document: BusinessSettingsDocument & { updatedAt: Date },
): BusinessSettings {
  return {
    seoDefaultTitle: document.seoDefaultTitle ?? "",
    seoDefaultDescription: document.seoDefaultDescription ?? "",
    ogImageUrl: document.ogImageUrl ?? "",
    twitterHandle: document.twitterHandle ?? "",
    googleSiteVerification: document.googleSiteVerification ?? "",
    bingSiteVerification: document.bingSiteVerification ?? "",
    businessName: document.businessName ?? defaultBusinessSettings.businessName,
    shortName: document.shortName ?? defaultBusinessSettings.shortName,
    tagline: document.tagline ?? defaultBusinessSettings.tagline,
    description: document.description ?? defaultBusinessSettings.description,
    logoUrl: document.logoUrl ?? defaultBusinessSettings.logoUrl,
    faviconUrl: document.faviconUrl ?? defaultBusinessSettings.faviconUrl,
    primaryEmail: document.primaryEmail ?? defaultBusinessSettings.primaryEmail,
    secondaryEmail:
      document.secondaryEmail ?? defaultBusinessSettings.secondaryEmail,
    primaryPhone: document.primaryPhone ?? defaultBusinessSettings.primaryPhone,
    secondaryPhone:
      document.secondaryPhone ?? defaultBusinessSettings.secondaryPhone,
    whatsappNumber:
      document.whatsappNumber ?? defaultBusinessSettings.whatsappNumber,
    addressLine1: document.addressLine1 ?? defaultBusinessSettings.addressLine1,
    addressLine2: document.addressLine2 ?? defaultBusinessSettings.addressLine2,
    city: document.city ?? defaultBusinessSettings.city,
    state: document.state ?? defaultBusinessSettings.state,
    country: document.country ?? defaultBusinessSettings.country,
    postalCode: document.postalCode ?? defaultBusinessSettings.postalCode,
    businessHours:
      document.businessHours ?? defaultBusinessSettings.businessHours,
    googleMapsUrl:
      document.googleMapsUrl ?? defaultBusinessSettings.googleMapsUrl,
    facebookUrl: document.facebookUrl ?? defaultBusinessSettings.facebookUrl,
    instagramUrl: document.instagramUrl ?? defaultBusinessSettings.instagramUrl,
    youtubeUrl: document.youtubeUrl ?? defaultBusinessSettings.youtubeUrl,
    linkedinUrl: document.linkedinUrl ?? defaultBusinessSettings.linkedinUrl,
    xUrl: document.xUrl ?? defaultBusinessSettings.xUrl,
    tiktokUrl: document.tiktokUrl ?? defaultBusinessSettings.tiktokUrl,
    updatedAt:
      document.updatedAt instanceof Date ? document.updatedAt.toISOString() : "",
  };
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  await connectToDatabase();
  const document = await BusinessSettingsModel.findOneAndUpdate(
    { singletonKey: "primary" },
    { $setOnInsert: { ...defaultBusinessSettings, singletonKey: "primary" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  if (!document) throw new Error("Business settings could not be loaded.");
  return toSettings(document);
}

export async function updateBusinessSettings(
  input: BusinessSettingsValues,
  adminId: string,
): Promise<BusinessSettings> {
  await connectToDatabase();
  const document = await BusinessSettingsModel.findOneAndUpdate(
    { singletonKey: "primary" },
    {
      $set: { ...input, updatedBy: adminId },
      $setOnInsert: { singletonKey: "primary" },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  if (!document) throw new Error("Business settings could not be updated.");
  return toSettings(document);
}

function toPublicSettings(settings: BusinessSettings): PublicBusinessSettings {
  const address = [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.state,
    settings.postalCode,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");
  const socialLinks = [
    { label: "Facebook", url: settings.facebookUrl },
    { label: "Instagram", url: settings.instagramUrl },
    { label: "YouTube", url: settings.youtubeUrl },
    { label: "LinkedIn", url: settings.linkedinUrl },
    { label: "X", url: settings.xUrl },
    { label: "TikTok", url: settings.tiktokUrl },
  ].filter((item) => Boolean(item.url));
  return {
    seoDefaultTitle: settings.seoDefaultTitle,
    seoDefaultDescription: settings.seoDefaultDescription,
    ogImageUrl: settings.ogImageUrl,
    twitterHandle: settings.twitterHandle,
    googleSiteVerification: settings.googleSiteVerification,
    bingSiteVerification: settings.bingSiteVerification,
    hasPhysicalAddress: Boolean(settings.addressLine1 && settings.city),
    businessName: settings.businessName,
    shortName: settings.shortName,
    tagline: settings.tagline,
    description: settings.description,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    primaryEmail: settings.primaryEmail,
    secondaryEmail: settings.secondaryEmail,
    primaryPhone: settings.primaryPhone,
    secondaryPhone: settings.secondaryPhone,
    whatsappNumber: settings.whatsappNumber,
    address,
    businessHours: settings.businessHours,
    googleMapsUrl: settings.googleMapsUrl,
    socialLinks,
  };
}

// Formal documents must fail visibly if settings cannot be loaded, rather than
// printing fallback example contact information.
export async function getDocumentBusinessSettings(): Promise<PublicBusinessSettings> {
  return toPublicSettings(await getBusinessSettings());
}

export const getPublicBusinessSettings = cache(
  async (): Promise<PublicBusinessSettings> => {
    try {
      return toPublicSettings(await getBusinessSettings());
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.warn("Using fallback business settings:", error);
      return {
        seoDefaultTitle: "",
        seoDefaultDescription: "",
        ogImageUrl: "",
        twitterHandle: "",
        googleSiteVerification: "",
        bingSiteVerification: "",
        hasPhysicalAddress: false,
        businessName: siteConfig.name,
        shortName: "",
        tagline: "",
        description: siteConfig.description,
        logoUrl: "/branding/image-grant-technology-logo.jpeg",
        faviconUrl: "",
        primaryEmail: siteConfig.contact.email,
        secondaryEmail: "",
        primaryPhone: siteConfig.contact.phone,
        secondaryPhone: "",
        whatsappNumber: "",
        address: siteConfig.contact.address,
        businessHours: "",
        googleMapsUrl: "",
        socialLinks: [],
      };
    }
  },
);
