import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { Container } from "@/components/ui/container";
import { indoorOutdoorOptions } from "@/lib/constants/products";
import { productQuerySchema } from "@/lib/validations/product";
import { getLedProducts, getProductCategories } from "@/services/products";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "LED Screens",
  description:
    "Explore professional indoor, outdoor, rental, and fine-pitch LED display solutions.",
};
type Search = Promise<Record<string, string | string[] | undefined>>;
export default async function LedScreensPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const raw = await searchParams;
  const simple = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = productQuerySchema.parse(simple);
  const [{ products, page, pages, total }, categories] = await Promise.all([
    getLedProducts(query),
    getProductCategories(),
  ]);
  return (
    <>
      <section className="bg-slate-950 py-16 text-white">
        <Container>
          <p className="text-sm font-bold tracking-widest text-cyan-300 uppercase">
            Product catalogue
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Professional LED screens
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Compare display solutions for commercial, worship, event, and
            advertising environments.
          </p>
        </Container>
      </section>
      <section className="py-12">
        <Container>
          <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
            <input
              name="search"
              defaultValue={query.search}
              placeholder="Search LED screens"
              className="rounded-lg border border-slate-300 bg-white p-2.5"
            />
            <select
              name="category"
              defaultValue={query.category}
              className="rounded-lg border border-slate-300 bg-white p-2.5"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              name="indoorOutdoor"
              defaultValue={query.indoorOutdoor}
              className="rounded-lg border border-slate-300 bg-white p-2.5"
            >
              <option value="">Indoor and outdoor</option>
              {indoorOutdoorOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="rounded-lg bg-cyan-500 p-2.5 font-bold">
              Apply filters
            </button>
          </form>
          <p className="my-6 text-sm text-slate-500">
            {total} LED screens found
          </p>
          {products.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-14 text-center">
              <h2 className="text-xl font-bold">
                No LED screens match your filters.
              </h2>
              <Link
                href="/led-screens"
                className="mt-3 inline-block font-semibold text-cyan-700"
              >
                Clear filters
              </Link>
            </div>
          )}
          {pages > 1 && (
            <nav
              aria-label="Catalogue pagination"
              className="mt-10 flex justify-center gap-2"
            >
              {Array.from({ length: pages }, (_, index) => index + 1).map(
                (number) => (
                  <Link
                    key={number}
                    href={{ query: { ...simple, page: number } }}
                    className={`rounded-lg px-4 py-2 ${number === page ? "bg-slate-900 text-white" : "border"}`}
                  >
                    {number}
                  </Link>
                ),
              )}
            </nav>
          )}
        </Container>
      </section>
    </>
  );
}
