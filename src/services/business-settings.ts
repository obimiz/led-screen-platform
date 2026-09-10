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
  businessName: "LED Screen Platform",
  shortName: "",
  tagline: "",
  description: "",
  logoUrl: "",
  faviconUrl: "",
  primaryEmail: "",
  secondaryEmail: "",
  primaryPhone: "",
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
    businessName: document.businessName,
    shortName: document.shortName,
    tagline: document.tagline,
    description: document.description,
    logoUrl: document.logoUrl,
    faviconUrl: document.faviconUrl,
    primaryEmail: document.primaryEmail,
    secondaryEmail: document.secondaryEmail,
    primaryPhone: document.primaryPhone,
    secondaryPhone: document.secondaryPhone,
    whatsappNumber: document.whatsappNumber,
    addressLine1: document.addressLine1,
    addressLine2: document.addressLine2,
    city: document.city,
    state: document.state,
    country: document.country,
    postalCode: document.postalCode,
    businessHours: document.businessHours,
    googleMapsUrl: document.googleMapsUrl,
    facebookUrl: document.facebookUrl,
    instagramUrl: document.instagramUrl,
    youtubeUrl: document.youtubeUrl,
    linkedinUrl: document.linkedinUrl,
    xUrl: document.xUrl,
    tiktokUrl: document.tiktokUrl,
    updatedAt: document.updatedAt.toISOString(),
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

export const getPublicBusinessSettings = cache(
  async (): Promise<PublicBusinessSettings> => {
    try {
      return toPublicSettings(await getBusinessSettings());
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.warn("Using fallback business settings:", error);
      return {
        businessName: siteConfig.name,
        shortName: "",
        tagline: "",
        description: siteConfig.description,
        logoUrl: "",
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
