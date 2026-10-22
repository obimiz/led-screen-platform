import { PageHero } from "@/components/layout/page-hero";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getPublicBusinessSettings } from "@/services/business-settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getGalleryItemBySlug } from "@/services/gallery";
import { normalizeGalleryVideoUrl } from "@/lib/gallery/media";

export const dynamic = "force-dynamic";

export default async function GalleryDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getGalleryItemBySlug((await params).slug);
  if (!item) return notFound();
  const video =
    item.mediaType === "video" ? normalizeGalleryVideoUrl(item.videoUrl) : null;
  return (
    <main className="py-16">
      <Breadcrumbs
        items={[
          { name: "Gallery", path: "/gallery" },
          { name: item.title, path: `/gallery/${item.slug}` },
        ]}
      />
      <Container>
        <Link href="/gallery" className="text-brand-700 text-sm font-bold">
          ← Back to gallery
        </Link>
        <PageHero
          title={<>{item.title}</>}
          description={
            <>
              {" "}
              {[item.category, item.city, item.state]
                .filter(Boolean)
                .join(" · ")}{" "}
            </>
          }
        />
        <div className="mt-8 overflow-hidden rounded-2xl bg-slate-100">
          {video ? (
            <iframe
              title={item.title}
              src={video}
              className="aspect-video w-full"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : item.mediaType === "image" && item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.altText || item.title}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : (
            <p className="p-8 text-slate-500">This media is unavailable.</p>
          )}
        </div>
        {item.description && (
          <p className="mt-8 max-w-3xl leading-8 whitespace-pre-line text-slate-700">
            {item.description}
          </p>
        )}
        {item.caption && (
          <p className="mt-4 text-sm text-slate-500">{item.caption}</p>
        )}
        <div className="mt-10">
          <Link
            href="/request-quote"
            className="bg-primary rounded-lg px-5 py-3 font-bold text-white"
          >
            Request a Quote
          </Link>
        </div>
      </Container>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getGalleryItemBySlug((await params).slug);
  if (!item) notFound();
  return buildPageMetadata(
    {
      title: item.title,
      description:
        item.caption ||
        item.description ||
        `View ${item.title} in our gallery.`,
      path: `/gallery/${encodeURIComponent(item.slug)}`,
      image: item.imageUrl,
    },
    await getPublicBusinessSettings(),
  );
}
