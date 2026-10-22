import Link from "next/link";
import Image from "next/image";
import { requirePortfolioAdmin } from "@/lib/portfolio/access";
import { getContentPage, getPortfolioCategories } from "@/services/portfolio";
import { PublishingActions } from "@/components/publishing/actions";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    type?: string;
    page?: string;
    saved?: string;
  }>;
}) {
  await requirePortfolioAdmin();
  const query = await searchParams;
  const [{ rows, total, page, pages }, categories] = await Promise.all([
    getContentPage(query, false),
    getPortfolioCategories(true),
  ]);
  const href = (n: number) =>
    `/admin/blog?${new URLSearchParams({ q: query.q || "", category: query.category || "", status: query.status || "", type: query.type || "", page: String(n) })}`;
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Blog & Projects</h1>
          <p className="mt-2 text-slate-600">
            Manage company insights and approved completed projects.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="bg-primary rounded-lg px-4 py-3 font-bold text-white"
            href="/admin/blog/new"
          >
            Add blog article
          </Link>
          <Link
            className="rounded-lg border px-4 py-3 font-bold"
            href="/admin/blog/new?type=project"
          >
            Add project
          </Link>
          <Link className="px-2 py-3 underline" href="/admin/blog/categories">
            Manage categories
          </Link>
        </div>
      </div>
      {query.saved && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">
          Post saved successfully.
        </p>
      )}
      <form className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm">
          Search posts
          <input
            className="mt-1 w-full rounded border p-3"
            name="q"
            maxLength={100}
            defaultValue={query.q}
            placeholder="Title, excerpt or tag"
          />
        </label>
        <label className="text-sm">
          Content type
          <select
            className="mt-1 w-full rounded border p-3"
            name="type"
            defaultValue={query.type || ""}
          >
            <option value="">All content</option>
            <option value="article">Blog articles</option>
            <option value="project">Projects</option>
          </select>
        </label>
        <label className="text-sm">
          Category
          <select
            className="mt-1 w-full rounded border p-3"
            name="category"
            defaultValue={query.category || ""}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Status
          <select
            className="mt-1 w-full rounded border p-3"
            name="status"
            defaultValue={query.status || ""}
          >
            <option value="">All statuses</option>
            {["draft", "published", "archived"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="bg-brand-900 self-end rounded-lg px-4 py-3 font-bold text-white">
          Filter posts
        </button>
      </form>
      <p className="text-sm text-slate-600">
        {total} posts · Page {page} of {pages}
      </p>
      <div className="space-y-4">
        {rows.length ? (
          rows.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border bg-white p-4 sm:flex-row"
            >
              <div className="bg-brand-50 relative h-32 w-full shrink-0 overflow-hidden rounded-lg sm:w-44">
                {item.coverImageUrl ? (
                  <Image
                    src={item.coverImageUrl}
                    alt={item.coverAlt || item.title}
                    fill
                    sizes="(max-width:640px) 100vw,176px"
                    unoptimized={!item.coverImageUrl.startsWith("/")}
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-sm">
                    No cover image
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <h2 className="text-xl font-bold break-words">{item.title}</h2>
                <p className="text-sm text-slate-600">
                  {item.contentType === "article" ? "Article" : "Project"} ·{" "}
                  {item.categoryId?.name || "Uncategorised"} · {item.status}
                  {item.featured ? " · Featured" : ""} · Order {item.sortOrder}{" "}
                  · Created{" "}
                  {new Date(item.createdAt).toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  })}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    className="text-brand-700 font-bold underline"
                    href={`/admin/blog/${item.id}/edit`}
                  >
                    Edit post
                  </Link>
                  <Link
                    className="text-brand-700 underline"
                    href={`/admin/blog/${item.id}/preview`}
                  >
                    Preview
                  </Link>
                </div>
                <PublishingActions
                  id={item.id}
                  status={item.status}
                  featured={item.featured}
                />
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-8">
            No posts match these filters. Add an article or a completed project
            to get started.
          </p>
        )}
      </div>
      <nav aria-label="Admin post pagination" className="flex gap-5">
        {page > 1 && <Link href={href(page - 1)}>← Previous page</Link>}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && <Link href={href(page + 1)}>Next page →</Link>}
      </nav>
    </main>
  );
}
