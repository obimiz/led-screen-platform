import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getPublicBusinessSettings } from "@/services/business-settings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl, absoluteUrl } from "@/lib/seo/urls";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessSettings();
  const defaults = buildPageMetadata(
    {
      title: business.seoDefaultTitle || business.businessName,
      description:
        business.seoDefaultDescription ||
        business.description ||
        business.tagline,
      path: "/",
    },
    business,
  );
  const icon = absoluteUrl(business.faviconUrl);
  return {
    ...defaults,
    alternates: undefined,
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: business.seoDefaultTitle || business.businessName,
      template: `%s | ${business.businessName}`,
    },
    applicationName: business.businessName,
    icons: {
      icon: [
        ...(icon ? [{ url: icon }] : []),
        { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
        {
          url: "/branding/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/branding/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        { url: "/branding/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/branding/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: [icon || "/favicon.ico"],
      apple: [
        {
          url: "/branding/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    verification: {
      ...(business.googleSiteVerification
        ? { google: business.googleSiteVerification }
        : {}),
      ...(business.bingSiteVerification
        ? { other: { "msvalidate.01": business.bingSiteVerification } }
        : {}),
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white font-sans text-slate-950 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
