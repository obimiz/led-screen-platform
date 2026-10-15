import Link from "next/link";
import { requireMusicAdmin } from "@/lib/music/access";
import { getMusicPage, getMusicCategories } from "@/services/music";
import { MusicActions } from "@/components/music/item-actions";
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
  await requireMusicAdmin();
  const query = await searchParams;
  const [{ rows, total, page, pages }, categories] = await Promise.all([
    getMusicPage(query, false),
    getMusicCategories(true),
  ]);
  const href = (p: number) =>
    `/admin/music?${new URLSearchParams({ q: query.q || "", category: query.category || "", status: query.status || "", page: String(p) })}`;
  return (
    <main className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Music & Audio</h1>
        <Link
          className="bg-primary rounded-lg px-4 py-3 font-bold text-white"
          href="/admin/music/new"
        >
          Add music
        </Link>
      </div>
      <Link
        href="/admin/music/categories"
        className="mt-4 inline-block underline"
      >
        Manage music categories
      </Link>
      {query.saved && (
        <p role="status" className="mt-4 text-green-800">
          Music saved successfully.
        </p>
      )}
      <form className="my-6 flex flex-wrap gap-3">
        <input
          aria-label="Search music"
          name="q"
          defaultValue={query.q}
          placeholder="Song title or artist"
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
        <Link href="/admin/music" className="p-3 underline">
          Reset
        </Link>
      </form>
      <p className="mb-4 text-sm">
        {total} music items · Page {page} of {pages}
      </p>
      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((x) => (
            <article
              key={x.id}
              className="min-w-0 space-y-3 rounded-xl border p-5"
            >
              <h2 className="text-xl font-bold break-words">{x.title}</h2>
              <p>{x.artistName || "Artist not specified"}</p>
              <p className="text-sm">
                {x.categoryId?.name || "Uncategorised"} · {x.status} ·{" "}
                {x.featured ? "Featured" : "Not featured"}
              </p>
              <p className="text-xs text-slate-600">
                Created {new Date(x.createdAt).toLocaleDateString("en-GB")} ·
                Order {x.sortOrder}
              </p>
              <Link
                className="inline-block rounded border px-3 py-2 font-bold"
                href={`/admin/music/${x.id}/edit`}
              >
                Edit / preview
              </Link>
              <MusicActions id={x.id} status={x.status} featured={x.featured} />
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed p-8">
          No music matches these filters.
        </p>
      )}
      <nav aria-label="Admin music pagination" className="mt-8 flex gap-6">
        {page > 1 && <Link href={href(page - 1)}>← Previous</Link>}
        {page < pages && <Link href={href(page + 1)}>Next →</Link>}
      </nav>
    </main>
  );
}
