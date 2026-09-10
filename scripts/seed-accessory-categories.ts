import { loadEnvConfig } from "@next/env";
import { connectToDatabase } from "../src/lib/db/connection";
import { createSlug } from "../src/lib/utils/slug";
import { ProductCategory } from "../src/models/product-category";

const categories = [
  "LED Modules",
  "Receiving Cards",
  "Sending Cards",
  "LED Controllers",
  "Video Processors",
  "Power Supplies",
  "LED Cabinets",
  "Cables & Connectors",
  "Data Cables",
  "Power Cables",
  "Mounting Accessories",
  "Cooling Components",
  "Replacement Parts",
  "Tools & Installation Accessories",
  "Other LED Accessories",
];

async function seed() {
  loadEnvConfig(process.cwd());
  await connectToDatabase();
  for (const [sortOrder, name] of categories.entries()) {
    await ProductCategory.updateOne(
      { productType: "led-accessory", slug: createSlug(name) },
      {
        $setOnInsert: {
          name,
          slug: createSlug(name),
          description: "",
          imageUrl: "",
          active: true,
          sortOrder,
          productType: "led-accessory",
        },
      },
      { upsert: true },
    );
  }
  console.info(
    "Accessory categories are ready. Existing categories were not overwritten.",
  );
}

seed()
  .catch((error: unknown) => {
    console.error("Unable to seed accessory categories.");
    if (process.env.NODE_ENV === "development" && error instanceof Error)
      console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import("mongoose");
    await mongoose.default.disconnect();
  });
