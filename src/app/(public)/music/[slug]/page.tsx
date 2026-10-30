import { PageHero } from "@/components/layout/page-hero";
import { MusicPlayer } from "@/components/music/audio-player";
import Link from "next/link";
import { getMusicArtistBySlug, getMusicCategories } from "@/services/music";
import { buildMusicMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { notFound } from "next/navigation";
import { getMusicBySlug, getRelatedMusic } from "@/services/music";
import { normalizeMusicSourceUrl } from "@/lib/music/embeds";
import { MusicCard } from "@/components/music/music-card";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getMusicBySlug((await params).slug);
  if (!item) return notFound();
  const related = await getRelatedMusic(item);
  const artist = item.artistSlug
    ? await getMusicArtistBySlug(item.artistSlug)
    : null;
  const category = (await getMusicCategories()).find(
    (c: { slug: string }) => c.slug === item.categoryId?.slug,
  );
  const embed =
    normalizeMusicSourceUrl(item.sourceUrl) ||
    normalizeMusicSourceUrl(item.embedUrl);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Music", path: "/music" },
          { name: item.title, path: `/music/${item.slug}` },
        ]}
      />
      <p className="text-brand-700 text-sm font-bold uppercase">
        {item.contentType}
      </p>
      <PageHero
        title={<>{item.title}</>}
        description={
          <>
            {" "}
            {artist ? (
              <Link
                className="underline"
                href={`/music/artists/${artist.slug}`}
              >
                {item.artistName || artist.name}
              </Link>
            ) : (
              item.artistName
            )}{" "}
          </>
        }
      />
      {category && (
        <Link
          className="text-brand-700 mt-3 inline-block underline"
          href={`/music/category/${category.slug}`}
        >
          {category.name}
        </Link>
      )}
      {item.sourcePlatform === "owned" && item.audioUrl && (
        <MusicPlayer
          src={item.audioUrl}
          title={item.title}
          downloadUrl={item.downloadUrl}
        />
      )}
      {item.sourcePlatform !== "owned" && embed && (
        <div className="mt-8 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            className="h-full w-full"
            src={embed}
            title={`Listen to ${item.title}`}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      {item.sourcePlatform !== "owned" && !embed && item.sourceUrl && (
        <a
          className="bg-primary mt-8 inline-block rounded-lg px-5 py-3 font-bold text-white"
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Listen on {item.sourcePlatform}
        </a>
      )}
      <div className="mt-8 rounded-xl border p-5">
        <p>{item.description}</p>
        <p className="mt-3 text-sm text-slate-600">
          {item.albumTitle} {item.genre && `· ${item.genre}`}{" "}
          {item.language && `· ${item.language}`}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Audio/video content may be provided by third-party platforms.
        </p>
      </div>
      {related.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl font-black">Related content</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x: any) => (
              <MusicCard key={x.id} item={x} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getMusicBySlug((await params).slug);
  if (!item) notFound();
  return buildMusicMetadata(item, await getPublicBusinessSettings());
}
