const configuredUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "Image Grant Technology",
  description:
    "Professional LED display sales, rental, installation, and support solutions.",
  url: configuredUrl,
  contact: {
    email: "",
    phone: "+234 803 930 8982",
    address: "",
  },
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
