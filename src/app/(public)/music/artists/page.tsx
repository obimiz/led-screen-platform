import Link from "next/link";
import { getPublishedArtists } from "@/services/music";
import { staticPageMetadata } from "@/lib/seo/pages";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return staticPageMetadata("/music/artists");
}
export default async function ArtistsPage() {
  const artists = await getPublishedArtists();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Music", path: "/music" },
          { name: "Artists", path: "/music/artists" },
        ]}
      />
      <h1 className="text-4xl font-black">Music artists</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {artists.map(
          (artist: { id: string; slug: string; name: string; bio: string }) => (
            <article key={artist.id} className="rounded-xl border p-5">
              <h2 className="text-xl font-bold">
                <Link href={`/music/artists/${artist.slug}`}>
                  {artist.name}
                </Link>
              </h2>
              <p className="mt-3 text-slate-600">{artist.bio}</p>
            </article>
          ),
        )}
      </div>
      {!artists.length && (
        <p className="mt-8">No artist profiles have been published yet.</p>
      )}
    </main>
  );
}
