import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultHomepageServicesSettings,
  formatHeroCopy,
} from "../src/lib/constants/homepage";
import { homepageServicesSettingsSchema } from "../src/lib/validations/homepage-accessories";
import { isVideoAccessory } from "../src/lib/utils/accessory-group";

test("services retain existing defaults and reject unsafe card and button links", () => {
  assert.deepEqual(
    homepageServicesSettingsSchema.parse({}),
    defaultHomepageServicesSettings,
  );
  for (const href of [
    "javascript:alert(1)",
    "//example.com",
    "/\\example.com",
    "/path\nmalicious",
  ]) {
    assert.equal(
      homepageServicesSettingsSchema.safeParse({
        ...defaultHomepageServicesSettings,
        buttonHref: href,
      }).success,
      false,
    );
    assert.equal(
      homepageServicesSettingsSchema.safeParse({
        ...defaultHomepageServicesSettings,
        items: defaultHomepageServicesSettings.items.map((item) => ({
          ...item,
          href,
        })),
      }).success,
      false,
    );
  }
  assert.equal(
    homepageServicesSettingsSchema.safeParse({
      ...defaultHomepageServicesSettings,
      items: [],
    }).success,
    false,
  );
});
test("hero removes only leading dash prefixes while retaining text and internal hyphens", () => {
  assert.equal(
    formatHeroCopy(
      "- Professional LED Displays\n — Sales and after-sales support",
    ),
    "Professional LED Displays\nSales and after-sales support",
  );
});
test("video classification and legacy video categories are distinct from LED spare parts", () => {
  assert.equal(
    isVideoAccessory({
      showcase: "video",
      category: { slug: "other-led-accessories" },
    }),
    true,
  );
  assert.equal(
    isVideoAccessory({
      showcase: "accessory",
      category: { slug: "video-processors" },
    }),
    true,
  );
  assert.equal(
    isVideoAccessory({
      showcase: "camera",
      category: { slug: "led-screen-cameras" },
    }),
    true,
  );
  assert.equal(
    isVideoAccessory({ category: { slug: "power-supplies" } }),
    false,
  );
});
