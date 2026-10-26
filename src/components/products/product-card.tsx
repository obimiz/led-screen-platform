import { effectiveProductPrice } from "@/lib/utils/product-price";
import { getProductDisplayImages } from "@/lib/media/product-primary-image";
import Link from "next/link";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import type { LedProduct } from "@/types/product";
import { AddToCartButton } from "@/components/cart/cart-controls";
import { getLedHeadlineSpecs } from "@/lib/utils/led-headline-specs";
export function ProductCard({ product }: { product: LedProduct }) {
  const imageUrl = getProductDisplayImages(product)[0] || "";
  const headlineSpecs = getLedHeadlineSpecs(product);
  return (
    <article className="group hover:border-brand-300 flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-md">
      <ProductImage
        url={imageUrl}
        name={product.name}
        fit={product.imageFit}
        neutralFallback
        className="aspect-[16/10] shrink-0"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-brand-700 text-xs font-bold tracking-wider uppercase">
          {product.category.name}
        </p>
        <h2 className="mt-2 text-xl font-bold break-words">
          <Link
            href={`/led-screens/${product.slug}`}
            className="hover:text-brand-700"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
          {product.shortDescription}
        </p>
        {(headlineSpecs.length > 0 || product.usageApplications.length > 0) && (
          <div className="mt-3 space-y-1 text-sm leading-5 text-slate-500">
            {headlineSpecs.map(([label, value]) => (
              <p key={label} className="break-words">
                <span className="font-medium text-slate-600">{label}:</span>{" "}
                {value}
              </p>
            ))}
            {product.usageApplications.length > 0 && (
              <p>{product.usageApplications.slice(0, 2).join(" · ")}</p>
            )}
          </div>
        )}
        <p className="mt-auto pt-4 font-bold text-slate-950">
          <PriceDisplay product={product} />
        </p>
        <Link
          href={`/led-screens/${product.slug}`}
          className="bg-primary hover:bg-primary-hover mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-bold text-white"
        >
          View details
        </Link>
        <Link
          href={`/request-quote?product=${encodeURIComponent(product.slug)}`}
          className="text-brand-700 mt-3 inline-block text-sm font-bold"
        >
          Request Quote
        </Link>
        {product.priceType === "fixed" &&
          product.isPurchasableOnline &&
          product.price !== null &&
          product.stockStatus !== "out-of-stock" && (
            <div className="mt-3">
              <AddToCartButton
                item={{
                  productId: product.id,
                  productName: product.name,
                  slug: product.slug,
                  productType: product.productType,
                  sku: "",
                  imageUrl,
                  quantity: product.minOrderQuantity || 1,
                  displayedUnitPrice:
                    effectiveProductPrice(product) ?? product.price,
                  currency: product.currency,
                  minOrderQuantity: product.minOrderQuantity,
                  maxOrderQuantity: product.maxOrderQuantity,
                }}
              />
            </div>
          )}
      </div>
    </article>
  );
}
