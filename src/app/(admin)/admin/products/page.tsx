import Link from "next/link";
import { redirect } from "next/navigation";
import { ArchiveProductButton } from "@/components/products/archive-product-button";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  indoorOutdoorOptions,
  productStatuses,
  stockStatuses,
} from "@/lib/constants/products";
import { productQuerySchema } from "@/lib/validations/product";
import { getLedProducts, getProductCategories } from "@/services/products";
export const dynamic = "force-dynamic";
type Search = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const raw = await searchParams;
  const simple = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = productQuerySchema.parse({ ...simple, limit: 15 });
  const [{ products, page, pages, total }, categories] = await Promise.all([
    getLedProducts(query, true),
    getProductCategories(true),
  ]);
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">LED products</h1>
          <p className="mt-2 text-slate-600">{total} catalogue items</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/product-categories"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold"
          >
            Categories
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-primary px-4 py-2.5 font-bold"
          >
            New product
          </Link>
        </div>
      </div>
      <form className="my-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input
          name="search"
          defaultValue={query.search}
          placeholder="Search products"
          className="rounded-lg border p-2.5"
        />
        <select
          name="category"
          defaultValue={query.category}
          className="rounded-lg border p-2.5"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="indoorOutdoor"
          defaultValue={query.indoorOutdoor}
          className="rounded-lg border p-2.5"
        >
          <option value="">All environments</option>
          {indoorOutdoorOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={query.status}
          className="rounded-lg border p-2.5"
        >
          <option value="">All statuses</option>
          {productStatuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          name="stockStatus"
          defaultValue={query.stockStatus}
          className="rounded-lg border p-2.5"
        >
          <option value="">All stock states</option>
          {stockStatuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2.5 font-bold text-white">
          Filter
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Product",
                "Category",
                "Environment",
                "Pixel pitch",
                "Price",
                "Stock",
                "Status",
                "Updated",
                "Actions",
              ].map((label) => (
                <th key={label} className="p-4">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      url={product.featuredImageUrl}
                      name={product.name}
                      className="size-12 rounded-lg"
                    />
                    <div>
                      <p className="font-bold">{product.name}</p>
                      {product.featured && (
                        <span className="text-xs text-brand-700">Featured</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">{product.category.name}</td>
                <td className="p-4">{product.indoorOutdoor}</td>
                <td className="p-4">{product.pixelPitch || "—"}</td>
                <td className="p-4">
                  <PriceDisplay product={product} />
                </td>
                <td className="p-4">{product.stockStatus}</td>
                <td className="p-4">{product.status}</td>
                <td className="p-4">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-semibold text-brand-700"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="font-semibold"
                    >
                      Edit
                    </Link>
                    {product.status !== "archived" && (
                      <ArchiveProductButton id={product.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500">
              No LED products have been created yet.
            </p>
            <Link
              href="/admin/products/new"
              className="mt-3 inline-block font-semibold text-brand-700"
            >
              Create the first product
            </Link>
          </div>
        )}
      </div>
      {pages > 1 && (
        <nav className="mt-6 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, index) => index + 1).map(
            (number) => (
              <Link
                key={number}
                href={{ query: { ...simple, page: number } }}
                className={`rounded px-3 py-2 ${number === page ? "bg-slate-900 text-white" : "bg-white"}`}
              >
                {number}
              </Link>
            ),
          )}
        </nav>
      )}
    </section>
  );
}
