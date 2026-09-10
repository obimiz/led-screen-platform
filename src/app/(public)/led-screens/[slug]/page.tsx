import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { getVideoEmbedUrl } from "@/lib/utils/video";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getLedProductBySlug } from "@/services/products";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getLedProductBySlug((await params).slug);
  if (!product) return { title: "LED screen not found" };
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: `/led-screens/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/led-screens/${product.slug}`,
      images: product.featuredImageUrl ? [product.featuredImageUrl] : [],
    },
  };
}
export default async function LedProductPage({ params }: Props) {
  const product = await getLedProductBySlug((await params).slug);
  if (!product) notFound();
  const settings = await getPublicBusinessSettings();
  const whatsapp = createWhatsAppUrl(
    settings.whatsappNumber,
    `Hello, I am interested in the ${product.name} listed on your website. Please provide more information.`,
  );
  const video = getVideoEmbedUrl(product.videoUrl);
  const gallery = [product.featuredImageUrl, ...product.imageUrls].filter(
    Boolean,
  );
  const keySpecs = [
    ["Pixel pitch", product.pixelPitch],
    ["Environment", product.indoorOutdoor],
    ["Brightness", product.brightness],
    ["Refresh rate", product.refreshRate],
    ["Resolution", product.resolution],
    ["Maintenance", product.maintenanceType],
  ].filter(([, value]) => Boolean(value));
  return (
    <article>
      <section className="bg-slate-950 py-12 text-white">
        <Container>
          <p className="text-sm font-bold tracking-wider text-cyan-300 uppercase">
            {product.category.name}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            {product.shortDescription}
          </p>
        </Container>
      </section>
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <ProductImage
              url={product.featuredImageUrl}
              name={product.name}
              className="aspect-video rounded-2xl"
            />
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.slice(1).map((image, index) => (
                  <ProductImage
                    key={image}
                    url={image}
                    name={`${product.name} gallery image ${index + 2}`}
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
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-emerald-500 px-5 py-3 text-center font-bold text-white"
                >
                  Enquire on WhatsApp
                </a>
              )}
              {product.priceType === "quote" && (
                <Link
                  href={`/request-quote?product=${product.slug}`}
                  className="rounded-lg bg-cyan-500 px-5 py-3 text-center font-bold text-slate-950"
                >
                  Request Quote
                </Link>
              )}
              <a
                href={`mailto:${settings.primaryEmail}?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}`}
                className="rounded-lg border px-5 py-3 text-center font-bold"
              >
                Send an enquiry
              </a>
            </div>
          </aside>
        </div>
        <section className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">Product overview</h2>
            <p className="mt-4 leading-8 whitespace-pre-line text-slate-600">
              {product.description}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-black">Key specifications</h2>
            <dl className="mt-4 divide-y rounded-xl border px-5">
              {keySpecs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-5 py-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
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
                  className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-900"
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
              src={video}
              title={`${product.name} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full max-w-4xl rounded-2xl border-0"
            />
          </section>
        )}
      </Container>
    </article>
  );
}
