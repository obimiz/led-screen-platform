export function normalizePhoneNumber(number: string, country = "") {
  const trimmed = number.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+") || trimmed.startsWith("00"))
    return trimmed.replace(/\D/g, "").replace(/^00/, "");
  const digits = trimmed.replace(/\D/g, "");
  if (
    country.toLowerCase().includes("nigeria") &&
    digits.startsWith("0") &&
    digits.length === 11
  )
    return `234${digits.slice(1)}`;
  return digits;
}
export function createWhatsAppUrl(
  numberOrInput: string | { phone: string; message?: string },
  message?: string,
) {
  const number =
    typeof numberOrInput === "string" ? numberOrInput : numberOrInput.phone;
  const text =
    typeof numberOrInput === "string" ? message : numberOrInput.message;
  const normalizedNumber = normalizePhoneNumber(number);
  if (!normalizedNumber) return "";
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${normalizedNumber}${query}`;
}

export const createGeneralWhatsAppMessage = () =>
  "Hello, I would like to know more about your services.";
export const createProductWhatsAppMessage = (name: string) =>
  `Hello, I am interested in ${name}.`;
export const createQuoteWhatsAppMessage = (reference: string) =>
  `Hello, I would like to follow up on quotation ${reference}.`;
export const createRentalWhatsAppMessage = (reference?: string) =>
  `Hello, I would like to discuss LED screen rental${reference ? ` (${reference})` : ""}.`;
export const createInstallationWhatsAppMessage = (reference?: string) =>
  `Hello, I would like to discuss an LED screen installation${reference ? ` (${reference})` : ""}.`;
export const createMaintenanceWhatsAppMessage = (reference?: string) =>
  `Hello, I need support for an LED screen maintenance/repair request${reference ? ` (${reference})` : ""}.`;
export const createOrderWhatsAppMessage = (number: string) =>
  `Hello, I would like to ask about order ${number}.`;
export const createPaymentWhatsAppMessage = (number: string) =>
  `Hello, I need help with payment for order ${number}.`;
export const createBellAlarmWhatsAppMessage = () =>
  "Hello, I would like information about an electronic bell/alarm solution.";

export function createPhoneUrl(number: string) {
  const normalized = number.trim().replace(/[^+\d]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

export function createEmailUrl(email: string) {
  const normalized = email.trim();
  return normalized ? `mailto:${normalized}` : "";
}
