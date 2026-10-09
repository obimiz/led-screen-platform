import assert from "node:assert/strict";
import test from "node:test";
import {
  productSchema,
  accessorySchema,
  bellAlarmSchema,
} from "../src/lib/validations/product";
import { formatProductPrice } from "../src/lib/utils/product-price";
const base = {
  name: "Indoor LED Display",
  category: "507f1f77bcf86cd799439011",
  shortDescription: "Indoor LED display for churches and commercial spaces.",
  description:
    "LED display solution for indoor installations and presentations.",
  indoorOutdoor: "indoor",
  priceType: "contact",
  stockStatus: "made-to-order",
};

test("LED admin accepts local and HTTPS images, including galleries, without permitting unsafe URLs", () => {
  const parsed = productSchema.parse({
    ...base,
    featuredImageUrl: "/images/products/led-screens/indoor-led-screen.png",
    imageUrls: [
      "/images/products/led-screens/outdoor-led-screen.png",
      "https://example.test/display.png",
    ],
    imageFit: "contain",
  });
  assert.equal(parsed.imageFit, "contain");
  assert.equal(parsed.imageUrls.length, 2);
  for (const featuredImageUrl of [
    "javascript:alert(1)",
    "//evil.test/a.png",
    "/\\evil.test/a.png",
    "data:image/png;base64,test",
  ])
    assert.equal(
      productSchema.safeParse({ ...base, featuredImageUrl }).success,
      false,
    );
  assert.equal(
    productSchema.safeParse({ ...base, imageUrls: [""] }).success,
    false,
  );
});

test("Legacy LED records retain cover behavior and real prices; unsupplied fields stay empty", () => {
  const product = productSchema.parse({
    ...base,
    priceType: "fixed",
    price: 850000,
  });
  assert.equal(product.imageFit, "cover");
  assert.equal(product.price, 850000);
  assert.equal(formatProductPrice(product), "₦850,000.00");
  const requested = productSchema.parse({
    ...base,
    indoorOutdoor: "not-specified",
  });
  assert.equal(requested.price, null);
  assert.equal(formatProductPrice(requested), "Request Price");
  for (const field of [
    "brightness",
    "refreshRate",
    "pixelPitch",
    "cabinetSize",
    "powerConsumption",
  ] as const)
    assert.equal(requested[field], "");
  assert.equal(
    productSchema.safeParse({ ...base, priceType: "fixed" }).success,
    false,
  );
});

test("LED media options do not change Bell & Alarm or accessory validation", () => {
  const { indoorOutdoor: _environment, ...shared } = base;
  void _environment;
  for (const [schema, productType] of [
    [accessorySchema, "led-accessory"],
    [bellAlarmSchema, "bell-alarm-system"],
  ] as const) {
    assert.ok(
      schema.safeParse({
        ...shared,
        productType,
        featuredImageUrl: "https://example.test/image.png",
      }).success,
    );
    assert.equal(
      schema.safeParse({ ...shared, productType, imageFit: "contain" }).success,
      false,
    );
  }
});
