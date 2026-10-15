/** Use the selected featured image, or the first additional image for older records. */
export function getProductDisplayImages(product: {
  featuredImageUrl?: string;
  imageUrls?: string[];
}): string[] {
  return [
    ...new Set(
      [product.featuredImageUrl, ...(product.imageUrls || [])].filter(
        (url): url is string => Boolean(url),
      ),
    ),
  ];
}
