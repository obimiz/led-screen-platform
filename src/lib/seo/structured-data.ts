import type { PublicBusinessSettings } from "@/types/business-settings";
import { absoluteUrl, buildCanonicalUrl, getSiteUrl } from "./urls";
import { productPath, type SeoProduct, type SeoPortfolio } from "./metadata";
export type JsonLdData = { [key: string]: unknown };
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
export function buildOrganizationJsonLd(
  business: PublicBusinessSettings,
): JsonLdData {
  const logo = absoluteUrl("/branding/image-grant-technology-logo.jpeg");
  return {
    "@context": "https://schema.org",
    "@type": business.hasPhysicalAddress ? "LocalBusiness" : "Organization",
    "@id": `${getSiteUrl()}/#organization`,
    name: business.businessName,
    url: getSiteUrl(),
    ...(logo ? { logo } : {}),
    ...(business.primaryEmail ? { email: business.primaryEmail } : {}),
    ...(business.primaryPhone ? { telephone: business.primaryPhone } : {}),
    ...(business.hasPhysicalAddress ? { address: business.address } : {}),
    ...(business.socialLinks.length
      ? {
          sameAs: business.socialLinks
            .map((x) => absoluteUrl(x.url))
            .filter(Boolean),
        }
      : {}),
  };
}
export function buildWebsiteJsonLd(
  business: PublicBusinessSettings,
): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: business.businessName,
    url: getSiteUrl(),
    publisher: { "@id": `${getSiteUrl()}/#organization` },
  };
}
export type Breadcrumb = { name: string; path: string };
export function buildBreadcrumbJsonLd(items: Breadcrumb[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}
export function buildProductJsonLd(product: SeoProduct): JsonLdData | null {
  if (product.status !== "published") return null;
  const image = absoluteUrl(product.featuredImageUrl || "");
  const availability: Record<string, string> = {
    "in-stock": "InStock",
    "low-stock": "InStock",
    "out-of-stock": "OutOfStock",
    unavailable: "OutOfStock",
  };
  const hasPrice =
    product.priceType === "fixed" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    /^[A-Z]{3}$/.test(product.currency || "");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.name,
    url: buildCanonicalUrl(productPath(product)),
    ...(image ? { image } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand } }
      : {}),
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            url: buildCanonicalUrl(productPath(product)),
            price: product.price,
            priceCurrency: product.currency,
            ...(product.stockStatus && availability[product.stockStatus]
              ? {
                  availability: `https://schema.org/${availability[product.stockStatus]}`,
                }
              : {}),
          },
        }
      : {}),
  };
}
export function buildServiceJsonLd(
  name: string,
  description: string,
  path: string,
): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: buildCanonicalUrl(path),
    provider: { "@id": `${getSiteUrl()}/#organization` },
  };
}
export function buildPortfolioJsonLd(project: SeoPortfolio): JsonLdData {
  const image = absoluteUrl(project.coverImageUrl || "");
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.shortDescription,
    url: buildCanonicalUrl(`/projects/${encodeURIComponent(project.slug)}`),
    ...(image ? { image } : {}),
  };
}
