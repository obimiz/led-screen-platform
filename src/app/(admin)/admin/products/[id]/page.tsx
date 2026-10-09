import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveProductButton } from "@/components/products/archive-product-button";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getLedProductById } from "@/services/products";
export const dynamic = "force-dynamic";
export default async function AdminProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const product = await getLedProductById((await params).id);
  if (!product) notFound();
  return (
    <article className="mx-auto max-w-6xl">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wider text-brand-700 uppercase">
            {product.category.name}
          </p>
          <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="rounded-lg bg-primary px-4 py-2.5 font-bold"
          >
            Edit product
          </Link>
          {product.status !== "archived" && (
            <ArchiveProductButton id={product.id} />
          )}
        </div>
      </div>
      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <ProductImage
          url={product.featuredImageUrl}
          name={product.name}
          className="aspect-video rounded-2xl"
        />
        <div className="rounded-2xl border bg-white p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt>Status</dt>
            <dd className="font-semibold">{product.status}</dd>
            <dt>Price</dt>
            <dd className="font-semibold">
              <PriceDisplay product={product} />
            </dd>
            <dt>Stock</dt>
            <dd>
              {product.stockStatus} ({product.quantity})
            </dd>
            <dt>Environment</dt>
            <dd>{product.indoorOutdoor}</dd>
            <dt>Pixel pitch</dt>
            <dd>{product.pixelPitch || "—"}</dd>
            <dt>Slug</dt>
            <dd className="break-all">{product.slug}</dd>
          </dl>
        </div>
      </div>
      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">Description</h2>
        <p className="mt-3 leading-7 whitespace-pre-line text-slate-600">
          {product.description}
        </p>
      </section>
      {product.specifications.length > 0 && (
        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Specifications</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {product.specifications.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="flex justify-between gap-4 border-b py-2"
              >
                <dt>{item.label}</dt>
                <dd className="font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
