const configuredUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Lumen Display Solutions",
  description:
    "Professional LED display sales, rental, installation, and support solutions.",
  url: configuredUrl,
  contact: {
    email: "hello@example.com",
    phone: "+234 000 000 0000",
    address: "Nigeria",
  },
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
