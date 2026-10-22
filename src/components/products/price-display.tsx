import { formatProductPrice } from "@/lib/utils/product-price";
export function PriceDisplay({
  product,
}: {
  product: {
    price: number | null;
    priceType: string;
    currency: string;
    promotionalPrice?: number | null;
  };
}) {
  const sale =
    product.priceType === "fixed" &&
    product.price != null &&
    product.promotionalPrice != null &&
    product.promotionalPrice >= 0 &&
    product.promotionalPrice < product.price;
  return (
    <span>
      {sale ? (
        <>
          <del className="mr-2 text-sm font-normal text-slate-500">
            {formatProductPrice(product)}
          </del>
          {formatProductPrice({ ...product, price: product.promotionalPrice })}
        </>
      ) : (
        formatProductPrice(product)
      )}
    </span>
  );
}
