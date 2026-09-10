import type { Metadata } from "next";
import Link from "next/link";
import { AccessoryCard } from "@/components/products/accessory-card";
import { Container } from "@/components/ui/container";
import { priceTypes, stockStatuses } from "@/lib/constants/products";
import { productQuerySchema } from "@/lib/validations/product";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getAccessories, getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "LED Accessories & Spare Parts",
  description:
    "Browse LED modules, controllers, power supplies, receiving cards, cables, and replacement parts.",
};
export default async function AccessoriesCatalogue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const simple = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = productQuerySchema.parse({
    ...simple,
    productType: "led-accessory",
  });
  const [{ products, page, pages, total }, categories, settings] =
    await Promise.all([
      getAccessories(query),
      getCategoriesByType("led-accessory"),
      getPublicBusinessSettings(),
    ]);
  return (
    <>
      <section className="bg-slate-950 py-16 text-white">
        <Container>
          <p className="text-sm font-bold tracking-widest text-cyan-300 uppercase">
            Accessories and parts
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            LED accessories & spare parts
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Controllers, modules, power supplies, cables, and replacement
            equipment for professional LED systems.
          </p>
        </Container>
      </section>
      <section className="py-12">
        <Container>
          <form className="grid gap-3 rounded-2xl border bg-slate-50 p-4 md:grid-cols-5">
            <input
              name="search"
              defaultValue={query.search}
              placeholder="Search name, SKU, brand"
              className="rounded-lg border bg-white p-2.5"
            />
            <select
              name="category"
              defaultValue={query.category}
              className="rounded-lg border bg-white p-2.5"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              name="stockStatus"
              defaultValue={query.stockStatus}
              className="rounded-lg border bg-white p-2.5"
            >
              <option value="">All availability</option>
              {stockStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              name="priceType"
              defaultValue={query.priceType}
              className="rounded-lg border bg-white p-2.5"
            >
              <option value="">All prices</option>
              {priceTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="rounded-lg bg-cyan-500 font-bold">
              Apply filters
            </button>
          </form>
          <p className="my-6 text-sm text-slate-500">
            {total} accessories found
          </p>
          {products.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((item) => (
                <AccessoryCard
                  key={item.id}
                  item={item}
                  whatsappNumber={settings.whatsappNumber}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-14 text-center">
              <h2 className="text-xl font-bold">
                No accessories match your current filters.
              </h2>
              <Link
                href="/led-accessories"
                className="mt-3 inline-block font-semibold text-cyan-700"
              >
                Clear filters
              </Link>
            </div>
          )}
          {pages > 1 && (
            <nav
              className="mt-10 flex justify-center gap-2"
              aria-label="Pagination"
            >
              {Array.from({ length: pages }, (_, i) => i + 1).map((number) => (
                <Link
                  key={number}
                  href={{ query: { ...simple, page: number } }}
                  className={`rounded-lg px-4 py-2 ${number === page ? "bg-slate-900 text-white" : "border"}`}
                >
                  {number}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>
    </>
  );
}
