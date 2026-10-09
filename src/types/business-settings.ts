import type { BusinessSettingsValues } from "@/lib/validations/business-settings";

export type BusinessSettings = BusinessSettingsValues & {
  updatedAt: string;
};

export type PublicBusinessSettings = {
  seoDefaultTitle?: string;
  seoDefaultDescription?: string;
  ogImageUrl?: string;
  twitterHandle?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  hasPhysicalAddress?: boolean;
  businessName: string;
  shortName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  primaryEmail: string;
  secondaryEmail: string;
  primaryPhone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  googleMapsUrl: string;
  socialLinks: Array<{ label: string; url: string }>;
};
