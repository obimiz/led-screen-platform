export const videoAccessoryCategorySlugs = [
  "video-accessories",
  "video-processors",
  "video-switchers",
  "capture-cards",
  "live-video-accessories",
];

export function isVideoAccessory(item: {
  showcase?: string;
  category: { slug: string };
}) {
  return (
    item.showcase === "video" ||
    item.showcase === "camera" ||
    videoAccessoryCategorySlugs.includes(item.category.slug)
  );
}
