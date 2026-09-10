import type { LedProduct } from "@/types/product";

export function PriceDisplay({
  product,
}: {
  product: Pick<LedProduct, "price" | "priceType" | "currency">;
}) {
  if (product.priceType === "contact") return <span>Contact for Price</span>;
  if (product.priceType === "quote") return <span>Request Quote</span>;
  return (
    <span>
      {new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: product.currency,
        maximumFractionDigits: 0,
      }).format(product.price ?? 0)}
    </span>
  );
}
