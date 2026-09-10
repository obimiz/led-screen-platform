import Link from "next/link";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import type { LedProduct } from "@/types/product";
export function ProductCard({ product }: { product: LedProduct }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ProductImage url={product.featuredImageUrl} name={product.name} />
      <div className="p-5">
        <p className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
          {product.category.name}
        </p>
        <h2 className="mt-2 text-xl font-bold">
          <Link
            href={`/led-screens/${product.slug}`}
            className="hover:text-cyan-700"
          >
            {product.name}
          </Link>
        </h2>
        <div className="mt-3 flex gap-3 text-sm text-slate-500">
          <span>{product.indoorOutdoor}</span>
          {product.pixelPitch && <span>• {product.pixelPitch}</span>}
        </div>
        <p className="mt-4 font-bold text-slate-950">
          <PriceDisplay product={product} />
        </p>
        <Link
          href={`/led-screens/${product.slug}`}
          className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
