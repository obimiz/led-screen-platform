import assert from "node:assert/strict";
import test from "node:test";
import {
  accessorySchema,
  bellAlarmSchema,
} from "../src/lib/validations/product";
import {
  bellPageSchema,
  defaultBellPage,
} from "../src/lib/validations/bell-page";
const base = {
  name: "Isolated accessory fixture",
  category: "507f1f77bcf86cd799439011",
  shortDescription: "An isolated test description",
  description: "A longer isolated product description for validation tests.",
  stockStatus: "in-stock",
  productType: "led-accessory",
  priceType: "fixed",
  price: 1000,
};
test("accessory pricing validates discounts, safe precision and quotation mode", () => {
  assert.equal(
    accessorySchema.parse({ ...base, promotionalPrice: 900 }).promotionalPrice,
    900,
  );
  for (const price of [-1, 1.001, Number.MAX_SAFE_INTEGER, Infinity])
    assert.equal(accessorySchema.safeParse({ ...base, price }).success, false);
  for (const promotionalPrice of [-1, 1000, 1100])
    assert.equal(
      accessorySchema.safeParse({ ...base, promotionalPrice }).success,
      false,
    );
  assert.equal(
    accessorySchema.safeParse({
      ...base,
      priceType: "quote",
      price: null,
      promotionalPrice: 100,
    }).success,
    false,
  );
  assert.equal(
    accessorySchema.parse({ ...base, priceType: "quote", price: null }).price,
    null,
  );
  assert.equal(
    accessorySchema.safeParse({ ...base, currency: "USD" }).success,
    false,
  );
});
test("persistent media paths and legacy external URLs remain accepted; unsafe URLs fail", () => {
  for (const featuredImageUrl of [
    "/api/product-images/507f1f77bcf86cd799439011",
    "/Images/old.jpg",
    "https://example.test/image.jpg",
  ]) {
    assert.equal(
      accessorySchema.safeParse({
        ...base,
        featuredImageUrl,
        imageUrls: [featuredImageUrl],
      }).success,
      true,
    );
    assert.equal(
      bellAlarmSchema.safeParse({
        ...base,
        productType: "bell-alarm-system",
        featuredImageUrl,
      }).success,
      true,
    );
  }
  for (const featuredImageUrl of [
    "javascript:alert(1)",
    "//evil.test/x",
    "/\\evil.test/x",
  ])
    assert.equal(
      accessorySchema.safeParse({ ...base, featuredImageUrl }).success,
      false,
    );
});
test("camera classification reuses accessories and defaults preserve legacy products", () => {
  assert.equal(accessorySchema.parse(base).showcase, "accessory");
  assert.equal(
    accessorySchema.parse({ ...base, showcase: "camera" }).showcase,
    "camera",
  );
  assert.equal(
    accessorySchema.parse({ ...base, slug: "processor-1" }).slug,
    "processor-1",
  );
  assert.equal(
    accessorySchema.safeParse({ ...base, slug: "../../bad" }).success,
    false,
  );
});
test("bell page rejects incomplete publishing payloads and unsafe rich content", () => {
  assert.ok(bellPageSchema.safeParse(defaultBellPage).success);
  assert.equal(
    bellPageSchema.safeParse({ ...defaultBellPage, heading: "" }).success,
    false,
  );
  assert.equal(
    bellPageSchema.safeParse({ ...defaultBellPage, introduction: "" }).success,
    false,
  );
  assert.equal(
    bellPageSchema.safeParse({
      ...defaultBellPage,
      heroImage: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    bellPageSchema.safeParse({
      ...defaultBellPage,
      content: { type: "doc", content: [{ type: "script", text: "alert(1)" }] },
    }).success,
    false,
  );
});

test("existing online order and cart pricing use only a valid configured discount", async () => {
  const { effectiveProductPrice } =
    await import("../src/lib/utils/product-price");
  assert.equal(
    effectiveProductPrice({
      price: 1000,
      priceType: "fixed",
      promotionalPrice: 900,
    }),
    900,
  );
  for (const promotionalPrice of [undefined, null, NaN, -1, 1000, 1200])
    assert.equal(
      effectiveProductPrice({
        price: 1000,
        priceType: "fixed",
        promotionalPrice,
      }),
      1000,
    );
  assert.equal(
    effectiveProductPrice({
      price: null,
      priceType: "quote",
      promotionalPrice: 900,
    }),
    null,
  );
});

test("homepage content comes directly from the featured product", async () => {
  const { homepageProductContent } =
    await import("../src/lib/utils/homepage-product");
  assert.deepEqual(
    homepageProductContent("bell", {
      name: "Featured bell",
      shortDescription: "Product summary",
      featuredImageUrl: "/bell.png",
      imageAlt: "Bell photograph",
      imageUrls: ["/other.png"],
    }),
    {
      heading: "Featured bell",
      description: "Product summary",
      imageUrl: "/bell.png",
      imageAlt: "Bell photograph",
    },
  );
});

test("homepage uses product gallery photos and matching alt text when no featured photo exists", async () => {
  const { homepageProductContent } =
    await import("../src/lib/utils/homepage-product");
  const result = homepageProductContent("camera", {
    name: "Camera",
    shortDescription: "Camera summary",
    imageUrls: ["", "/camera.png"],
    imageAlts: ["", "Side view"],
  });
  assert.equal(result.imageUrl, "/camera.png");
  assert.equal(result.imageAlt, "Side view");
  assert.equal(result.heading, "Camera");
});

test("homepage handles missing featured products and missing photographs safely", async () => {
  const { homepageProductContent } =
    await import("../src/lib/utils/homepage-product");
  const { homepageSectionDefaults, homepageSectionFallbacks } =
    await import("../src/lib/constants/homepage");
  const empty = homepageProductContent("camera");
  assert.equal(empty.heading, homepageSectionDefaults.cameraHeading);
  assert.equal(empty.description, homepageSectionFallbacks.camera);
  assert.equal(empty.imageUrl, "");
  const product = homepageProductContent("bell", {
    name: "Bell without a photo",
    shortDescription: "Saved product summary",
  });
  assert.equal(product.heading, "Bell without a photo");
  assert.equal(product.description, "Saved product summary");
  assert.equal(product.imageUrl, "");
});

test("accessory homepage copy retains the existing text as defaults", async () => {
  const { homepageAccessorySettingsSchema } =
    await import("../src/lib/validations/homepage-accessories");
  assert.deepEqual(homepageAccessorySettingsSchema.parse({}), {
    heading: "LED Screen Accessories",
    description:
      "Explore accessories and spare parts for your LED display system.",
  });
  assert.equal(
    homepageAccessorySettingsSchema.parse({
      heading: "  LED Parts  ",
      description: "  Available parts  ",
    }).heading,
    "LED Parts",
  );
});

test("accessory homepage settings reject blank, oversized and unrelated fields", async () => {
  const { homepageAccessorySettingsSchema } =
    await import("../src/lib/validations/homepage-accessories");
  for (const input of [
    { heading: " " },
    { description: "" },
    { heading: "x".repeat(161) },
    { description: "x".repeat(2001) },
    { bellHeading: "No override" },
  ])
    assert.equal(
      homepageAccessorySettingsSchema.safeParse(input).success,
      false,
    );
});

test("homepage hero uses the previous write-up as defaults and validates edits", async () => {
  const { homepageHeroSettingsSchema } =
    await import("../src/lib/validations/homepage-accessories");
  assert.deepEqual(homepageHeroSettingsSchema.parse({}), {
    headingTwo: "",
    heading: "Professional LED Display Solutions",
    description:
      "Sales, installation, rental and maintenance of LED display systems for churches, businesses, institutions and events.",
  });
  for (const input of [
    { heading: " " },
    { description: "" },
    { heading: "x".repeat(161) },
    { description: "x".repeat(2001) },
    { bellHeading: "Unrelated" },
  ])
    assert.equal(homepageHeroSettingsSchema.safeParse(input).success, false);
  assert.equal(
    homepageHeroSettingsSchema.parse({ heading: "  LED solutions  " }).heading,
    "LED solutions",
  );
});

test("hero headings are independent and reject legacy message fields", async () => {
  const { homepageHeroSettingsSchema } =
    await import("../src/lib/validations/homepage-accessories");
  const parsed = homepageHeroSettingsSchema.parse({
    heading: " Original heading ",
    headingTwo: " Second heading ",
  });
  assert.equal(parsed.heading, "Original heading");
  assert.equal(parsed.headingTwo, "Second heading");
  assert.equal(
    homepageHeroSettingsSchema.parse({ heading: "Original" }).headingTwo,
    "",
  );
  for (const input of [
    { headingTwo: "x".repeat(161) },
    { headingTwo: null },
    { messageOne: "Retired" },
    { messageTwo: "Retired" },
  ])
    assert.equal(homepageHeroSettingsSchema.safeParse(input).success, false);
});
