import Link from "next/link";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductImage } from "@/components/products/product-media";
import { createWhatsAppUrl } from "@/lib/utils/contact";
import type { AccessoryProduct } from "@/types/product";
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
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <ProductImage url={item.featuredImageUrl} name={item.name} />
      <div className="p-5">
        <p className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
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
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
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
        </div>
      </div>
    </article>
  );
}
