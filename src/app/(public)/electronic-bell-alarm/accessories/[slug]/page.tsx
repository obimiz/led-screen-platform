import { PageHero } from "@/components/layout/page-hero";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { buildProductJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { buildProductMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { notFound } from "next/navigation";
import { getBellAlarmProductBySlug } from "@/services/bell-alarm";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await getBellAlarmProductBySlug((await params).slug);
  if (!p || p.productType !== "bell-alarm-accessory") return notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          {
            name: "Bell Accessories",
            path: "/electronic-bell-alarm/accessories",
          },
          {
            name: p.name,
            path: `/electronic-bell-alarm/accessories/${p.slug}`,
          },
        ]}
      />
      <JsonLd data={buildProductJsonLd(p)} />
      <p className="text-brand-700 text-sm font-bold uppercase">
        Bell/alarm accessory
      </p>
      <PageHero title={<>{p.name}</>} />
      {p.featuredImageUrl && (
        <ProductImage
          url={p.featuredImageUrl}
          name={p.name}
          priority
          className="mt-6 aspect-video rounded-xl"
        />
      )}
      <p className="mt-5 text-xl font-bold">
        <PriceDisplay product={p} />
      </p>
      <p className="mt-4 text-lg text-slate-600">{p.description}</p>
      <p className="mt-6">
        Compatibility:{" "}
        {p.compatibility?.join(", ") || "Contact us to confirm compatibility."}
      </p>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getBellAlarmProductBySlug((await params).slug);
  if (!item || item.productType !== "bell-alarm-accessory") notFound();
  return buildProductMetadata(item, await getPublicBusinessSettings());
}
