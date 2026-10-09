export const customerTypes = [
  "individual",
  "business",
  "church",
  "school",
  "hotel",
  "event-organizer",
  "agency",
  "institution",
  "other",
] as const;
export const projectTypes = [
  "purchase",
  "installation",
  "replacement",
  "upgrade",
  "event-display",
  "consultation",
  "other",
] as const;
export const enquiryStatuses = [
  "new",
  "contacted",
  "reviewing",
  "quoted",
  "won",
  "lost",
  "closed",
] as const;
export const enquirySources = [
  "website",
  "product-page",
  "admin",
  "whatsapp",
  "referral",
  "other",
] as const;
export const quotationStatuses = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
  "cancelled",
] as const;
// All supported currencies have two decimal minor units. Extend deliberately.
export const salesCurrencies = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "GHS",
  "ZAR",
  "KES",
] as const;
export const defaultSalesCurrency = "NGN";
export const itemTypes = [
  "led-screen",
  "accessory",
  "service",
  "custom",
] as const;
