import { SalesError } from "@/lib/sales/calculations";
export function rentalWindowsOverlap(
  a: Date | string,
  b: Date | string,
  c: Date | string,
  d: Date | string,
) {
  return new Date(a) < new Date(d) && new Date(b) > new Date(c);
}
export function calculateRentalDuration(
  start: Date | string,
  end: Date | string,
) {
  const a = new Date(start),
    b = new Date(end);
  if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || b < a)
    throw new SalesError("Rental end must be on or after rental start.");
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000));
}
export function calculateRentalHours(start: Date | string, end: Date | string) {
  const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  if (!Number.isFinite(hours) || hours <= 0)
    throw new SalesError("Rental end must be after rental start.");
  return hours;
}
export function calculateBalance(total: number, paid: number) {
  if (paid < 0 || paid > total)
    throw new SalesError("Amount paid cannot exceed the booking total.");
  return total - paid;
}
