export const rentalStatuses = [
  "new",
  "contacted",
  "reviewing",
  "availability-check",
  "quoted",
  "accepted",
  "declined",
  "converted",
  "closed",
] as const;
export const rentalEventTypes = [
  "wedding",
  "conference",
  "church-event",
  "concert",
  "corporate-event",
  "exhibition",
  "political-event",
  "school-event",
  "outdoor-event",
  "birthday",
  "funeral",
  "sports-event",
  "other",
] as const;
export const bookingStatuses = [
  "draft",
  "pending-confirmation",
  "confirmed",
  "cancelled",
  "completed",
] as const;
export const operationalStatuses = [
  "preparing",
  "dispatched",
  "setup-in-progress",
  "ready",
  "event-active",
  "dismantling",
  "returned",
  "inspected",
  "closed",
] as const;
export const depositStatuses = [
  "not-required",
  "pending",
  "partially-paid",
  "paid",
] as const;
