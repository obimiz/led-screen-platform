import { PageHero } from "@/components/layout/page-hero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { notFound } from "next/navigation";
import { getMusicCategories, getMusicForCategory } from "@/services/music";
import { MusicCard } from "@/components/music/music-card";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const cats = await getMusicCategories();
  const c = cats.find((x: any) => x.slug === slug);
  if (!c) return notFound();
  const items = await getMusicForCategory(c.id);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Music", path: "/music" },
          { name: c.name, path: `/music/category/${c.slug}` },
        ]}
      />
      <PageHero title={<>{c.name}</>} description={<> {c.description} </>} />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x: any) => (
          <MusicCard key={x.id} item={x} />
        ))}
      </div>
      {!items.length && (
        <p className="mt-8">No content found in this category.</p>
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const c = (await getMusicCategories()).find(
    (item: { slug: string }) => item.slug === slug,
  );
  if (!c) notFound();
  return buildPageMetadata(
    {
      title: c.name,
      description:
        c.description ||
        `Browse ${c.name} music and audio from linked providers.`,
      path: `/music/category/${encodeURIComponent(c.slug)}`,
    },
    await getPublicBusinessSettings(),
  );
}
