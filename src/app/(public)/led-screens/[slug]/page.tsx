import { effectiveProductPrice } from "@/lib/utils/product-price";
import { PageHero } from "@/components/layout/page-hero";
import { getProductDisplayImages } from "@/lib/media/product-primary-image";
import { buildProductMetadata } from "@/lib/seo/metadata";
import { buildProductJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { Container } from "@/components/ui/container";

import { createWhatsAppUrl } from "@/lib/utils/contact";
import { getVideoEmbedUrl } from "@/lib/utils/video";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getLedProductBySlug } from "@/services/products";
import { AddToCartButton } from "@/components/cart/cart-controls";
import { getLedHeadlineSpecs } from "@/lib/utils/led-headline-specs";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export default async function LedProductPage({ params }: Props) {
  const product = await getLedProductBySlug((await params).slug);
  if (!product) notFound();
  const settings = await getPublicBusinessSettings();
  const whatsapp = createWhatsAppUrl(
    settings.whatsappNumber,
    `Hello, I am interested in the ${product.name} listed on your website. Please provide more information.`,
  );
  const video = getVideoEmbedUrl(product.videoUrl);
  const gallery = getProductDisplayImages(product);
  const imageUrl = gallery[0] || "";
  const keySpecs = [
    ...getLedHeadlineSpecs(product),
    ["Brightness", product.brightness],
    ["Refresh rate", product.refreshRate],
    ["Resolution", product.resolution],
    ["Maintenance", product.maintenanceType],
  ].filter(
    ([, value]) =>
      typeof value === "string" &&
      value.trim() !== "" &&
      value.trim() !== "not-specified",
  );
  return (
    <main>
      <Breadcrumbs
        items={[
          { name: "LED Screens", path: "/led-screens" },
          { name: product.name, path: `/led-screens/${product.slug}` },
        ]}
      />
      <JsonLd data={buildProductJsonLd(product)} />
      <PageHero
        title={<>{product.name}</>}
        description={<>{product.shortDescription}</>}
      />
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <ProductImage
              priority
              url={imageUrl}
              name={product.name}
              fit={product.imageFit}
              neutralFallback
              className="aspect-video rounded-2xl"
            />
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.slice(1).map((image, index) => (
                  <ProductImage
                    key={image}
                    url={image}
                    name={`${product.name} gallery image ${index + 2}`}
                    fit={product.imageFit}
                    neutralFallback
                    className="aspect-square rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
          <aside className="rounded-2xl border border-slate-200 p-6">
            <p className="text-2xl font-black">
              <PriceDisplay product={product} />
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Availability: {product.stockStatus}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {product.priceType === "fixed" &&
                product.isPurchasableOnline &&
                product.price !== null &&
                product.stockStatus !== "out-of-stock" && (
                  <AddToCartButton
                    item={{
                      productId: product.id,
                      productName: product.name,
                      slug: product.slug,
                      productType: product.productType,
                      sku: "",
                      imageUrl,
                      quantity: product.minOrderQuantity || 1,
                      displayedUnitPrice:
                        effectiveProductPrice(product) ?? product.price,
                      currency: product.currency,
                      minOrderQuantity: product.minOrderQuantity,
                      maxOrderQuantity: product.maxOrderQuantity,
                    }}
                  />
                )}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-success-500 text-brand-900 rounded-lg px-5 py-3 text-center font-bold"
                >
                  Enquire on WhatsApp
                </a>
              )}
              {
                <Link
                  href={`/request-quote?product=${product.slug}`}
                  className="bg-primary rounded-lg px-5 py-3 text-center font-bold text-white"
                >
                  Request Quote
                </Link>
              }
              <a
                href={`mailto:${settings.primaryEmail}?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}`}
                className="rounded-lg border px-5 py-3 text-center font-bold"
              >
                Send an enquiry
              </a>
            </div>
          </aside>
        </div>
        <section
          className={`mt-12 grid gap-10 ${keySpecs.length > 0 ? "lg:grid-cols-2" : ""}`}
        >
          <div>
            <h2 className="text-2xl font-black">Product overview</h2>
            <p className="mt-4 leading-8 whitespace-pre-line text-slate-600">
              {product.description}
            </p>
          </div>
          {keySpecs.length > 0 && (
            <div>
              <h2 className="text-2xl font-black">Key specifications</h2>
              <dl className="mt-4 divide-y rounded-xl border px-5">
                {keySpecs.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-3 sm:flex sm:justify-between sm:gap-5"
                  >
                    <dt className="text-slate-500">{label}:</dt>
                    <dd className="min-w-0 font-semibold break-words sm:text-right">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
        {product.features.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-black">Features</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {product.features.map((feature) => (
                <li key={feature} className="rounded-lg bg-slate-50 p-4">
                  ✓ {feature}
                </li>
              ))}
            </ul>
          </section>
        )}
        {product.usageApplications.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-black">Applications</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.usageApplications.map((application) => (
                <span
                  key={application}
                  className="bg-brand-50 text-brand-900 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  {application}
                </span>
              ))}
            </div>
          </section>
        )}
        {product.specifications.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-black">Additional specifications</h2>
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {product.specifications.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="flex justify-between gap-4 border-b py-3"
                >
                  <dt>{item.label}</dt>
                  <dd className="font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {video && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-black">Product video</h2>
            <iframe
              loading="lazy"
              src={video}
              title={`${product.name} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full max-w-4xl rounded-2xl border-0"
            />
          </section>
        )}
      </Container>
      <nav
        aria-label="Product support"
        className="text-brand-700 mx-auto flex max-w-7xl flex-wrap gap-5 px-4 pb-10"
      >
        <Link href="/led-installation">Installation</Link>
        <Link href="/rent-led-screen">Rental</Link>
        <Link href="/led-maintenance">Maintenance</Link>
        <Link href="/led-accessories">Accessories</Link>
      </nav>
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getLedProductBySlug((await params).slug);
  if (!item) notFound();
  return buildProductMetadata(item, await getPublicBusinessSettings());
}
