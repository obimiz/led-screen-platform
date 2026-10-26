import Link from "next/link";
import { redirect } from "next/navigation";
import { ArchiveProductButton } from "@/components/products/archive-product-button";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  priceTypes,
  productStatuses,
  stockStatuses,
} from "@/lib/constants/products";
import { productQuerySchema } from "@/lib/validations/product";
import { getAccessories, getCategoriesByType } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function AccessoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
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
    limit: 15,
  });
  const [{ products, page, pages, total }, categories] = await Promise.all([
    getAccessories(query, true),
    getCategoriesByType("led-accessory", true),
  ]);
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">LED accessories</h1>
          <p className="mt-2 text-slate-600">
            {total} accessories and replacement parts
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/accessory-categories"
            className="rounded-lg border bg-white px-4 py-2.5 font-semibold"
          >
            Categories
          </Link>
          <Link
            href="/admin/accessories/new"
            className="bg-primary rounded-lg px-4 py-2.5 font-bold"
          >
            New accessory
          </Link>
        </div>
      </div>
      <form className="my-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-6">
        <input
          name="search"
          defaultValue={query.search}
          placeholder="Name, SKU, brand, model"
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
          name="stockStatus"
          defaultValue={query.stockStatus}
          className="rounded-lg border p-2.5"
        >
          <option value="">All stock</option>
          {stockStatuses.map((item) => (
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
          name="priceType"
          defaultValue={query.priceType}
          className="rounded-lg border p-2.5"
        >
          <option value="">All price types</option>
          {priceTypes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="rounded-lg bg-slate-900 font-bold text-white">
          Filter
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Accessory",
                "SKU",
                "Category",
                "Brand",
                "Price",
                "Quantity",
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
            {products.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      url={item.featuredImageUrl}
                      name={item.name}
                      className="size-12 rounded-lg"
                    />
                    <div>
                      <p className="font-bold">{item.name}</p>
                      {item.featured && (
                        <span className="text-brand-700 text-xs">Featured</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">{item.sku || "—"}</td>
                <td className="p-4">{item.category.name}</td>
                <td className="p-4">{item.brand || "—"}</td>
                <td className="p-4">
                  <PriceDisplay product={item} />
                </td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4">{item.stockStatus}</td>
                <td className="p-4">{item.status}</td>
                <td className="p-4">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/accessories/${item.id}`}
                      className="text-brand-700 font-semibold"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/accessories/${item.id}/edit`}
                      className="font-semibold"
                    >
                      Edit
                    </Link>
                    <ArchiveProductButton
                      id={item.id}
                      productType="led-accessory"
                      archived={item.status === "archived"}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && (
          <div className="p-12 text-center">
            <p className="text-slate-500">
              No LED accessories have been added yet.
            </p>
            <Link
              href="/admin/accessories/new"
              className="text-brand-700 mt-3 inline-block font-semibold"
            >
              Add the first accessory
            </Link>
          </div>
        )}
      </div>
      {pages > 1 && (
        <nav className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((number) => (
            <Link
              key={number}
              href={{ query: { ...simple, page: number } }}
              className={`rounded px-3 py-2 ${number === page ? "bg-slate-900 text-white" : "bg-white"}`}
            >
              {number}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
