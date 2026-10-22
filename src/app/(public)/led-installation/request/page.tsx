import { PageHero } from "@/components/layout/page-hero";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { InstallationRequestForm } from "@/components/installations/installation-request-form";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getLedProducts } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function Request({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const p = await searchParams;
  const [b, products] = await Promise.all([
    getPublicBusinessSettings(),
    getLedProducts({
      page: 1,
      limit: 100,
      search: "",
      productType: "led-screen",
      status: "",
      indoorOutdoor: "",
      stockStatus: "",
      priceType: "",
      pixelPitch: "",
      brand: "",
      category: "",
    }),
  ]);
  const product = p.product
    ? products.products.find((x: any) => x.slug === p.product)
    : undefined;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHero
        title={<>Request LED installation assessment</>}
        description={
          <>
            {" "}
            Tell us about your project and location. Technical details can be
            approximate.{" "}
          </>
        }
      />
      <InstallationRequestForm
        product={
          product
            ? {
                slug: product.slug,
                name: product.name,
                description: product.description,
              }
            : undefined
        }
        whatsappNumber={b.whatsappNumber}
      />
    </main>
  );
}
