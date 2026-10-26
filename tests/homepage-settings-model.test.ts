import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

test("homepage fields are available when development reuses an older cached settings model", async () => {
  // Simulate a server that compiled BusinessSettings before homepage copy was added.
  const cached = mongoose.model(
    "BusinessSettings",
    new mongoose.Schema({
      singletonKey: String,
      businessName: String,
    }),
  );
  const { BusinessSettingsModel } =
    await import("../src/models/business-settings");
  assert.equal(BusinessSettingsModel, cached);
  for (const path of [
    "homepageServices.heading",
    "homepageServices.items",
    "homepageHero.heading",
    "homepageHero.description",
    "homepageHero.headingTwo",
    "homepageAccessories.heading",
    "homepageAccessories.description",
  ]) {
    assert.ok(
      BusinessSettingsModel.schema.path(path),
      `${path} must survive cached-model reuse`,
    );
  }
  const copy = {
    homepageHero: {
      heading: "Saved hero",
      headingTwo: "Second heading",
      description: "Saved hero description",
    },
    homepageAccessories: {
      heading: "Saved accessories",
      description: "Saved accessory description",
    },
  };
  assert.deepEqual(BusinessSettingsModel.castObject(copy), copy);
});
