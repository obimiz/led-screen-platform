export const bellAlarmRequestStatuses = [
  "new",
  "contacted",
  "reviewing",
  "assessment-required",
  "assessment-scheduled",
  "assessed",
  "quoted",
  "accepted",
  "declined",
  "converted",
  "closed",
] as const;
export const bellAlarmRequestTypes = [
  "product-enquiry",
  "new-installation",
  "upgrade",
  "replacement",
  "inspection",
  "repair",
  "consultation",
  "other",
] as const;
export const bellAlarmApplications = [
  "church",
  "school",
  "office",
  "factory",
  "hotel",
  "hospital",
  "estate",
  "institution",
  "event-centre",
  "warehouse",
  "commercial-building",
  "other",
] as const;
export const bellAlarmModes = [
  "manual",
  "automatic",
  "scheduled",
  "remote",
  "hybrid",
] as const;
