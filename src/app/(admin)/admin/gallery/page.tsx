import Link from "next/link";
import { requireGalleryAdmin } from "@/lib/gallery/access";
import { getGalleryPage, getGalleryCategories } from "@/services/gallery";
import { GalleryItemActions } from "@/components/gallery/item-actions";
import { ProductImage } from "@/components/products/product-media";
export const dynamic = "force-dynamic";
type Query = {
  q?: string;
  category?: string;
  status?: string;
  page?: string;
  saved?: string;
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  await requireGalleryAdmin();
  const query = await searchParams;
  const [{ rows, total, page, pages }, categories] = await Promise.all([
    getGalleryPage(query),
    getGalleryCategories(true),
  ]);
  const href = (p: number) =>
    `/admin/gallery?${new URLSearchParams({ q: query.q || "", category: query.category || "", status: query.status || "", page: String(p) })}`;
  return (
    <main className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Gallery Management</h1>
        <Link
          className="bg-primary rounded-lg px-4 py-3 font-bold text-white"
          href="/admin/gallery/new"
        >
          Add Gallery Item
        </Link>
      </div>
      {query.saved && (
        <p role="status" className="mt-4 text-green-800">
          Gallery saved successfully.
        </p>
      )}
      <Link
        href="/admin/gallery/categories"
        className="mt-4 inline-block underline"
      >
        Manage categories
      </Link>
      <form className="my-6 flex flex-wrap gap-3">
        <input
          aria-label="Search gallery"
          name="q"
          defaultValue={query.q}
          placeholder="Search titles"
          className="rounded border p-3"
        />
        <select
          aria-label="Category filter"
          name="category"
          defaultValue={query.category || ""}
          className="rounded border p-3"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {!c.isActive ? " (inactive)" : ""}
            </option>
          ))}
        </select>
        <select
          aria-label="Status filter"
          name="status"
          defaultValue={query.status || ""}
          className="rounded border p-3"
        >
          <option value="">All statuses</option>
          {["draft", "published", "archived"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="rounded border px-4 py-2">Filter</button>
        <Link href="/admin/gallery" className="p-3 underline">
          Reset
        </Link>
      </form>
      <p className="mb-4 text-sm">
        {total} items · Page {page} of {pages}
      </p>
      {rows.length === 0 ? (
        <p className="rounded border border-dashed p-8">
          No gallery items match these filters.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((x) => (
            <article key={x.id} className="overflow-hidden rounded-xl border">
              <ProductImage
                url={x.thumbnailUrl || x.imageUrl}
                name={x.altText || x.title}
                fit="contain"
              />
              <div className="space-y-3 p-4">
                <h2 className="text-lg font-bold">{x.title}</h2>
                <p>{x.caption}</p>
                <p className="text-sm">
                  {categories.find((c) => c.id === x.categoryId)?.name ||
                    "Uncategorised"}{" "}
                  · {x.status} · {x.featured ? "Featured" : "Not featured"}
                </p>
                <p className="text-sm text-slate-600">
                  Created {new Date(x.createdAt).toLocaleDateString("en-GB")} ·
                  Order {x.sortOrder}
                </p>
                <Link
                  className="inline-block rounded border px-3 py-2 font-bold"
                  href={`/admin/gallery/${x.id}/edit`}
                >
                  Edit
                </Link>
                <GalleryItemActions
                  id={x.id}
                  status={x.status}
                  featured={x.featured}
                />
              </div>
            </article>
          ))}
        </div>
      )}
      <nav aria-label="Gallery pagination" className="mt-8 flex gap-6">
        {page > 1 && <Link href={href(page - 1)}>← Previous</Link>}
        {page < pages && <Link href={href(page + 1)}>Next →</Link>}
      </nav>
    </main>
  );
}
