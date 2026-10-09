import { BellAlarmProductImage } from "@/components/bell-alarm/product-image";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { getBellAlarmProducts } from "@/services/bell-alarm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const products = await getBellAlarmProducts("bell-alarm-system");
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-black">Electronic bell and alarm systems</h1>
      <p className="mt-3 text-slate-600">
        Published systems for schools, churches, offices and institutions.
      </p>
      {products.length === 0 ? (
        <p className="mt-10">No bell/alarm products yet.</p>
      ) : (
        <div className="mt-8 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => (
            <Link
              key={p.id}
              href={`/electronic-bell-alarm/products/${p.slug}`}
              className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-white"
            >
              <BellAlarmProductImage url={p.featuredImageUrl} name={p.name} />
              <div className="flex flex-1 flex-col p-5">
                <h2 className="min-h-[3.5rem] text-xl font-bold break-words">
                  {p.name}
                </h2>
                <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                  {p.shortDescription}
                </p>
                <p className="mt-auto pt-4 text-sm font-semibold">
                  {p.priceType === "fixed"
                    ? `${p.currency} ${p.price}`
                    : "Request a quote"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata(
    "/electronic-bell-alarm/products",
    await searchParams,
  );
}
