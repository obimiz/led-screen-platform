export function createWhatsAppUrl(number: string, message?: string) {
  const normalizedNumber = number.replace(/\D/g, "");
  if (!normalizedNumber) return "";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalizedNumber}${query}`;
}

export function createPhoneUrl(number: string) {
  const normalized = number.trim().replace(/[^+\d]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

export function createEmailUrl(email: string) {
  const normalized = email.trim();
  return normalized ? `mailto:${normalized}` : "";
}
