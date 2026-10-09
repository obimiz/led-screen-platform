import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";
import type { PublicBusinessSettings } from "@/types/business-settings";
import {
  absoluteUrl,
  buildCanonicalUrl,
  isSearchIndexingAllowed,
} from "./urls";

export function getRobotsMetadata({
  index = true,
  follow = true,
}: { index?: boolean; follow?: boolean } = {}): Metadata["robots"] {
  return {
    index: index && isSearchIndexingAllowed(),
    follow: follow && isSearchIndexingAllowed(),
  };
}
export type PageSeo = {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
  follow?: boolean;
  page?: number;
};
export function buildPageMetadata(
  input: PageSeo,
  business: PublicBusinessSettings,
): Metadata {
  const title = input.title;
  const description =
    input.description ||
    business.seoDefaultDescription ||
    business.description ||
    business.tagline ||
    siteConfig.description;
  const url = buildCanonicalUrl(input.path, input.page);
  const image =
    absoluteUrl(input.image || "") ||
    absoluteUrl(business.ogImageUrl || "") ||
    absoluteUrl("/branding/image-grant-technology-logo.jpeg");
  const shareTitle =
    title === business.businessName
      ? title
      : `${title} | ${business.businessName}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: getRobotsMetadata(input),
    openGraph: {
      type: "website",
      title: shareTitle,
      description,
      url,
      siteName: business.businessName,
      locale: "en_NG",
      images: image ? [{ url: image, alt: title }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: shareTitle,
      description,
      images: image ? [image] : [],
      ...(business.twitterHandle ? { site: business.twitterHandle } : {}),
    },
  };
}
export type SeoProduct = {
  name: string;
  slug: string;
  productType: string;
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  shortDescription?: string;
  featuredImageUrl?: string;
  sku?: string;
  brand?: string;
  priceType?: string;
  price?: number | null;
  currency?: string;
  stockStatus?: string;
};
export function productPath(
  product: Pick<SeoProduct, "productType" | "slug">,
): string {
  const routes: Record<string, string> = {
    "led-screen": "/led-screens",
    "led-accessory": "/led-accessories",
    "bell-alarm-system": "/electronic-bell-alarm/products",
    "bell-alarm-accessory": "/electronic-bell-alarm/accessories",
  };
  if (!routes[product.productType])
    throw new Error("Unsupported public product type");
  return `${routes[product.productType]}/${encodeURIComponent(product.slug)}`;
}
export function buildProductMetadata(
  product: SeoProduct,
  business: PublicBusinessSettings,
): Metadata {
  return buildPageMetadata(
    {
      title: product.seoTitle || product.name,
      description:
        product.seoDescription ||
        product.shortDescription ||
        `Explore ${product.name} and enquire about its suitability for your requirements.`,
      path: productPath(product),
      image: product.featuredImageUrl,
      index: product.status === "published",
    },
    business,
  );
}
export type SeoPortfolio = {
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  shortDescription?: string;
  coverImageUrl?: string;
  status: string;
};
export function buildPortfolioMetadata(
  project: SeoPortfolio,
  business: PublicBusinessSettings,
): Metadata {
  return buildPageMetadata(
    {
      title: project.seoTitle || project.title,
      description:
        project.seoDescription || project.shortDescription || project.title,
      path: `/projects/${encodeURIComponent(project.slug)}`,
      image: project.coverImageUrl,
      index: project.status === "published",
    },
    business,
  );
}
export type SeoMusic = SeoPortfolio & {
  artistName?: string;
  description?: string;
  categoryId?: { name?: string } | null;
};
export function buildMusicMetadata(
  item: SeoMusic,
  business: PublicBusinessSettings,
): Metadata {
  return buildPageMetadata(
    {
      title:
        item.seoTitle ||
        [item.title, item.artistName].filter(Boolean).join(" — "),
      description:
        item.seoDescription ||
        item.shortDescription ||
        item.description ||
        [
          item.title,
          item.artistName,
          item.categoryId?.name,
          "Listen through the linked music provider.",
        ]
          .filter(Boolean)
          .join(" · "),
      path: `/music/${encodeURIComponent(item.slug)}`,
      image: item.coverImageUrl,
      index: item.status === "published",
    },
    business,
  );
}
export type SearchValues = Record<string, string | string[] | undefined>;
export function listingSeo(search: SearchValues): {
  index: boolean;
  page?: number;
} {
  const active = Object.entries(search).filter(([, value]) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value),
  );
  const filtered = active.some(
    ([key]) =>
      key !== "page" &&
      !key.startsWith("utm_") &&
      !["gclid", "fbclid"].includes(key),
  );
  const page =
    typeof search.page === "string" && /^[1-9]\d*$/.test(search.page)
      ? Number(search.page)
      : undefined;
  // Search/filter results and uncurated pagination are not landing pages. Pagination retains its own canonical.
  return {
    index: !filtered && (!search.page || page === 1),
    page: !filtered ? page : undefined,
  };
}
