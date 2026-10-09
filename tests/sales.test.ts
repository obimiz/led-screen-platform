import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createQuoteRequestSchema,
  createQuotationSchema,
  salesQuerySchema,
} from "../src/lib/validations/sales";
import {
  calculateQuotationTotals,
  effectiveQuotationStatus,
  assertStatusTransition,
  majorToMinor,
} from "../src/lib/sales/calculations";
const quotation = (extra = {}) =>
  createQuotationSchema.parse({
    customer: { name: "Test customer", email: "test@example.com" },
    items: [
      {
        itemType: "service",
        name: "Installation",
        quantity: 2,
        unit: "job",
        unitPrice: 10000,
      },
    ],
    ...extra,
  });
test("general enquiry requires name and a usable contact", () => {
  assert.equal(
    createQuoteRequestSchema.safeParse({
      customerName: "Test",
      customerEmail: "test@example.com",
      preferredContactMethod: "email",
    }).success,
    true,
  );
  assert.equal(
    createQuoteRequestSchema.safeParse({ customerName: "Test" }).success,
    false,
  );
});
test("optional technical fields stay optional and defaults are useful", () => {
  const v = createQuoteRequestSchema.parse({
    customerName: "Test",
    customerPhone: "+2348012345678",
  });
  assert.equal(v.quantity, 1);
  assert.equal(v.requiredWidth, undefined);
  assert.equal(v.budget, undefined);
});
test("invalid contact, dimensions, quantity, budget and dates rejected", () => {
  const base = { customerName: "Test", customerPhone: "+2348012345678" };
  for (const change of [
    { customerEmail: "bad" },
    { customerPhone: "garbage" },
    { requiredWidth: 0 },
    { requiredHeight: -2 },
    { quantity: 0 },
    { budget: -1 },
    { eventDate: "2026-02-30" },
    { message: "a".repeat(5001) },
    { preferredContactMethod: "email" },
  ])
    assert.equal(
      createQuoteRequestSchema.safeParse({ ...base, ...change }).success,
      false,
      JSON.stringify(change),
    );
});
test("customer input is trimmed, email normalized, admin fields stripped", () => {
  const v = createQuoteRequestSchema.parse({
    customerName: "  Customer  ",
    customerEmail: "HELLO@example.com",
    preferredContactMethod: "email",
    status: "won",
    adminNotes: "injected",
    productId: "000000000000000000000000",
    source: "admin",
  });
  assert.equal(v.customerName, "Customer");
  assert.equal(v.customerEmail, "hello@example.com");
  assert.equal("status" in v, false);
  assert.equal("adminNotes" in v, false);
  assert.equal("source" in v, false);
});
test("minor-unit conversion rounds decimal catalogue prices safely", () => {
  assert.equal(majorToMinor(1.005), 101);
  assert.equal(majorToMinor(10.075), 1008);
  assert.equal(majorToMinor(1_500_000), 150000000);
  assert.equal(majorToMinor(0.0000001), 0);
  assert.throws(() => majorToMinor(-1));
});
test("line totals and subtotal", () => {
  const v = calculateQuotationTotals(quotation());
  assert.equal(v.items[0].lineTotal, 20000);
  assert.equal(v.subtotal, 20000);
  assert.equal(v.total, 20000);
});
test("percentage discount and tax applied before fees", () => {
  const v = calculateQuotationTotals(
    quotation({
      discountType: "percentage",
      discountValue: 10,
      taxRate: 7.5,
      deliveryFee: 1000,
      installationFee: 2000,
      otherCharges: 300,
    }),
  );
  assert.equal(v.discountAmount, 2000);
  assert.equal(v.taxAmount, 1350);
  assert.equal(v.total, 22650);
});
test("fixed discount", () => {
  assert.equal(
    calculateQuotationTotals(
      quotation({ discountType: "fixed", discountValue: 500 }),
    ).total,
    19500,
  );
});
test("line discount and fractional quantity round half up", () => {
  const v = calculateQuotationTotals(
    quotation({
      items: [
        {
          itemType: "custom",
          name: "Display",
          quantity: 1.005,
          unit: "m²",
          unitPrice: 100,
          discount: 1,
        },
      ],
    }),
  );
  assert.equal(v.items[0].lineTotal, 100);
});
test("negative totals and unsafe amounts rejected", () => {
  assert.throws(() =>
    calculateQuotationTotals(
      quotation({ discountType: "fixed", discountValue: 20001 }),
    ),
  );
  assert.throws(() =>
    calculateQuotationTotals(
      quotation({
        items: [
          {
            itemType: "service",
            name: "Job",
            unit: "job",
            quantity: 1,
            unitPrice: 1,
            discount: 2,
          },
        ],
      }),
    ),
  );
  assert.throws(() =>
    calculateQuotationTotals(
      quotation({
        items: [
          {
            itemType: "service",
            name: "Job",
            unit: "job",
            quantity: 100000,
            unitPrice: 1000000000000,
          },
        ],
      }),
    ),
  );
});
test("client supplied totals never survive validation", () => {
  const input = quotation({
    total: 1,
    subtotal: 1,
    taxAmount: 99,
    items: [
      {
        itemType: "service",
        name: "Job",
        unit: "job",
        quantity: 2,
        unitPrice: 10000,
        lineTotal: 1,
      },
    ],
  });
  assert.equal("total" in input, false);
  assert.equal("lineTotal" in input.items[0], false);
  assert.equal(calculateQuotationTotals(input).total, 20000);
});
test("invalid discounts, rates, prices and product references rejected", () => {
  for (const extra of [
    { discountType: "percentage", discountValue: 101 },
    { taxRate: -1 },
    { currency: "JPY" },
    { deliveryFee: 1.1 },
    { items: [] },
    {
      items: [
        {
          itemType: "led-screen",
          name: "Screen",
          quantity: 1,
          unit: "unit",
          unitPrice: 100,
        },
      ],
    },
  ])
    assert.throws(() => quotation(extra));
});
test("effective expiration leaves draft and accepted intact", () => {
  for (const s of ["sent", "viewed"] as const)
    assert.equal(effectiveQuotationStatus(s, "2020-01-01"), "expired");
  assert.equal(effectiveQuotationStatus("accepted", "2020-01-01"), "accepted");
  assert.equal(effectiveQuotationStatus("draft", "2020-01-01"), "draft");
});
test("status transitions include normal workflow and draft recovery", () => {
  for (const [a, b] of [
    ["draft", "sent"],
    ["sent", "accepted"],
    ["sent", "rejected"],
    ["accepted", "converted"],
    ["expired", "draft"],
    ["rejected", "draft"],
  ] as const)
    assert.doesNotThrow(() => assertStatusTransition(a, b));
  assert.throws(() => assertStatusTransition("draft", "converted"));
  assert.throws(() => assertStatusTransition("converted", "draft"));
});
test("list query rejects invalid date ranges and injection objects", () => {
  assert.equal(
    salesQuerySchema.safeParse({ from: "2026-02-02", to: "2026-01-01" })
      .success,
    false,
  );
  assert.equal(
    salesQuerySchema.safeParse({ search: { $gt: "" } }).success,
    false,
  );
});
