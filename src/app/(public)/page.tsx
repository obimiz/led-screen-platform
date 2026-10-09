import { JsonLd } from "@/components/seo/json-ld";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo/structured-data";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductImage } from "@/components/products/product-media";
import { ProductCard } from "@/components/products/product-card";
import { MusicCard } from "@/components/music/music-card";
import { getPublicBusinessSettings } from "@/services/business-settings";
import {
  getFeaturedLedProducts,
  getFeaturedAccessories,
} from "@/services/products";
import { getFeaturedMusic } from "@/services/music";
import { getBellAlarmProducts } from "@/services/bell-alarm";
import {
  getFeaturedGalleryItems,
  getFeaturedTestimonials,
} from "@/services/gallery";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { HeroMedia } from "@/components/home/hero-media";
import { OrganisationMarquee } from "@/components/organisations/organisation-marquee";
import { getOrganisations } from "@/services/organisations";
import { access } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const services = [
  [
    "LED Screen Sales",
    "Browse displays and request a project quotation.",
    "/led-screens",
  ],
  [
    "LED Rental",
    "Temporary screens for events and celebrations.",
    "/rent-led-screen",
  ],
  [
    "LED Installation",
    "Permanent indoor and outdoor displays planned for your space.",
    "/led-installation",
  ],
  [
    "Maintenance & Repairs",
    "Troubleshooting, preventive servicing and repairs.",
    "/led-maintenance",
  ],
  [
    "Accessories & Spares",
    "Controllers, processors, power systems and cables.",
    "/led-accessories",
  ],
] as const;

export default async function Home() {
  const results = await Promise.allSettled([
    getPublicBusinessSettings(),
    getFeaturedLedProducts(6),
    getFeaturedAccessories(4),
    getFeaturedMusic(3),
    getBellAlarmProducts("bell-alarm-system"),
    getFeaturedGalleryItems(6),
    getFeaturedTestimonials(3),
    getOrganisations(true),
  ]);
  const value = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback;
  const business = value(results[0], await getPublicBusinessSettings());
  const products = value(results[1], []);
  const accessories = value(results[2], []);
  const music = value(results[3], []);
  const bells = value(results[4], []);
  const gallery = value(results[5], []);
  const testimonials = value(results[6], []);
  const organisations = value(results[7], []);
  const hasVideo = await access(
    path.join(process.cwd(), "public/videos/image-grant-hero.mp4"),
  ).then(
    () => true,
    () => false,
  );
  const whatsapp = createWhatsAppUrl(
    business.whatsappNumber,
    "Hello, I would like to know more about your LED screen solutions.",
  );
  return (
    <main>
      <JsonLd data={buildOrganizationJsonLd(business)} />
      <JsonLd data={buildWebsiteJsonLd(business)} />
      <section className="bg-brand-950 relative isolate flex min-h-[560px] items-center overflow-hidden py-20 text-white md:min-h-[75svh] md:py-28">
        <HeroMedia
          videoUrl={hasVideo ? "/videos/image-grant-hero.mp4" : undefined}
        />
        <Container className="relative z-10 w-full">
          <p className="text-sm font-bold tracking-[0.18em] text-white/80 uppercase">
            {business.businessName}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
            Professional LED Display Solutions
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
            Sales, installation, rental and maintenance of LED display systems
            for churches, businesses, institutions and events.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/led-screens"
              className="bg-brand-700 hover:bg-brand-600 rounded-lg px-5 py-3 font-bold text-white ring-1 ring-white/30"
            >
              Explore Products
            </Link>
            <Link
              href="/request-quote"
              className="rounded-lg border border-white/70 bg-black/20 px-5 py-3 font-bold hover:bg-white/10"
            >
              Request a Quote
            </Link>
          </div>
        </Container>
      </section>
      <OrganisationMarquee items={organisations} />
      <section id="services" className="bg-slate-50 py-20">
        <Container>
          <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
            Our services
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            One team for the display lifecycle.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map(([title, description, href]) => (
              <article key={title} className="rounded-2xl border bg-white p-6">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
                <Link
                  href={href}
                  className="text-brand-700 mt-5 inline-block font-bold"
                >
                  Learn more →
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-20">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
                Featured catalogue
              </p>
              <h2 className="mt-2 text-3xl font-black">Featured LED screens</h2>
            </div>
            <Link href="/led-screens" className="text-brand-700 font-bold">
              View All Products
            </Link>
          </div>
          {products.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed p-8">
              Tell us what you need and we will recommend a suitable display.{" "}
              <Link className="text-brand-700 font-bold" href="/request-quote">
                Request a quote
              </Link>
            </p>
          )}
        </Container>
      </section>
      <section id="solutions" className="bg-brand-50 py-16">
        <Container>
          <h2 className="text-3xl font-black">LED solutions for your space</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Explore a display solution around your audience, environment and
            intended use.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Churches & auditoriums",
              "Businesses & institutions",
              "Events & celebrations",
              "Indoor & outdoor spaces",
            ].map((title) => (
              <Link
                key={title}
                href="/request-quote"
                className="rounded-xl border bg-white p-5 font-bold"
              >
                {title}
                <span className="text-brand-700 mt-3 block text-sm font-normal">
                  Discuss your requirements →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
      {gallery.length > 0 && (
        <section className="bg-slate-50 py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
                  Our work
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Featured projects and events
                </h2>
              </div>
              <Link href="/gallery" className="text-brand-700 font-bold">
                View gallery
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item: any) => (
                <Link
                  key={item.id}
                  href={item.slug ? `/gallery/${item.slug}` : "/gallery"}
                  className="overflow-hidden rounded-2xl border bg-white"
                >
                  <div className="aspect-[4/3] bg-slate-200">
                    <ProductImage
                      url={item.thumbnailUrl || item.imageUrl || ""}
                      name={item.altText || item.title}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.caption || item.city || item.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
      <section className="py-16">
        <Container>
          <h2 className="text-3xl font-black">
            Why choose Image Grant Technology?
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [
                "From selection to support",
                "Sales, installation, rental and maintenance services in one place.",
              ],
              [
                "Built around your requirements",
                "Request a quotation for your space, intended use and budget.",
              ],
              [
                "Options for permanent and temporary use",
                "Explore LED screen purchases and rentals for your next project or event.",
              ],
            ].map(([title, text]) => (
              <article key={title}>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      {testimonials.length > 0 && (
        <section className="py-20">
          <Container>
            <h2 className="text-3xl font-black">What our customers say</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {testimonials.map((item: any) => (
                <article key={item.id} className="rounded-2xl border p-6">
                  <p className="leading-7 text-slate-700">“{item.quote}”</p>
                  <p className="mt-5 font-bold">{item.customerDisplayName}</p>
                  {item.organizationName && (
                    <p className="text-sm text-slate-500">
                      {item.organizationName}
                    </p>
                  )}
                </article>
              ))}
            </div>
            <Link
              href="/testimonials"
              className="text-brand-700 mt-6 inline-block font-bold"
            >
              Read more testimonials →
            </Link>
          </Container>
        </section>
      )}
      {accessories.length > 0 && (
        <section className="py-20">
          <Container>
            <h2 className="text-3xl font-black">Accessories and spare parts</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {accessories.map((item: any) => (
                <article key={item.id} className="rounded-xl border p-5">
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.shortDescription}
                  </p>
                  <Link
                    className="text-brand-700 mt-4 inline-block text-sm font-bold"
                    href={`/led-accessories/${item.slug}`}
                  >
                    View accessory
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}
      {bells.length > 0 && (
        <section className="bg-brand-50 py-16">
          <Container>
            <h2 className="text-3xl font-black">
              Electronic bell and alarm systems
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Programmable bell and alert solutions for churches, schools,
              offices and institutions.
            </p>
            <Link
              href="/electronic-bell-alarm"
              className="text-brand-700 mt-5 inline-block font-bold"
            >
              Explore Bell & Alarm →
            </Link>
          </Container>
        </section>
      )}
      {music.length > 0 && (
        <section className="py-20">
          <Container>
            <h2 className="text-3xl font-black">Christian & Catholic Music</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {music.map((item: any) => (
                <MusicCard key={item.id} item={item} />
              ))}
            </div>
            <Link
              href="/music"
              className="text-brand-700 mt-6 inline-block font-bold"
            >
              Explore Music →
            </Link>
          </Container>
        </section>
      )}
      <section className="bg-brand-50 py-16">
        <Container>
          <h2 className="text-brand-900 text-3xl font-black">
            Need an LED screen solution?
          </h2>
          <p className="mt-3 max-w-2xl text-slate-800">
            Tell us about your project and we will help identify the right
            option.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/request-quote"
              className="bg-primary hover:bg-primary-hover rounded-lg px-5 py-3 font-bold text-white"
            >
              Request Quote
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-950/30 px-5 py-3 font-bold"
              >
                WhatsApp Us
              </a>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/", await searchParams);
}
