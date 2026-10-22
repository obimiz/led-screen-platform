import { PageHero } from "@/components/layout/page-hero";
import { BellAlarmRequestForm } from "@/components/bell-alarm/bell-alarm-request-form";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getBellAlarmProductBySlug } from "@/services/bell-alarm";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const p = await searchParams;
  const [b, product] = await Promise.all([
    getPublicBusinessSettings(),
    p.product ? getBellAlarmProductBySlug(p.product) : Promise.resolve(null),
  ]);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHero
        title={<>Request an electronic bell/alarm quote</>}
        description={
          <>
            {" "}
            Share your organisation’s requirements. Technical details can be
            approximate.{" "}
          </>
        }
      />
      <BellAlarmRequestForm
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
