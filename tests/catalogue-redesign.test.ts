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

test("homepage photographs preserve empty defaults and reject unsafe image values", async () => {
  const { homepageImagesSchema } =
    await import("../src/lib/validations/homepage-images");
  assert.deepEqual(homepageImagesSchema.parse({}), {
    bellImageUrl: "",
    bellImageAlt: "",
    cameraImageUrl: "",
    cameraImageAlt: "",
  });
  assert.equal(
    homepageImagesSchema.safeParse({
      bellImageUrl: "/api/product-images/507f1f77bcf86cd799439011",
      cameraImageUrl: "/Images/camera.png",
    }).success,
    true,
  );
  for (const cameraImageUrl of [
    "javascript:alert(1)",
    "//example.test/image",
    "/../secret",
  ])
    assert.equal(
      homepageImagesSchema.safeParse({ cameraImageUrl }).success,
      false,
    );
});
