import { buildProductMetadata } from "@/lib/seo/metadata";
import { buildProductJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessoryCard } from "@/components/products/accessory-card";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { Container } from "@/components/ui/container";

import { createWhatsAppUrl } from "@/lib/utils/contact";
import { getVideoEmbedUrl } from "@/lib/utils/video";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getAccessoryBySlug, getRelatedAccessories } from "@/services/products";
import { AddToCartButton } from "@/components/cart/cart-controls";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export default async function AccessoryPublicDetail({ params }: Props) {
  const item = await getAccessoryBySlug((await params).slug);
  if (!item) notFound();
  const [settings, related] = await Promise.all([
    getPublicBusinessSettings(),
    getRelatedAccessories(item),
  ]);
  const whatsapp = createWhatsAppUrl(
    settings.whatsappNumber,
    `Hello, I am interested in the ${item.name} listed on your website. Please provide more information.`,
  );
  const video = getVideoEmbedUrl(item.videoUrl);
  const gallery = [item.featuredImageUrl, ...item.imageUrls].filter(Boolean);
  return (
    <main>
      <Breadcrumbs
        items={[
          { name: "LED Accessories", path: "/led-accessories" },
          { name: item.name, path: `/led-accessories/${item.slug}` },
        ]}
      />
      <JsonLd data={buildProductJsonLd(item)} />
      <section className="bg-brand-900 py-12 text-white">
        <Container>
          <p className="text-sm font-bold tracking-wider text-brand-300 uppercase">
            {item.category.name}
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">{item.name}</h1>
          <p className="mt-3 text-slate-300">
            {[item.brand, item.modelNumber, item.sku]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </Container>
      </section>
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <ProductImage
              priority
              url={item.featuredImageUrl}
              name={item.name}
              className="aspect-video rounded-2xl"
            />
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.slice(1).map((image, index) => (
                  <ProductImage
                    key={image}
                    url={image}
                    name={`${item.name} image ${index + 2}`}
                    className="aspect-square rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
          <aside className="rounded-2xl border p-6">
            <p className="text-2xl font-black">
              <PriceDisplay product={item} />
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {item.stockStatus}
              {item.stockStatus === "in-stock"
                ? ` · ${item.quantity} available`
                : ""}
            </p>
            <div className="mt-6 space-y-3">
              {item.priceType === "fixed" &&
                item.isPurchasableOnline &&
                item.price !== null &&
                item.stockStatus !== "out-of-stock" && (
                  <AddToCartButton
                    item={{
                      productId: item.id,
                      productName: item.name,
                      slug: item.slug,
                      productType: item.productType,
                      sku: item.sku,
                      imageUrl: item.featuredImageUrl,
                      quantity: item.minOrderQuantity || 1,
                      displayedUnitPrice: item.price,
                      currency: item.currency,
                      minOrderQuantity: item.minOrderQuantity,
                      maxOrderQuantity: item.maxOrderQuantity,
                    }}
                  />
                )}
              <Link
                href={`/request-quote?product=${item.slug}`}
                className="block rounded-lg bg-primary px-5 py-3 text-center font-bold text-white"
              >
                Request Quote
              </Link>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg bg-success-500 px-5 py-3 text-center font-bold text-brand-900"
                >
                  Enquire on WhatsApp
                </a>
              )}
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Online purchasing will be introduced with the future cart and
              orders module.
            </p>
          </aside>
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-black">Product overview</h2>
          <p className="mt-4 leading-8 whitespace-pre-line text-slate-600">
            {item.description}
          </p>
        </section>
        {item.features.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-black">Features</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {item.features.map((value) => (
                <li key={value} className="rounded-lg bg-slate-50 p-4">
                  ✓ {value}
                </li>
              ))}
            </ul>
          </section>
        )}
        {item.compatibility.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-black">Compatibility</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.compatibility.map((value) => (
                <span
                  key={value}
                  className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold"
                >
                  {value}
                </span>
              ))}
            </div>
          </section>
        )}
        {item.specifications.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-black">Specifications</h2>
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {item.specifications.map((spec) => (
                <div
                  key={`${spec.label}-${spec.value}`}
                  className="flex justify-between border-b py-3"
                >
                  <dt>{spec.label}</dt>
                  <dd className="font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {video && (
          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-black">Product video</h2>
            <iframe
              loading="lazy"
              src={video}
              title={`${item.name} video`}
              allowFullScreen
              className="aspect-video w-full max-w-4xl rounded-2xl"
            />
          </section>
        )}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-black">Related accessories</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((relatedItem) => (
                <AccessoryCard
                  key={relatedItem.id}
                  item={relatedItem}
                  whatsappNumber={settings.whatsappNumber}
                />
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getAccessoryBySlug((await params).slug);
  if (!item) notFound();
  return buildProductMetadata(item, await getPublicBusinessSettings());
}
