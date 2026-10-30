import test from "node:test";
import assert from "node:assert/strict";
import { maintenanceRequestSchema } from "@/lib/validations/maintenance";
test("external maintenance request accepts optional equipment details", () => {
  const v = maintenanceRequestSchema.parse({
    customerName: "Ada Lovelace",
    customerPhone: "+234 801 234 5678",
    equipmentSource: "external-installation",
    serviceType: "repair",
    issueCategory: "unknown",
    preferredContactMethod: "phone",
  });
  assert.equal(v.equipmentSource, "external-installation");
  assert.equal(v.screenBrand, "");
});
test("maintenance request rejects missing contact", () => {
  assert.throws(() =>
    maintenanceRequestSchema.parse({
      customerName: "Ada Lovelace",
      equipmentSource: "unknown",
    }),
  );
});
