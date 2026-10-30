import test from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema } from "../src/lib/validations/orders";
const base = {
  customerName: "Ada Customer",
  customerEmail: "ada@example.com",
  customerPhone: "08012345678",
  whatsappNumber: "",
  fulfilmentMethod: "delivery",
  deliveryAddress: "12 Main Street",
  city: "Lagos",
  state: "Lagos",
  country: "Nigeria",
  deliveryNotes: "",
  customerNote: "",
  items: [{ productId: "507f1f77bcf86cd799439011", quantity: 1 }],
  idempotencyKey: "1234567890123456",
};
test("checkout requires delivery address for delivery", () => {
  assert.throws(() => checkoutSchema.parse({ ...base, deliveryAddress: "" }));
});
test("pickup does not require delivery address", () => {
  const value = checkoutSchema.parse({
    ...base,
    fulfilmentMethod: "pickup",
    deliveryAddress: "",
  });
  assert.equal(value.fulfilmentMethod, "pickup");
});
test("empty carts are rejected", () => {
  assert.throws(() => checkoutSchema.parse({ ...base, items: [] }));
});
