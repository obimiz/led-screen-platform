import Link from "next/link";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import type { AccessoryProduct } from "@/types/product";
import { AddToCartButton } from "@/components/cart/cart-controls";
export function AccessoryCard({
  item,
  whatsappNumber,
}: {
  item: AccessoryProduct;
  whatsappNumber: string;
}) {
  const whatsapp = createWhatsAppUrl(
    whatsappNumber,
    `Hello, I am interested in the ${item.name} listed on your website. Please provide more information.`,
  );
  return (
    <article className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl">
      <ProductImage url={item.featuredImageUrl} name={item.name} />
      <div className="p-5">
        <p className="text-xs font-bold tracking-wider text-brand-700 uppercase">
          {item.category.name}
        </p>
        <h2 className="mt-2 text-xl font-bold">
          <Link href={`/led-accessories/${item.slug}`}>{item.name}</Link>
        </h2>
        {item.brand && (
          <p className="mt-2 text-sm text-slate-500">
            {item.brand}
            {item.modelNumber ? ` · ${item.modelNumber}` : ""}
          </p>
        )}
        <p className="mt-3 font-bold">
          <PriceDisplay product={item} />
        </p>
        <p className="mt-1 text-sm text-slate-500">{item.stockStatus}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/led-accessories/${item.slug}`}
            className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-bold text-white"
          >
            View details
          </Link>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-4 py-2.5 text-sm font-bold"
            >
              WhatsApp
            </a>
          )}
          {item.priceType === "fixed" && item.isPurchasableOnline && item.price !== null && item.stockStatus !== "out-of-stock" && <AddToCartButton item={{productId:item.id,productName:item.name,slug:item.slug,productType:item.productType,sku:item.sku,imageUrl:item.featuredImageUrl,quantity:item.minOrderQuantity||1,displayedUnitPrice:item.price,currency:item.currency,minOrderQuantity:item.minOrderQuantity,maxOrderQuantity:item.maxOrderQuantity}} />}
        </div>
      </div>
    </article>
  );
}
