import { PageHero } from "@/components/layout/page-hero";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import { QuoteRequestForm } from "@/components/sales/quote-request-form";
import { getLedProductBySlug, getAccessoryBySlug } from "@/services/products";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;
  const slug = typeof params.product === "string" ? params.product : "";
  const product = slug
    ? ((await getLedProductBySlug(slug)) ?? (await getAccessoryBySlug(slug)))
    : null;
  const business = await getPublicBusinessSettings();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHero
        title={<>Let&apos;s find the right LED solution</>}
        description={
          <>
            {" "}
            Tell us what you have in mind. You don&apos;t need to know the
            technical details — our team can help you choose.{" "}
          </>
        }
      />
      {slug && !product && (
        <p role="status" className="mb-6 rounded-lg bg-amber-50 p-4">
          The selected product is unavailable. You can still send a general
          quotation request below.
        </p>
      )}
      <QuoteRequestForm
        product={
          product
            ? {
                slug: product.slug,
                name: product.name,
                description: product.shortDescription,
                ...("indoorOutdoor" in product
                  ? {
                      indoorOutdoor: product.indoorOutdoor,
                      pixelPitch: product.pixelPitch,
                    }
                  : {}),
              }
            : undefined
        }
        whatsappNumber={business.whatsappNumber}
      />
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/request-quote", await searchParams);
}
