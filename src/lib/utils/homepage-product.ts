import {
  homepageSectionDefaults,
  homepageSectionFallbacks,
} from "@/lib/constants/homepage";

type HomepageProduct = {
  name?: string;
  shortDescription?: string;
  featuredImageUrl?: string;
  imageUrls?: string[];
  imageAlt?: string;
  imageAlts?: string[];
};

export function homepageProductContent(
  kind: "bell" | "camera",
  product?: HomepageProduct,
) {
  const heading =
    product?.name ||
    homepageSectionDefaults[kind === "bell" ? "bellHeading" : "cameraHeading"];
  const imageUrl =
    product?.featuredImageUrl || product?.imageUrls?.find(Boolean) || "";
  const imageAlt =
    (product?.featuredImageUrl
      ? product.imageAlt
      : product?.imageAlts?.[product?.imageUrls?.indexOf(imageUrl) ?? -1]) ||
    heading;
  return {
    heading,
    description: product?.shortDescription || homepageSectionFallbacks[kind],
    imageUrl,
    imageAlt,
  };
}
