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
    ...(icon ? { icons: { icon } } : {}),
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
