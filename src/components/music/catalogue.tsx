import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";
import {
  getMusicPage,
  getMusicCategories,
  getFeaturedMusic,
} from "@/services/music";
import { MusicCard } from "./music-card";
export type MusicQuery = { q?: string; category?: string; page?: string };
export async function PublicMusicCatalogue({
  query,
  browse = false,
}: {
  query: MusicQuery;
  browse?: boolean;
}) {
  const [{ rows, total, page, pages }, categories, featured] =
    await Promise.all([
      getMusicPage(query, true),
      getMusicCategories(),
      browse ? Promise.resolve([]) : getFeaturedMusic(6),
    ]);
  const base = browse ? "/music/browse" : "/music";
  const href = (p: number) =>
    `${base}?${new URLSearchParams({ q: query.q || "", category: query.category || "", page: String(p) })}`;
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-brand-700 text-sm font-bold tracking-[0.2em] uppercase">
        Listen, reflect, worship
      </p>
      <PageHero
        title={
          <>
            {browse ? "Browse music and audio" : "Christian & Catholic Music"}
          </>
        }
        description={
          <>
            {" "}
            Stream published recordings and explore music from official
            sources.{" "}
          </>
        }
      />
      <nav
        aria-label="Music browsing"
        className="text-brand-700 mt-6 flex flex-wrap gap-5"
      >
        <Link href="/music">Music & Audio</Link>
        <Link href="/music/browse">Browse all music</Link>
        <Link href="/music/artists">Explore artists</Link>
      </nav>
      {!browse && featured.length > 0 && !query.q && !query.category && (
        <section className="mt-10">
          <h2 className="text-2xl font-black">Featured music</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <MusicCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
      <form
        role="search"
        className="mt-10 grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <label className="text-sm font-semibold">
          Song title or artist
          <input
            name="q"
            defaultValue={query.q}
            maxLength={100}
            className="mt-2 w-full rounded-lg border bg-white p-3"
            placeholder="Search music"
          />
        </label>
        <label className="text-sm font-semibold">
          Music category
          <select
            name="category"
            defaultValue={query.category || ""}
            className="mt-2 w-full rounded-lg border bg-white p-3"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="bg-primary self-end rounded-lg px-5 py-3 font-bold text-white">
          Search music
        </button>
      </form>
      <section className="mt-8">
        <h2 className="text-2xl font-black">
          {browse ? "Music library" : "Latest additions"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {total} published recordings and official sources
        </p>
        {rows.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((item) => (
              <MusicCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed p-8">
            No music matches your search, or no recordings have been published
            yet.{" "}
            <Link href={base} className="underline">
              Clear filters
            </Link>
          </p>
        )}
      </section>
      <nav aria-label="Music pagination" className="mt-8 flex gap-5">
        {page > 1 && <Link href={href(page - 1)}>← Previous page</Link>}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && <Link href={href(page + 1)}>Next page →</Link>}
      </nav>
    </main>
  );
}
