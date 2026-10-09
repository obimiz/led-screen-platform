/** Public portfolio text must not reintroduce a hidden name through SEO overrides. */
export function redactPortfolio<T extends Record<string, unknown>>(
  record: T,
): T {
  const result: Record<string, unknown> = { ...record };
  const name =
    typeof record.customerName === "string" ? record.customerName.trim() : "";
  if (record.hideCustomerName && name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "gi");
    for (const key of [
      "title",
      "seoTitle",
      "seoDescription",
      "shortDescription",
      "description",
      "venueName",
      "challenge",
      "solution",
      "outcome",
      "customerDisplayName",
    ]) {
      if (typeof result[key] === "string")
        result[key] = result[key].replace(pattern, "Private client");
    }
  }
  for (const key of [
    "customerName",
    "installationProjectId",
    "rentalBookingId",
    "bellAlarmProjectId",
    "maintenanceJobId",
  ])
    delete result[key];
  return result as T;
}
