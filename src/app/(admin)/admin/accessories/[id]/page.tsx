import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveProductButton } from "@/components/products/archive-product-button";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getAccessoryById } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function AccessoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const item = await getAccessoryById((await params).id);
  if (!item) notFound();
  return (
    <article className="mx-auto max-w-6xl">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wider text-brand-700 uppercase">
            {item.category.name}
          </p>
          <h1 className="mt-2 text-3xl font-black">{item.name}</h1>
          <p className="mt-1 text-slate-500">
            {[item.brand, item.modelNumber, item.sku]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/accessories/${item.id}/edit`}
            className="rounded-lg bg-primary px-4 py-2.5 font-bold"
          >
            Edit
          </Link>
          <ArchiveProductButton
            id={item.id}
            productType="led-accessory"
            archived={item.status === "archived"}
          />
        </div>
      </div>
      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <ProductImage
          url={item.featuredImageUrl}
          name={item.name}
          className="aspect-video rounded-2xl"
        />
        <div className="rounded-2xl border bg-white p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt>Status</dt>
            <dd className="font-semibold">{item.status}</dd>
            <dt>Price</dt>
            <dd className="font-semibold">
              <PriceDisplay product={item} />
            </dd>
            <dt>Stock</dt>
            <dd>
              {item.stockStatus} ({item.quantity})
            </dd>
            <dt>Brand</dt>
            <dd>{item.brand || "—"}</dd>
            <dt>Model</dt>
            <dd>{item.modelNumber || "—"}</dd>
            <dt>SKU</dt>
            <dd>{item.sku || "—"}</dd>
          </dl>
        </div>
      </div>
      <section className="mt-7 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">Description</h2>
        <p className="mt-3 leading-7 whitespace-pre-line text-slate-600">
          {item.description}
        </p>
      </section>
      {item.compatibility.length > 0 && (
        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Compatibility</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {item.compatibility.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </section>
      )}
      {item.specifications.length > 0 && (
        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Specifications</h2>
          <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {item.specifications.map((spec) => (
              <div
                key={`${spec.label}-${spec.value}`}
                className="flex justify-between border-b py-3"
              >
                <dt>{spec.label}</dt>
                <dd className="font-semibold">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
