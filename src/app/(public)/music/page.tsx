import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import {
  getFeaturedArtists,
  getFeaturedMusic,
  getLatestMusic,
  getMusicCategories,
} from "@/services/music";
import { MusicCard } from "@/components/music/music-card";
export const dynamic = "force-dynamic";
const demoHymns = [
  "Amazing Grace", "How Great Thou Art", "Be Thou My Vision", "Holy Holy Holy",
  "It Is Well With My Soul", "Great Is Thy Faithfulness", "Abide With Me", "The Old Rugged Cross",
  "Ave Maria", "Panis Angelicus", "Holy God We Praise Thy Name", "On Eagles Wings",
  "Hail Mary Gentle Woman", "Be Not Afraid", "Here I Am Lord", "The Summons",
];
export default async function Page() {
  let featured: any[] = [], latest: any[] = [], categories: any[] = [], artists: any[] = [];
  try { [featured, latest, categories, artists] = await Promise.all([getFeaturedMusic(), getLatestMusic(), getMusicCategories(), getFeaturedArtists()]); } catch { /* The catalogue remains browsable while the database is unavailable. */ }
  if (!featured.length && !latest.length) latest = demoHymns.map((title, i) => ({ id: `demo-${i}`, title, slug: "", artistName: "Christian hymn", contentType: "hymn", coverImageUrl: "" }));
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold tracking-[0.2em] text-brand-700 uppercase">Listen, reflect, worship</p>
      <h1 className="mt-2 text-4xl font-black">Christian & Catholic Music</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Discover a curated selection of songs, hymns, worship, prayer and
        reflection from official sources.
      </p>
      <nav
        aria-label="Music browsing"
        className="mt-6 flex gap-5 text-brand-700"
      >
        <Link href="/music/browse">Browse all music</Link>
        <Link href="/music/artists">Explore artists</Link>
      </nav>
      <h2 className="mt-12 text-2xl font-black">Featured music</h2>
      {featured.length ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((x: any) => (
            <MusicCard key={x.id} item={x} />
          ))}
        </div>
      ) : (
        <p className="mt-5">No music has been published yet.</p>
      )}
      <h2 className="mt-12 text-2xl font-black">Browse categories</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {categories.map((c: any) => (
          <Link
            key={c.id}
            href={`/music/category/${c.slug}`}
            className="rounded-full border px-4 py-2"
          >
            {c.name}
          </Link>
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-black">Latest additions</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((x: any) => (
          <MusicCard key={x.id} item={x} />
        ))}
      </div>
      {artists.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl font-black">Featured artists</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {artists.map((a: any) => (
              <Link
                key={a.id}
                href={`/music/artists/${a.slug}`}
                className="rounded-lg border px-4 py-3 font-semibold"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/music", await searchParams);
}
