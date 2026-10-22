import { getHomepageImages } from "@/services/homepage-images";
import { defaultHomepageImages } from "@/lib/validations/homepage-images";
import Image from "next/image";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo/structured-data";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/products/product-card";
import { ContentCard } from "@/components/publishing/card";
import { getFeaturedContent, getHomepageArticles } from "@/services/portfolio";
import { AccessoryCard } from "@/components/products/accessory-card";
import {
  Bell,
  Video,
  Monitor,
  Wrench,
  CalendarDays,
  Settings,
} from "lucide-react";
import { ProductImage } from "@/components/products/product-media";
import { getPublicBusinessSettings } from "@/services/business-settings";
import {
  getFeaturedLedProducts,
  getFeaturedAccessories,
} from "@/services/products";

import { getBellAlarmProducts } from "@/services/bell-alarm";
import { getFeaturedGalleryItems } from "@/services/gallery";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import { HeroMedia } from "@/components/home/hero-media";
import { OrganisationMarquee } from "@/components/organisations/organisation-marquee";
import { getOrganisations } from "@/services/organisations";
import { access } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const services = [
  [
    "LED Display Sales",
    "Choose a display around your space and audience.",
    "/led-screens",
    Monitor,
  ],
  [
    "LED Screen Installation",
    "Plan permanent indoor and outdoor installations.",
    "/led-installation",
    Settings,
  ],
  [
    "LED Screen Rental",
    "Temporary displays for events and celebrations.",
    "/rent-led-screen",
    CalendarDays,
  ],
  [
    "LED Screen Maintenance",
    "Preventive servicing, troubleshooting and repairs.",
    "/led-maintenance",
    Wrench,
  ],
] as const;
export default async function Home() {
  const business = await getPublicBusinessSettings();
  const results = await Promise.allSettled([
    getFeaturedLedProducts(6),
    getFeaturedAccessories(6),
    getBellAlarmProducts(),
    getFeaturedAccessories(3, true),
    getFeaturedContent(4, "project"),
    getHomepageArticles(),
    getOrganisations(true),
    getFeaturedGalleryItems(6),
    getHomepageImages(),
  ]);
  const value = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === "fulfilled" ? r.value : fallback;
  const products = value(results[0], []),
    accessories = value(results[1], []),
    bells = value(results[2], []),
    cameras = value(results[3], []),
    projects = value(results[4], []),
    articles = value(results[5], []),
    organisations = value(results[6], []),
    gallery = value(results[7], []);
  const homepageImages = value(results[8], defaultHomepageImages);
  const bell = bells.find(
    (p) => p.featured && (p.featuredImageUrl || p.imageUrls?.length),
  );
  const bellImageUrl =
    homepageImages.bellImageUrl ||
    bell?.featuredImageUrl ||
    bell?.imageUrls?.[0] ||
    "";
  const bellImageAlt = homepageImages.bellImageUrl
    ? homepageImages.bellImageAlt || "Electronic bell system"
    : bell?.imageAlt || bell?.name || "Electronic bell system";
  const showBellProduct = bell && !homepageImages.bellImageUrl;
  const leadCamera = homepageImages.cameraImageUrl
    ? undefined
    : cameras.find((p) => p.featuredImageUrl || p.imageUrls.length);
  const cameraImageUrl =
    homepageImages.cameraImageUrl ||
    leadCamera?.featuredImageUrl ||
    leadCamera?.imageUrls?.[0] ||
    "";
  const cameraImageAlt = homepageImages.cameraImageUrl
    ? homepageImages.cameraImageAlt ||
      "Camera for LED screen live video production"
    : leadCamera?.imageAlt ||
      leadCamera?.name ||
      "Camera for LED screen live video production";
  const cameraCards = cameras.filter((p) => p.id !== leadCamera?.id);
  const hasVideo = await access(
    path.join(process.cwd(), "public/videos/image-grant-hero.mp4"),
  ).then(
    () => true,
    () => false,
  );
  const whatsapp = createWhatsAppUrl(
    "2348039308982",
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

      <section id="services" className="bg-slate-50 py-12">
        <Container>
          <article className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-black">Our Services</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">
              Sales, installation, rental and maintenance of LED display systems
              for churches, businesses, institutions, events, restaurants and
              bars.
            </p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(([title, description, href, Icon]) => (
                <div key={title}>
                  <Icon className="text-brand-700 mb-3" aria-hidden="true" />
                  <h3 className="font-bold">
                    <Link href={href}>{title}</Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/request-quote"
              className="mt-7 inline-block rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white"
            >
              Request a Quote
            </Link>
          </article>
        </Container>
      </section>
      <section className="py-12">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-black">Featured LED Screens</h2>
            <Link className="text-brand-700 font-bold" href="/led-screens">
              View All Products →
            </Link>
          </div>
          {products.length ? (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="mt-6">
              Tell us what you need and we will recommend a suitable display.{" "}
              <Link href="/request-quote" className="text-brand-700 font-bold">
                Request a quote
              </Link>
            </p>
          )}
        </Container>
      </section>
      <section
        id="electronic-digital-bell"
        aria-labelledby="bell-showcase-heading"
        className="bg-brand-50 py-12"
      >
        <Container className="grid items-center gap-8 md:grid-cols-2">
          {bellImageUrl ? (
            <ProductImage
              url={bellImageUrl}
              name={bellImageAlt}
              neutralFallback
              fit="contain"
              className="aspect-[4/3] rounded-xl"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[#28146B]"
            >
              <Bell className="size-24 text-white/90" strokeWidth={1} />
            </div>
          )}
          <div>
            <h2 id="bell-showcase-heading" className="text-3xl font-black">
              Electronic Digital Bell Systems
            </h2>
            {showBellProduct && (
              <h3 className="mt-4 text-xl font-bold">{bell.name}</h3>
            )}
            <p className="mt-3 leading-7 text-slate-600">
              {showBellProduct
                ? bell.shortDescription
                : "Discuss an electronic bell and alarm solution for your school, church, office or institution. Our team can help with equipment selection, installation, configuration and support."}
            </p>
            <Link
              href="/electronic-bell-alarm"
              className="mt-6 inline-block rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white"
            >
              Explore Bell & Alarm →
            </Link>
          </div>
        </Container>
      </section>
      <section
        id="led-screen-cameras"
        aria-labelledby="camera-showcase-heading"
        className="py-12"
      >
        <Container>
          <div
            className="grid items-center gap-8 md:grid-cols-2"
            data-camera-feature
          >
            {cameraImageUrl ? (
              <ProductImage
                url={cameraImageUrl}
                name={cameraImageAlt}
                neutralFallback
                fit="contain"
                className="aspect-[4/3] rounded-xl"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[#28146B]"
              >
                <Video className="size-24 text-white/90" strokeWidth={1} />
              </div>
            )}
            <div>
              <h2 id="camera-showcase-heading" className="text-3xl font-black">
                LED Screen Cameras & Live Video Solutions
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                Cameras for live video production using compatible video
                processors, switchers or signal conversion equipment. Ask us to
                confirm compatibility for your setup.
              </p>
              {leadCamera ? (
                <>
                  <h3 className="mt-4 text-xl font-bold">{leadCamera.name}</h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {leadCamera.shortDescription}
                  </p>
                  <Link
                    href={`/led-accessories/${leadCamera.slug}`}
                    className="text-brand-700 mt-4 inline-block font-bold"
                  >
                    View Camera Details →
                  </Link>
                </>
              ) : (
                <p className="mt-5 leading-7 text-slate-600">
                  Tell us about your venue, filming needs and existing LED
                  display equipment so we can discuss a suitable live video
                  setup.
                </p>
              )}
              <Link
                href="/contact"
                className="mt-6 inline-block rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white"
              >
                Enquire About Live Video Solutions →
              </Link>
            </div>
          </div>
          {cameraCards.length > 0 && (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cameraCards.map((item) => (
                <AccessoryCard
                  key={item.id}
                  item={item}
                  whatsappNumber="2348039308982"
                />
              ))}
            </div>
          )}
        </Container>
      </section>
      {accessories.length > 0 && (
        <section className="bg-slate-50 py-12">
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black">LED Screen Accessories</h2>
              <Link className="text-brand-700 font-bold" href="/accessories">
                View All Accessories →
              </Link>
            </div>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {accessories.map((item) => (
                <AccessoryCard
                  key={item.id}
                  item={item}
                  whatsappNumber="2348039308982"
                />
              ))}
            </div>
          </Container>
        </section>
      )}
      {projects.length > 0 && (
        <section className="py-12">
          <Container>
            <h2 className="text-3xl font-black">Featured Projects</h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
            <Link
              className="text-brand-700 mt-6 inline-block font-bold"
              href="/projects"
            >
              View All Projects →
            </Link>
          </Container>
        </section>
      )}
      <section
        id="blog"
        aria-labelledby="homepage-blog-title"
        className="bg-slate-50 py-12"
      >
        <Container>
          <p className="text-brand-700 mb-3 text-sm font-bold tracking-widest uppercase">
            From Our Blog
          </p>
          <h2 id="homepage-blog-title" className="text-3xl font-black">
            Latest News & Insights
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Explore news, project stories and practical insights from Image
            Grant Technology.
          </p>
          {articles.length > 0 ? (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-slate-600">
              Our latest articles will appear here when published. Visit the
              blog for updates.
            </p>
          )}
          <Link
            className="mt-6 inline-block rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white"
            href="/blog"
          >
            View All Articles →
          </Link>
        </Container>
      </section>
      <OrganisationMarquee items={organisations} />
      {gallery.length > 0 && (
        <section className="bg-slate-50 py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-brand-700 text-sm font-bold tracking-widest uppercase">
                  Our work
                </p>
                <h2 className="mt-2 text-3xl font-black">Featured gallery</h2>
              </div>
              <Link href="/gallery" className="text-brand-700 font-bold">
                View Full Gallery
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item: any) => (
                <Link
                  key={item.id}
                  href={item.slug ? `/gallery/${item.slug}` : "/gallery"}
                  className="overflow-hidden rounded-2xl border bg-white"
                >
                  <div className="relative aspect-[4/3] bg-slate-200">
                    <Image
                      src={item.thumbnailUrl || item.imageUrl}
                      alt={item.altText || item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={
                        !(item.thumbnailUrl || item.imageUrl).startsWith("/")
                      }
                      className={
                        item.productId ? "object-contain" : "object-cover"
                      }
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
