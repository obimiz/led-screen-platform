import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanonicalUrl,
  absoluteUrl,
  getSiteUrl,
  isSearchIndexingAllowed,
} from "../src/lib/seo/urls";
import {
  buildPageMetadata,
  buildProductMetadata,
  listingSeo,
} from "../src/lib/seo/metadata";
import {
  buildProductJsonLd,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "../src/lib/seo/structured-data";
import { redactPortfolio } from "../src/lib/seo/privacy";
import type { PublicBusinessSettings } from "../src/types/business-settings";
const business: PublicBusinessSettings = {
  businessName: "Configured Business",
  shortName: "",
  tagline: "",
  description: "Display services",
  logoUrl: "/logo.png",
  faviconUrl: "",
  primaryEmail: "",
  secondaryEmail: "",
  primaryPhone: "",
  secondaryPhone: "",
  whatsappNumber: "",
  address: "",
  businessHours: "",
  googleMapsUrl: "",
  socialLinks: [],
};
test("SEO URL, metadata, publication, offers, privacy and environment contracts", () => {
  const priorUrl = process.env.NEXT_PUBLIC_APP_URL,
    priorFlag = process.env.ALLOW_SEARCH_INDEXING;
  process.env.NEXT_PUBLIC_APP_URL = "https://example.test/";
  process.env.ALLOW_SEARCH_INDEXING = "true";
  try {
    assert.equal(getSiteUrl(), "https://example.test");
    assert.equal(
      buildCanonicalUrl("/led-screens//sample/?search=x#top"),
      "https://example.test/led-screens/sample",
    );
    assert.equal(
      buildCanonicalUrl("/led-screens", 2),
      "https://example.test/led-screens?page=2",
    );
    assert.equal(absoluteUrl("/cover.png"), "https://example.test/cover.png");
    assert.equal(absoluteUrl("javascript:alert(1)"), undefined);
    assert.deepEqual(listingSeo({ search: "screen", page: "2" }), {
      index: false,
      page: undefined,
    });
    assert.deepEqual(listingSeo({ page: "2" }), { index: false, page: 2 });
    assert.equal(listingSeo({ category: "indoor" }).index, false);
    assert.equal(listingSeo({ utm_source: "social" }).index, true);
    const product = {
      name: "Display",
      slug: "display",
      productType: "led-screen",
      status: "published",
      priceType: "fixed",
      price: 1200,
      currency: "NGN",
      stockStatus: "in-stock",
    };
    assert.equal(
      (buildProductJsonLd(product)?.offers as { price: number }).price,
      1200,
    );
    for (const priceType of ["quote", "contact"])
      assert.equal(
        buildProductJsonLd({ ...product, priceType })?.offers,
        undefined,
      );
    assert.equal(
      buildProductJsonLd({ ...product, price: NaN })?.offers,
      undefined,
    );
    assert.equal(buildProductJsonLd({ ...product, status: "draft" }), null);
    assert.equal(
      (
        buildProductMetadata({ ...product, status: "archived" }, business)
          .robots as { index: boolean }
      ).index,
      false,
    );
    assert.equal(buildProductJsonLd(product)?.aggregateRating, undefined);
    const org = buildOrganizationJsonLd(business);
    assert.equal(org.name, business.businessName);
    assert.equal(org.address, undefined);
    assert.equal(org["@type"], "Organization");
    assert.equal(
      buildOrganizationJsonLd({
        ...business,
        hasPhysicalAddress: true,
        address: "1 Actual Road, City",
      })["@type"],
      "LocalBusiness",
    );
    const breadcrumbs = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Display", path: "/led-screens/display" },
    ]);
    assert.equal(
      (breadcrumbs.itemListElement as { position: number }[])[1].position,
      2,
    );
    const hostile = "</script><script>alert(1)</script>";
    const serialized = serializeJsonLd({ name: hostile });
    assert.ok(!serialized.includes("<"));
    assert.equal(JSON.parse(serialized).name, hostile);
    const redacted = redactPortfolio({
      customerName: "Private Person",
      hideCustomerName: true,
      title: "Private Person screen",
      seoDescription: "For Private Person",
      installationProjectId: "private-id",
    });
    assert.ok(!JSON.stringify(redacted).includes("Private Person"));
    assert.ok(!JSON.stringify(redacted).includes("private-id"));
    process.env.ALLOW_SEARCH_INDEXING = "false";
    assert.equal(isSearchIndexingAllowed(), false);
    assert.equal(
      (
        buildPageMetadata(
          { title: "About", description: "About us", path: "/about" },
          business,
        ).robots as { index: boolean }
      ).index,
      false,
    );
  } finally {
    if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = priorUrl;
    if (priorFlag === undefined) delete process.env.ALLOW_SEARCH_INDEXING;
    else process.env.ALLOW_SEARCH_INDEXING = priorFlag;
  }
});
