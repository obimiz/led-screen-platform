import type { Metadata } from "next";
import { buildPageMetadata } from "./metadata";
import { absoluteUrl, buildCanonicalUrl, getSiteUrl } from "./urls";
import type { PublicBusinessSettings } from "@/types/business-settings";
import type { PublishingEntry } from "@/components/publishing/card";
export function buildArticleMetadata(
  item: PublishingEntry,
  business: PublicBusinessSettings,
): Metadata {
  const base = buildPageMetadata(
    {
      title: item.seoTitle || item.title,
      description: item.seoDescription || item.shortDescription || item.title,
      path: `/blog/${item.slug}`,
      image: item.coverImageUrl,
      index: item.status === "published",
    },
    business,
  );
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      ...(item.publishedAt ? { publishedTime: item.publishedAt } : {}),
      ...(item.updatedAt ? { modifiedTime: item.updatedAt } : {}),
      ...(item.author ? { authors: [item.author] } : {}),
    },
  };
}
export function buildArticleJsonLd(item: PublishingEntry) {
  const image = absoluteUrl(item.coverImageUrl || "");
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: item.title,
    description: item.shortDescription,
    url: buildCanonicalUrl(`/blog/${item.slug}`),
    mainEntityOfPage: buildCanonicalUrl(`/blog/${item.slug}`),
    ...(item.author
      ? { author: { "@type": "Person", name: item.author } }
      : {}),
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    ...(image ? { image } : {}),
    ...(item.publishedAt || item.createdAt
      ? { datePublished: item.publishedAt || item.createdAt }
      : {}),
    ...(item.updatedAt ? { dateModified: item.updatedAt } : {}),
    ...(item.tags?.length ? { keywords: item.tags.join(", ") } : {}),
  };
}
