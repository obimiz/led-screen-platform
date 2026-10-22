import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { RichContent } from "@/components/publishing/rich-content";
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-xl border">
              <ProductImage
                url={p.featuredImageUrl}
                name={p.imageAlt || p.name}
                fit="contain"
              />
              <div className="space-y-3 p-5">
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p>{p.shortDescription}</p>
                <PriceDisplay product={p} />
                <Link
                  className="text-brand-700 block font-bold"
                  href={`/electronic-bell-alarm/products/${p.slug}`}
                >
                  View details →
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {c.imageUrls.map((url, i) => (
            <ProductImage
              key={`${url}-${i}`}
              url={url}
              name={c.imageAlts[i] || c.sectionHeading}
              fit="contain"
            />
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
