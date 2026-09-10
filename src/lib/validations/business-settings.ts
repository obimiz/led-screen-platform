import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).default("");
const optionalEmail = z
  .union([
    z.literal(""),
    z.string().trim().toLowerCase().email("Enter a valid email address"),
  ])
  .default("");
const optionalUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("Enter a valid URL")
      .refine(
        (url) => url.startsWith("https://") || url.startsWith("http://"),
        "URL must use http or https",
      ),
  ])
  .default("");
const optionalPhone = z
  .string()
  .trim()
  .default("")
  .refine(
    (value) => !value || /^[+\d][\d\s().-]+$/.test(value),
    "Enter a valid phone number",
  )
  .refine((value) => {
    const digitCount = value.replace(/\D/g, "").length;
    return !value || (digitCount >= 7 && digitCount <= 15);
  }, "Phone number must contain 7 to 15 digits");

export const businessSettingsSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Business name is required")
      .max(120),
    shortName: optionalText(50),
    tagline: optionalText(160),
    description: optionalText(2000),
    logoUrl: optionalUrl,
    faviconUrl: optionalUrl,
    primaryEmail: optionalEmail,
    secondaryEmail: optionalEmail,
    primaryPhone: optionalPhone,
    secondaryPhone: optionalPhone,
    whatsappNumber: optionalPhone,
    addressLine1: optionalText(200),
    addressLine2: optionalText(200),
    city: optionalText(100),
    state: optionalText(100),
    country: optionalText(100),
    postalCode: optionalText(30),
    businessHours: optionalText(1000),
    googleMapsUrl: optionalUrl,
    facebookUrl: optionalUrl,
    instagramUrl: optionalUrl,
    youtubeUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    xUrl: optionalUrl,
    tiktokUrl: optionalUrl,
  })
  .strict();

export type BusinessSettingsInput = z.input<typeof businessSettingsSchema>;
export type BusinessSettingsValues = z.output<typeof businessSettingsSchema>;
