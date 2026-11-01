/**
 * Normalizes public asset paths so legacy lowercase `/images/...` references
 * resolve on case-sensitive Linux filesystems (such as Render) where the
 * committed directory is `public/Images/...`.
 */
export function normalizePublicImageUrl(url?: string | null): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return "";
  if (/^\/images\/led-screens\//i.test(trimmed)) {
    return `/Images/products/led-screens/${trimmed.slice("/images/led-screens/".length)}`;
  }
  if (/^\/images\//i.test(trimmed)) {
    return `/Images/${trimmed.slice("/images/".length)}`;
  }
  return trimmed;
}

/** Use the selected featured image, or the first additional image for older records. */
export function getProductDisplayImages(product: {
  featuredImageUrl?: string | null;
  imageUrls?: Array<string | null | undefined> | null;
}): string[] {
  return [
    ...new Set(
      [product.featuredImageUrl, ...(product.imageUrls || [])]
        .map((url) => normalizePublicImageUrl(url))
        .filter((url): url is string => Boolean(url)),
    ),
  ];
}

export function getPrimaryProductImage(product: {
  featuredImageUrl?: string | null;
  imageUrls?: Array<string | null | undefined> | null;
}): string {
  return getProductDisplayImages(product)[0] || "";
}

