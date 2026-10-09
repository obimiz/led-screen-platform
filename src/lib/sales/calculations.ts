import type { QuotationInput } from "@/lib/validations/sales";
import type { quotationStatuses } from "./constants";
export type QuotationStatus = (typeof quotationStatuses)[number];
export class SalesError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const MAX = 1_000_000_000_000;
function safe(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX)
    throw new SalesError("The quotation amount exceeds the supported limit.");
  return value;
}
function multiply(value: number, numerator: number, denominator: number) {
  return safe(
    Number(
      (BigInt(value) * BigInt(numerator) + BigInt(denominator / 2)) /
        BigInt(denominator),
    ),
  );
}
export function majorToMinor(value: number) {
  if (!Number.isFinite(value) || value < 0)
    throw new SalesError("Invalid price");
  // Convert the decimal representation, not its binary floating-point product.
  const [coefficient, exponent = "0"] = String(value).toLowerCase().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = BigInt(whole + fraction);
  const shift = Number(exponent) - fraction.length + 2;
  if (shift >= 0) return safe(Number(digits * BigInt(10) ** BigInt(shift)));
  const divisor = BigInt(10) ** BigInt(-shift);
  return safe(Number((digits + divisor / BigInt(2)) / divisor));
}
export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
    value === 0 ? 0 : value / 100,
  );
}
export function calculateQuotationTotals(input: QuotationInput) {
  const items = input.items.map((item) => {
    const gross = multiply(
      safe(item.unitPrice),
      Math.round(item.quantity * 1000),
      1000,
    );
    if (item.discount > gross)
      throw new SalesError("A line discount cannot exceed its line amount.");
    return { ...item, lineTotal: safe(gross - item.discount) };
  });
  const subtotal = safe(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const discountAmount =
    input.discountType === "percentage"
      ? multiply(subtotal, Math.round(input.discountValue * 100), 10000)
      : input.discountType === "fixed"
        ? safe(input.discountValue)
        : 0;
  if (discountAmount > subtotal)
    throw new SalesError("Discount cannot exceed the subtotal.");
  const taxAmount = multiply(
    subtotal - discountAmount,
    Math.round(input.taxRate * 100),
    10000,
  );
  const total = safe(
    subtotal -
      discountAmount +
      taxAmount +
      input.deliveryFee +
      input.installationFee +
      input.otherCharges,
  );
  return { items, subtotal, discountAmount, taxAmount, total };
}
export function effectiveQuotationStatus(
  status: QuotationStatus,
  validUntil: string | Date,
  now = new Date(),
): QuotationStatus {
  return (status === "sent" || status === "viewed") &&
    new Date(validUntil) < now
    ? "expired"
    : status;
}
export const statusTransitions: Record<
  QuotationStatus,
  readonly QuotationStatus[]
> = {
  draft: ["sent", "cancelled"],
  sent: ["viewed", "accepted", "rejected", "expired", "draft", "cancelled"],
  viewed: ["accepted", "rejected", "expired", "draft", "cancelled"],
  accepted: ["converted", "draft", "cancelled"],
  rejected: ["draft", "cancelled"],
  expired: ["draft", "cancelled"],
  converted: [],
  cancelled: ["draft"],
};
export function assertStatusTransition(
  from: QuotationStatus,
  to: QuotationStatus,
) {
  if (!statusTransitions[from].includes(to))
    throw new SalesError(
      `Cannot change ${from} to ${to}. Reopen as draft where available.`,
    );
}
