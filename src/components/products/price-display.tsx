import type { LedProduct } from "@/types/product";
import { formatProductPrice } from "@/lib/utils/product-price";
export function PriceDisplay({
  product,
}: {
  product: Pick<LedProduct, "price" | "priceType" | "currency">;
}) {
  return <span>{formatProductPrice(product)}</span>;
}
