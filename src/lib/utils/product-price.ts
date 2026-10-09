export function formatProductPrice(product: {
  priceType: string;
  price?: number | null;
  currency?: string;
}) {
  if (product.priceType === "quote") return "Request Quote";
  if (
    product.priceType === "contact" ||
    product.price == null ||
    !Number.isFinite(product.price) ||
    product.price < 0
  )
    return "Request Price";
  if (!["fixed", "from", "per_sqm"].includes(product.priceType))
    return "Request Price";
  let amount: string;
  try {
    amount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: product.currency || "NGN",
      maximumFractionDigits: 2,
    }).format(product.price);
  } catch {
    return "Request Price";
  }
  return product.priceType === "from"
    ? `From ${amount}`
    : product.priceType === "per_sqm"
      ? `${amount} / m²`
      : amount;
}
