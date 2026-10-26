import { effectiveProductPrice } from "@/lib/utils/product-price";
import Link from "next/link";
import { PriceDisplay } from "@/components/products/price-display";
import { AccessoryGallery } from "@/components/products/accessory-gallery";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import type { AccessoryProduct } from "@/types/product";
import { AddToCartButton } from "@/components/cart/cart-controls";
export function AccessoryCard({
  item,
}: {
  item: AccessoryProduct;
  whatsappNumber: string;
}) {
  const whatsapp = createWhatsAppUrl(
    "2348039308982",
    `Hello, I am interested in the ${item.name} listed on your website. Please provide more information.`,
  );
  return (
    <article className="group hover:border-brand-300 flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <AccessoryGallery
        compact
        name={item.name}
        featuredImageUrl={item.featuredImageUrl || ""}
        imageAlt={item.imageAlt || item.name}
        imageUrls={item.imageUrls}
        imageAlts={item.imageAlts}
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-brand-700 text-xs font-bold tracking-wider uppercase">
          {item.category.name}
        </p>
        <h2 className="mt-2 text-xl font-bold break-words">
          <Link href={`/led-accessories/${item.slug}`}>{item.name}</Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {item.shortDescription}
        </p>
        {item.brand && (
          <p className="mt-2 text-sm text-slate-500">
            {item.brand}
            {item.modelNumber ? ` · ${item.modelNumber}` : ""}
          </p>
        )}
        <div className="mt-auto pt-4" data-accessory-footer>
          <p className="flex min-h-12 items-end font-bold" data-accessory-price>
            <PriceDisplay product={item} />
          </p>
          <p
            className="mt-1 min-h-5 text-sm leading-5 text-slate-500"
            data-accessory-stock
          >
            {item.stockStatus}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2" data-accessory-actions>
            <Link
              href={`/led-accessories/${item.slug}`}
              className="bg-primary hover:bg-primary-hover flex min-h-11 items-center justify-center rounded-lg px-3 py-2.5 text-center text-sm font-bold text-white"
            >
              View details
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center rounded-lg border px-3 py-2.5 text-center text-sm font-bold"
              >
                WhatsApp
              </a>
            )}
          </div>
          <div className="mt-2 min-h-11">
            {item.priceType === "fixed" &&
              item.isPurchasableOnline &&
              item.price !== null &&
              item.stockStatus !== "out-of-stock" && (
                <AddToCartButton
                  item={{
                    productId: item.id,
                    productName: item.name,
                    slug: item.slug,
                    productType: item.productType,
                    sku: item.sku,
                    imageUrl: item.featuredImageUrl,
                    quantity: item.minOrderQuantity || 1,
                    displayedUnitPrice:
                      effectiveProductPrice(item) ?? item.price,
                    currency: item.currency,
                    minOrderQuantity: item.minOrderQuantity,
                    maxOrderQuantity: item.maxOrderQuantity,
                  }}
                />
              )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Compact homepage teaser; the full catalogue card keeps its existing actions. */
export function AccessoryShowcaseCard({ item }: { item: AccessoryProduct }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <AccessoryGallery
        compact
        name={item.name}
        featuredImageUrl={item.featuredImageUrl || ""}
        imageAlt={item.imageAlt || item.name}
        imageUrls={item.imageUrls}
        imageAlts={item.imageAlts}
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold break-words">
          <Link href={`/led-accessories/${item.slug}`}>{item.name}</Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {item.shortDescription}
        </p>
        <p className="mt-auto pt-4 font-bold">
          <PriceDisplay product={item} />
        </p>
        <Link
          href="/accessories"
          className="mt-5 block rounded-lg bg-[#DD2421] px-4 py-3 text-center text-sm font-bold text-white"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}
