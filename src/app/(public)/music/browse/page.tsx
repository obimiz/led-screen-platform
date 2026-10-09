import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getPublishedMusic } from "@/services/music";
import { MusicCard } from "@/components/music/music-card";
export const dynamic = "force-dynamic";
export default async function Page() {
  const items = await getPublishedMusic();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-black">Browse music and audio</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x: any) => (
          <MusicCard key={x.id} item={x} />
        ))}
      </div>
      {!items.length && <p className="mt-8">No content found.</p>}
      <Link className="mt-8 inline-block text-brand-700" href="/music">
        Back to Music
      </Link>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/music/browse", await searchParams);
}
