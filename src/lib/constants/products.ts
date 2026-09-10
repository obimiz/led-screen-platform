export const productTypes = ["led-screen", "led-accessory"] as const;
export type ProductType = (typeof productTypes)[number];
export const indoorOutdoorOptions = [
  "indoor",
  "outdoor",
  "semi-outdoor",
] as const;
export const priceTypes = ["fixed", "contact", "quote"] as const;
export const stockStatuses = [
  "in-stock",
  "low-stock",
  "out-of-stock",
  "made-to-order",
  "unavailable",
] as const;
export const productStatuses = ["draft", "published", "archived"] as const;
export const maintenanceTypes = [
  "front",
  "rear",
  "front-and-rear",
  "not-specified",
] as const;
export const defaultCurrency = "NGN";

export const commonLedApplications = [
  "Churches",
  "Conferences",
  "Events",
  "Hotels",
  "Schools",
  "Shopping Centres",
  "Outdoor Advertising",
  "Auditoriums",
  "Corporate Offices",
  "Broadcast Studios",
  "Entertainment Venues",
] as const;
