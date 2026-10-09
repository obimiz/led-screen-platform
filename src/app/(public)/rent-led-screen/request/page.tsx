import { RentalRequestForm } from "@/components/rentals/rental-request-form";
import { getRentableProducts } from "@/services/rentals";
import { getPublicBusinessSettings } from "@/services/business-settings";
export const dynamic = "force-dynamic";
export default async function RentalRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;
  const products = await getRentableProducts();
  const product = params.product
    ? products.find((p) => p.slug === params.product)
    : undefined;
  const business = await getPublicBusinessSettings();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-black">Request an LED rental quote</h1>
      <p className="mt-4 mb-8 text-lg text-slate-600">
        Share your event details and approximate requirements. Availability and
        pricing will be confirmed by our team.
      </p>
      {params.product && !product && (
        <p className="mb-6 rounded-lg bg-amber-50 p-4">
          That screen is no longer listed for rental. You can still submit a
          general request.
        </p>
      )}
      <RentalRequestForm
        product={product}
        whatsappNumber={business.whatsappNumber}
      />
    </main>
  );
}
