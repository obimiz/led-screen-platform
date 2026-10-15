import Link from "next/link";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import { GalleryGrid } from "@/components/gallery/public-grid";
import { getGalleryPage, getGalleryCategories } from "@/services/gallery";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const query = await searchParams;
  const [{ rows, page, pages }, categories] = await Promise.all([
    getGalleryPage(query, true),
    getGalleryCategories(true),
  ]);
  const href = (p: number) =>
    `/gallery?${new URLSearchParams({ category: query.category || "", page: String(p) })}`;
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-black">Gallery</h1>
      <p className="mt-3 text-slate-600">
        Explore our products, equipment, installations and events. Each caption
        describes the image shown.
      </p>
      <form className="mt-6 flex flex-wrap gap-3">
        <label>
          Gallery category
          <select
            name="category"
            defaultValue={query.category || ""}
            className="ml-3 rounded border p-3"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="bg-primary rounded px-4 py-2 text-white">
          Filter
        </button>
      </form>
      {rows.length ? (
        <GalleryGrid items={rows} />
      ) : (
        <p className="mt-10 rounded-xl border border-dashed p-8">
          No published gallery items match this category.
        </p>
      )}
      <nav
        aria-label="Gallery pagination"
        className="mt-8 flex items-center gap-6"
      >
        {page > 1 && <Link href={href(page - 1)}>← Previous page</Link>}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && <Link href={href(page + 1)}>Next page →</Link>}
      </nav>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/gallery", await searchParams);
}
