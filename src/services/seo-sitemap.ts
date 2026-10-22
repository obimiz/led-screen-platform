import "server-only";
import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Product } from "@/models/product";
import { publicPortfolioFilter } from "@/services/portfolio";
import { PortfolioProject } from "@/models/portfolio-project";
import { MusicContent } from "@/models/music-content";
import { MusicArtist } from "@/models/music-artist";
import { MusicCategory } from "@/models/music-category";
import { GalleryItem } from "@/models/gallery-item";
import { buildCanonicalUrl } from "@/lib/seo/urls";
import { productPath } from "@/lib/seo/metadata";

type SitemapRecord = {
  slug: string;
  updatedAt?: Date;
  productType?: string;
  contentType?: string;
};
function entries(
  rows: SitemapRecord[],
  path: (row: SitemapRecord) => string,
): MetadataRoute.Sitemap {
  return rows
    .filter((row) => !!row.slug)
    .map((row) => ({
      url: buildCanonicalUrl(path(row)),
      ...(row.updatedAt && !Number.isNaN(new Date(row.updatedAt).valueOf())
        ? { lastModified: row.updatedAt }
        : {}),
    }));
}
/** Minimal projection, no catalogue limit: add batching/sitemap splits here if the site grows. */
export async function getDynamicSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectToDatabase();
    const groups = await Promise.allSettled([
      Product.find({
        status: "published",
        productType: {
          $in: [
            "led-screen",
            "led-accessory",
            "bell-alarm-system",
            "bell-alarm-accessory",
          ],
        },
      })
        .select("slug productType updatedAt -_id")
        .lean()
        .then((rows) =>
          entries(rows as SitemapRecord[], (row) =>
            productPath({ slug: row.slug, productType: row.productType! }),
          ),
        ),
      PortfolioProject.find(publicPortfolioFilter())
        .select("slug contentType updatedAt -_id")
        .lean()
        .then((rows) =>
          entries(
            rows as unknown as SitemapRecord[],
            (row) =>
              `/${row.contentType === "article" ? "blog" : "projects"}/${encodeURIComponent(row.slug)}`,
          ),
        ),
      MusicContent.find({ status: "published" })
        .select("slug updatedAt -_id")
        .lean()
        .then((rows) =>
          entries(
            rows as unknown as SitemapRecord[],
            (row) => `/music/${encodeURIComponent(row.slug)}`,
          ),
        ),
      MusicArtist.find({ status: "published" })
        .select("slug updatedAt -_id")
        .lean()
        .then((rows) =>
          entries(
            rows as unknown as SitemapRecord[],
            (row) => `/music/artists/${encodeURIComponent(row.slug)}`,
          ),
        ),
      MusicCategory.find({ isActive: true })
        .select("slug updatedAt -_id")
        .lean()
        .then((rows) =>
          entries(
            rows as unknown as SitemapRecord[],
            (row) => `/music/category/${encodeURIComponent(row.slug)}`,
          ),
        ),
      GalleryItem.find({ status: "published" })
        .select("slug updatedAt -_id")
        .lean()
        .then((rows) =>
          entries(
            rows as unknown as SitemapRecord[],
            (row) => `/gallery/${encodeURIComponent(row.slug)}`,
          ),
        ),
    ]);
    return groups.flatMap((group) =>
      group.status === "fulfilled" ? group.value : [],
    );
  } catch {
    // No error details, fabricated dates, or fallback private records in a public feed.
    return [];
  }
}
