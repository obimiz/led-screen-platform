import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import {
  getContentPage,
  getFeaturedContent,
  getPortfolioCategories,
  type ContentKind,
} from "@/services/portfolio";
import { ContentCard } from "./card";
export type PublishingQuery = { q?: string; category?: string; page?: string };
export async function PublishingCatalogue({
  kind,
  query,
}: {
  kind: ContentKind;
  query: PublishingQuery;
}) {
  const [{ rows, total, page, pages }, categories, featured] =
    await Promise.all([
      getContentPage(query, true, kind),
      getPortfolioCategories(true),
      !query.q && !query.category && !query.page
        ? getFeaturedContent(3, kind)
        : Promise.resolve([]),
    ]);
  const article = kind === "article",
    base = article ? "/blog" : "/projects";
  const href = (n: number) =>
    `${base}?${new URLSearchParams({ q: query.q || "", category: query.category || "", page: String(n) })}`;
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
        {article ? "Ideas, news & expertise" : "Our projects"}
      </p>
      <PageHero
        title={
          <>{article ? "Blog & Insights" : "Selected work and case studies"}</>
        }
        description={
          <>
            {" "}
            {article
              ? "News and practical insights from Image Grant Technology."
              : "Explore completed LED, event and technology projects. Public details and photographs are shared with appropriate permission."}{" "}
          </>
        }
      />
      {featured.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            {article ? "Featured articles" : "Featured projects"}
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
      <form
        role="search"
        className="mt-10 grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <label className="text-sm font-semibold">
          {article ? "Search articles" : "Search projects"}
          <input
            name="q"
            maxLength={100}
            className="mt-2 w-full rounded-lg border bg-white p-3"
            defaultValue={query.q}
            placeholder="Title, excerpt or tag"
          />
        </label>
        <label className="text-sm font-semibold">
          Category
          <select
            name="category"
            defaultValue={query.category || ""}
            className="mt-2 w-full rounded-lg border bg-white p-3"
          >
            <option value="">All categories</option>
            {categories
              .filter((c) => !c.scope || c.scope === "all" || c.scope === kind)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <button className="bg-primary self-end rounded-lg px-5 py-3 font-bold text-white">
          Search
        </button>
      </form>
      <section className="mt-8">
        <h2 className="text-2xl font-bold">
          {article ? "Latest articles" : "Completed projects"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {total} published {article ? "articles" : "projects"}
        </p>
        {rows.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed p-8">
            <p>
              {query.q || query.category
                ? "No posts match your filters."
                : article
                  ? "Our blog is being updated. Please check back soon."
                  : "Our project portfolio is being updated."}
            </p>
            <Link
              href={query.q || query.category ? base : "/contact"}
              className="text-brand-700 mt-3 inline-block font-semibold underline"
            >
              {query.q || query.category
                ? "Clear filters"
                : "Contact us to discuss your project"}
            </Link>
          </div>
        )}
      </section>
      <nav aria-label="Content pagination" className="mt-8 flex gap-5">
        {page > 1 && <Link href={href(page - 1)}>← Previous page</Link>}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && <Link href={href(page + 1)}>Next page →</Link>}
      </nav>
    </main>
  );
}
