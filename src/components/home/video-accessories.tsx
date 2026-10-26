import Link from "next/link";
import { AccessoryGallery } from "@/components/products/accessory-gallery";
import { ProductImage } from "@/components/products/product-media";
import { PriceDisplay } from "@/components/products/price-display";
import type { AccessoryProduct } from "@/types/product";

const videoCardDefaults = [
  {
    title: "Video Processors",
    description:
      "Connect and manage video signals for your LED display. Ask us about input compatibility, resolution and processing options for your setup.",
  },
  {
    title: "Video Switchers",
    description:
      "Switch between cameras and other video sources for live events, presentations and productions. Our team can help you choose a suitable configuration.",
  },
  {
    title: "Video Connectivity Accessories",
    description:
      "Explore signal converters, capture equipment and connection accessories for your cameras and displays. Confirm compatibility with our team before choosing equipment.",
  },
];

export function VideoAccessories({ items }: { items: AccessoryProduct[] }) {
  return (
    <div className="mt-7 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videoCardDefaults.map((fallback, index) => {
        const item = items[index];
        return item ? (
          <article
            key={item.id}
            className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            data-video-accessory-card
          >
            <AccessoryGallery
              compact
              name={item.name}
              featuredImageUrl={item.featuredImageUrl || ""}
              imageAlt={item.imageAlt || item.name}
              imageUrls={item.imageUrls}
              imageAlts={item.imageAlts}
            />
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="text-brand-700 text-xs font-bold tracking-wide uppercase">
                Video accessory
              </p>
              <h3 className="mt-2 text-xl leading-snug font-bold break-words">
                <Link href={`/led-accessories/${item.slug}`}>{item.name}</Link>
              </h3>
              <p className="mt-3 text-sm leading-7 break-words whitespace-pre-line text-slate-600">
                {item.shortDescription}
              </p>
              <div className="mt-auto pt-5">
                <p className="font-bold">
                  <PriceDisplay product={item} />
                </p>
                <Link
                  href={`/led-accessories/${item.slug}`}
                  className="mt-4 block rounded-lg bg-[#DD2421] px-4 py-3 text-center text-sm font-bold text-white"
                >
                  View accessory details →
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <article
            key={fallback.title}
            className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            data-video-accessory-card
          >
            <ProductImage
              url=""
              name={fallback.title}
              neutralFallback
              fit="contain"
              className="aspect-[4/3]"
            />
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="text-brand-700 text-xs font-bold tracking-wide uppercase">
                Video accessories
              </p>
              <h3 className="mt-2 text-xl leading-snug font-bold">
                {fallback.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {fallback.description}
              </p>
              <Link
                href="/accessories#video-accessories"
                className="mt-auto block pt-6"
              >
                <span className="block rounded-lg bg-[#DD2421] px-4 py-3 text-center text-sm font-bold text-white">
                  Explore Video Accessories →
                </span>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
