import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRentalRequestSchema,
  createRentalBookingSchema,
} from "../src/lib/validations/rentals";
import {
  calculateRentalDuration,
  calculateRentalHours,
  rentalWindowsOverlap,
  calculateBalance,
} from "../src/lib/rentals/calculations";
const base = {
  customerName: "Rental Customer",
  customerPhone: "+2348012345678",
  eventType: "wedding",
  eventStartDate: "2026-10-10",
  eventEndDate: "2026-10-12",
  preferredContactMethod: "phone",
};
test("rental request validates event ordering and optional technical fields", () => {
  assert.equal(createRentalRequestSchema.safeParse(base).success, true);
  assert.equal(
    createRentalRequestSchema.safeParse({ ...base, eventEndDate: "2026-10-09" })
      .success,
    false,
  );
  assert.equal(
    createRentalRequestSchema.safeParse({ ...base, setupDate: "2026-10-11" })
      .success,
    false,
  );
  assert.equal(
    createRentalRequestSchema.safeParse({ ...base, teardownDate: "2026-10-11" })
      .success,
    false,
  );
});
test("other events require a useful description", () => {
  assert.equal(
    createRentalRequestSchema.safeParse({ ...base, eventType: "other" })
      .success,
    false,
  );
  assert.equal(
    createRentalRequestSchema.safeParse({
      ...base,
      eventType: "other",
      eventTypeOther: "Community festival",
    }).success,
    true,
  );
});
test("rental durations handle same-day and multi-day events", () => {
  assert.equal(calculateRentalDuration("2026-10-10", "2026-10-10"), 1);
  assert.equal(calculateRentalDuration("2026-10-10", "2026-10-12"), 2);
  assert.equal(
    calculateRentalHours("2026-10-10T10:00:00Z", "2026-10-10T18:00:00Z"),
    8,
  );
});
test("reservation windows use half-open overlap", () => {
  assert.equal(
    rentalWindowsOverlap(
      "2026-10-10",
      "2026-10-12",
      "2026-10-11",
      "2026-10-13",
    ),
    true,
  );
  assert.equal(
    rentalWindowsOverlap(
      "2026-10-10",
      "2026-10-12",
      "2026-10-12",
      "2026-10-14",
    ),
    false,
  );
});
test("booking validation and balance handling reject unsafe values", () => {
  const result = createRentalBookingSchema.safeParse({
    rentalRequestId: "",
    quotationId: "",
    customerSnapshot: { name: "Customer", email: "customer@example.com" },
    eventSnapshot: {
      eventType: "wedding",
      startDate: "2026-10-10",
      endDate: "2026-10-10",
    },
    equipment: [
      {
        productId: "507f1f77bcf86cd799439011",
        name: "Screen",
        quantity: 10,
        dailyRate: 100000,
        rentalDays: 1,
        lineTotal: 1000000,
      },
    ],
    bookingStart: "2026-10-10T10:00:00.000Z",
    bookingEnd: "2026-10-10T18:00:00.000Z",
    venue: "Lagos",
    subtotal: 1000000,
    total: 1000000,
    amountPaid: 200000,
    currency: "NGN",
  });
  assert.equal(result.success, true);
  assert.equal(calculateBalance(1000000, 200000), 800000);
  assert.throws(() => calculateBalance(100, 101));
});
