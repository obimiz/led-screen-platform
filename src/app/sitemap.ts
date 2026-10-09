import type { MetadataRoute } from "next";
import { publicPages } from "@/lib/seo/pages";
import { buildCanonicalUrl, isSearchIndexingAllowed } from "@/lib/seo/urls";
import { getDynamicSitemapEntries } from "@/services/seo-sitemap";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSearchIndexingAllowed()) return [];
  const entries = [
    ...Object.keys(publicPages).map((path) => ({
      url: buildCanonicalUrl(path),
    })),
    ...(await getDynamicSitemapEntries()),
  ];
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
