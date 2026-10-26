import { isVideoAccessory } from "@/lib/utils/accessory-group";
import { PageHero } from "@/components/layout/page-hero";
import { staticPageMetadata } from "@/lib/seo/pages";
import type { SearchValues } from "@/lib/seo/metadata";
import Link from "next/link";
import { AccessoryCard } from "@/components/products/accessory-card";
import { Container } from "@/components/ui/container";
import { priceTypes, stockStatuses } from "@/lib/constants/products";
import { productQuerySchema } from "@/lib/validations/product";
import { getPublicBusinessSettings } from "@/services/business-settings";
import { getAccessories, getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
const demoAccessories = [
  [
    "LED Video Processor",
    "Signal processing and seamless switching for display walls",
  ],
  ["Receiving Card", "Reliable control hardware for modular LED cabinets"],
  [
    "LED Power Supply",
    "Stable power conversion for professional installations",
  ],
  ["Spare LED Module", "Replacement module for fast field servicing"],
];

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
  let products: Awaited<ReturnType<typeof getAccessories>>["products"] = [];
  let page = 1,
    pages = 1,
    total = 0;
  let categories: Awaited<ReturnType<typeof getCategoriesByType>> = [];
  const settings = await getPublicBusinessSettings();
  let databaseUnavailable = false;
  try {
    const result = await Promise.all([
      getAccessories(query),
      getCategoriesByType("led-accessory"),
    ]);
    ({ products, page, pages, total } = result[0]);
    categories = result[1];
  } catch {
    databaseUnavailable = true;
  }
  return (
    <main>
      <PageHero
        title={<>LED screen & video accessories</>}
        description={
          <>
            Controllers, modules, power supplies, cables, and replacement
            equipment for professional LED systems.
          </>
        }
      />
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
            <button className="bg-primary rounded-lg font-bold">
              Apply filters
            </button>
          </form>
          <p className="my-6 text-sm text-slate-500">
            {total} accessories found
          </p>
          {products.length ? (
            <div className="space-y-12">
              {[
                {
                  id: "led-screen-accessories",
                  title: "LED Screen Accessories",
                  items: products.filter((item) => !isVideoAccessory(item)),
                },
                {
                  id: "video-accessories",
                  title: "Video Accessories",
                  items: products.filter(isVideoAccessory),
                },
              ].map((group) => (
                <section
                  key={group.id}
                  id={group.id}
                  aria-labelledby={`${group.id}-title`}
                >
                  <h2
                    id={`${group.id}-title`}
                    className="mb-6 text-2xl font-bold"
                  >
                    {group.title}
                  </h2>
                  {group.items.length ? (
                    <div className="grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((item) => (
                        <AccessoryCard
                          key={item.id}
                          item={item}
                          whatsappNumber={settings.whatsappNumber}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">
                      No {group.title.toLowerCase()} match the current filters
                      on this page.
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : databaseUnavailable ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {demoAccessories.map(([name, description], index) => (
                <article
                  key={name}
                  className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`grid aspect-[4/3] place-items-center bg-gradient-to-br ${index % 2 ? "from-brand-700 to-slate-950" : "from-brand-700 to-slate-950"}`}
                  >
                    <span className="text-5xl text-white transition group-hover:scale-110">
                      ▦
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-bold">{name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                    <Link
                      className="text-brand-700 mt-4 inline-block text-sm font-bold"
                      href="/request-quote"
                    >
                      Ask about this part →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-14 text-center">
              <h2 className="text-xl font-bold">
                No accessories match your current filters.
              </h2>
              <Link
                href="/led-accessories"
                className="text-brand-700 mt-3 inline-block font-semibold"
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
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return staticPageMetadata("/led-accessories", await searchParams);
}
