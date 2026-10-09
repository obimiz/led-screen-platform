import assert from "node:assert/strict";
import test from "node:test";
import { formatProductPrice } from "../src/lib/utils/product-price";
import { organisationSchema } from "../src/lib/validations/organisation";
import { productSchema } from "../src/lib/validations/product";
test("price types format without inventing missing prices", () => {
  const base = { price: 850000, currency: "NGN" };
  assert.equal(
    formatProductPrice({ ...base, priceType: "fixed" }),
    "₦850,000.00",
  );
  assert.equal(
    formatProductPrice({ ...base, priceType: "from" }),
    "From ₦850,000.00",
  );
  assert.equal(
    formatProductPrice({ ...base, priceType: "per_sqm" }),
    "₦850,000.00 / m²",
  );
  assert.equal(
    formatProductPrice({ ...base, priceType: "contact" }),
    "Request Price",
  );
  assert.equal(
    formatProductPrice({ ...base, priceType: "quote" }),
    "Request Quote",
  );
  assert.equal(
    formatProductPrice({ priceType: "fixed", price: null }),
    "Request Price",
  );
  assert.equal(formatProductPrice({ priceType: "fixed", price: 0 }), "₦0.00");
  assert.equal(
    formatProductPrice({ ...base, currency: "invalid", priceType: "fixed" }),
    "Request Price",
  );
});
test("organisations accept optional logos and reject unsafe URLs and project associations", () => {
  assert.equal(
    organisationSchema.parse({ name: "Madonna University" }).logoUrl,
    "",
  );
  assert.ok(
    organisationSchema.safeParse({
      name: "Madonna University",
      logoUrl: "/images/clients/logo.png",
    }).success,
  );
  for (const logoUrl of [
    "javascript:alert(1)",
    "//evil.test/image",
    "/\\evil.test/image",
  ])
    assert.equal(
      organisationSchema.safeParse({ name: "Test", logoUrl }).success,
      false,
    );
  assert.equal(
    organisationSchema.safeParse({
      name: "Test",
      website: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    organisationSchema.safeParse({ name: "Test", portfolioProjectId: "123" })
      .success,
    false,
  );
});
test("numeric pricing modes require a price, legacy modes remain accepted", () => {
  const base = {
    name: "LED display",
    category: "507f1f77bcf86cd799439011",
    shortDescription: "Supplied description",
    description: "Supplied longer product description",
    indoorOutdoor: "indoor",
    stockStatus: "in-stock",
  };
  for (const priceType of ["fixed", "from", "per_sqm"]) {
    assert.equal(
      productSchema.safeParse({ ...base, priceType, price: null }).success,
      false,
    );
    assert.equal(
      productSchema.safeParse({ ...base, priceType, price: 850000 }).success,
      true,
    );
  }
  for (const priceType of ["contact", "quote"])
    assert.equal(productSchema.safeParse({ ...base, priceType }).success, true);
});
