import { PageHero } from "@/components/layout/page-hero";
import { PriceDisplay } from "@/components/products/price-display";
import { BellAlarmProductImage } from "@/components/bell-alarm/product-image";
import { buildProductJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { buildProductMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBellAlarmProductBySlug } from "@/services/bell-alarm";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { createWhatsAppUrl } from "@/lib/utils/contact";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [p, b] = await Promise.all([
    getBellAlarmProductBySlug((await params).slug),
    getPublicBusinessSettings(),
  ]);
  if (!p || p.productType !== "bell-alarm-system") return notFound();
  const w = createWhatsAppUrl(
    b.whatsappNumber,
    `Hello, I would like to enquire about ${p.name}.`,
  );
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Electronic Bell & Alarm", path: "/electronic-bell-alarm" },
          { name: p.name, path: `/electronic-bell-alarm/products/${p.slug}` },
        ]}
      />
      <JsonLd data={buildProductJsonLd(p)} />
      <p className="text-brand-700 text-sm font-bold uppercase">
        Electronic bell/alarm system
      </p>
      <PageHero title={<>{p.name}</>} />
      <div className="mt-6 overflow-hidden rounded-xl">
        <BellAlarmProductImage
          url={p.featuredImageUrl}
          name={p.imageAlt || p.name}
          priority
        />
      </div>
      <p className="mt-5 text-xl font-bold">
        <PriceDisplay product={p} />
      </p>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">{p.description}</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Applications and operation</h2>
          <p className="mt-3">
            {p.applicationType ||
              p.recommendedFor?.join(", ") ||
              "Various organisations"}{" "}
            · {p.operatingMode || "Flexible operating modes"}
          </p>
          <p className="mt-3">{p.coverageDescription}</p>
        </section>
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">Included components</h2>
          <p className="mt-3">
            {p.includedComponents?.join(", ") ||
              "Contact us for the system configuration."}
          </p>
        </section>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Availability: {p.stockStatus}
      </p>
      {p.specifications?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">Technical specifications</h2>
          <dl className="mt-4 divide-y rounded-xl border">
            {p.specifications.map(
              (s: { label: string; value: string }, i: number) => (
                <div key={i} className="grid grid-cols-2 gap-4 p-4">
                  <dt className="font-semibold">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ),
            )}
          </dl>
        </section>
      )}
      {p.imageUrls?.length > 0 && (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {p.imageUrls.map((url: string, i: number) => (
            <BellAlarmProductImage
              key={`${url}-${i}`}
              url={url}
              name={p.imageAlts?.[i] || p.name}
            />
          ))}
        </section>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="bg-primary rounded-lg px-5 py-3 font-bold text-white"
          href={`/electronic-bell-alarm/request?product=${p.slug}`}
        >
          Request Quote
        </Link>
        {w && (
          <a
            className="rounded-lg border px-5 py-3 font-bold"
            href={w}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Enquiry
          </a>
        )}
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getBellAlarmProductBySlug((await params).slug);
  if (!item || item.productType !== "bell-alarm-system") notFound();
  return buildProductMetadata(item, await getPublicBusinessSettings());
}
