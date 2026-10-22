import { PageHero } from "@/components/layout/page-hero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { notFound } from "next/navigation";
import { getMusicArtistBySlug, getMusicForArtist } from "@/services/music";
import { MusicCard } from "@/components/music/music-card";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const a = await getMusicArtistBySlug((await params).slug);
  if (!a) return notFound();
  const items = await getMusicForArtist(a.slug);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Music", path: "/music" },
          { name: a.name, path: `/music/artists/${a.slug}` },
        ]}
      />
      <PageHero title={<>{a.name}</>} description={<> {a.bio} </>} />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x: any) => (
          <MusicCard key={x.id} item={x} />
        ))}
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getMusicArtistBySlug((await params).slug);
  if (!item) notFound();
  return buildPageMetadata(
    {
      title: item.name,
      description:
        item.bio || `Explore music and audio associated with ${item.name}.`,
      path: `/music/artists/${encodeURIComponent(item.slug)}`,
      image: item.imageUrl,
    },
    await getPublicBusinessSettings(),
  );
}
