import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { RichContent } from "@/components/publishing/rich-content";
import { AccessoryGallery } from "@/components/products/accessory-gallery";
import { ProductImage } from "@/components/products/product-media";
import { PriceDisplay } from "@/components/products/price-display";
import type { BellPageContent } from "@/lib/validations/bell-page";
type BellProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  featuredImageUrl: string;
  imageAlt?: string;
  imageUrls?: string[];
  imageAlts?: string[];
  price: number | null;
  priceType: string;
  currency: string;
  promotionalPrice?: number | null;
};
export function BellPageView({
  content: c,
  products = [],
}: {
  content: BellPageContent;
  products?: BellProduct[];
}) {
  return (
    <main>
      <PageHero
        title={c.heading}
        description={c.introduction}
        eyebrow={c.subtitle}
        image={c.heroImage}
        imageAlt={c.heroAlt}
        cta={{ href: "/electronic-bell-alarm/request", label: c.ctaText }}
      />
      <section className="mx-auto max-w-6xl space-y-7 px-4 py-12">
        <h2 className="text-3xl font-black">{c.sectionHeading}</h2>
        <RichContent content={c.content} />
        {c.coverImageUrl && (
          <ProductImage
            url={c.coverImageUrl}
            name={c.coverAlt}
            fit="contain"
            className="aspect-video"
          />
        )}
        <p>{c.showcaseText}</p>
        <div
          data-bell-products
          className={`mx-auto grid w-full max-w-[824px] auto-rows-fr grid-cols-1 justify-items-center gap-6 ${products.length > 1 ? "md:grid-cols-2" : ""}`}
        >
          {products.map((p, index) => (
            <article
              key={p.id}
              className={`flex h-full w-full max-w-[400px] min-w-0 flex-col overflow-hidden rounded-xl border bg-white ${products.length > 1 && products.length % 2 === 1 && index === products.length - 1 ? "md:col-span-2" : ""}`}
            >
              <AccessoryGallery
                compact
                name={p.name}
                featuredImageUrl={p.featuredImageUrl}
                imageAlt={p.imageAlt || p.name}
                imageUrls={p.imageUrls || []}
                imageAlts={p.imageAlts || []}
              />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-bold break-words">{p.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {p.shortDescription}
                </p>
                <p className="mt-3 font-bold">
                  <PriceDisplay product={p} />
                </p>
                <div className="mt-auto flex flex-wrap gap-3 pt-5">
                  <Link
                    className="text-brand-700 rounded-lg border px-4 py-2.5 text-sm font-bold"
                    href={`/electronic-bell-alarm/products/${p.slug}`}
                  >
                    View Details
                  </Link>
                  <Link
                    className="rounded-lg bg-[#DD2421] px-4 py-2.5 text-sm font-bold text-white"
                    href={`/electronic-bell-alarm/request?product=${p.slug}`}
                  >
                    Request Quote
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <nav className="text-brand-700 flex flex-wrap gap-5 font-bold">
          <Link href="/electronic-bell-alarm/products">View all systems</Link>
          <Link href="/electronic-bell-alarm/accessories">
            Bell accessories
          </Link>
          <Link href="/contact">Contact us</Link>
          <a href="https://wa.me/2348039308982">WhatsApp Us</a>
        </nav>
      </section>
    </main>
  );
}
