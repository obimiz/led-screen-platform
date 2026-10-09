import Link from "next/link";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
/* eslint-disable @typescript-eslint/no-explicit-any */ import { getPublishedGalleryItems } from "@/services/gallery";
export const dynamic = "force-dynamic";
export default async function Page() {
  const rows = await getPublishedGalleryItems();
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold tracking-widest text-brand-700 uppercase">
        Our work
      </p>
      <h1 className="mt-3 text-4xl font-black">Gallery</h1>
      <p className="mt-3 text-slate-600">
        A visual selection of installations, events, products and service work.
      </p>
      {rows.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed p-8">
          No gallery items have been published yet.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((x: any) => (
            <article key={x.id} className="overflow-hidden rounded-xl border">
              <div className="aspect-video bg-slate-100">
                {x.mediaType === "image" && x.imageUrl ? (
                  <img
                    src={x.thumbnailUrl || x.imageUrl}
                    loading="lazy"
                    decoding="async"
                    alt={x.altText || x.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    Video
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-bold">
                  <Link href={`/gallery/${x.slug}`}>{x.title}</Link>
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {x.caption || x.description}
                </p>
                <p className="mt-2 text-xs text-brand-700 uppercase">
                  {x.serviceType} ·{" "}
                  {[x.city, x.state].filter(Boolean).join(", ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/gallery", await searchParams);
}
