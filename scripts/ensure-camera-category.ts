import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { ProductCategory } from "../src/models/product-category";

async function main() {
  loadEnvConfig(process.cwd());
  await connectToDatabase();
  const result = await ProductCategory.updateOne(
    { productType: "led-accessory", slug: "led-screen-cameras" },
    {
      $setOnInsert: {
        name: "LED Screen Cameras",
        slug: "led-screen-cameras",
        productType: "led-accessory",
        description:
          "Cameras for live video production with compatible processing and switching equipment.",
        active: true,
        sortOrder: 15,
      },
    },
    { upsert: true },
  );
  console.log(
    result.upsertedCount
      ? "LED Screen Cameras category created."
      : "LED Screen Cameras category already exists; left unchanged.",
  );
}

main()
  .catch(() => {
    console.error(
      "Could not ensure camera category; database connection or operation unavailable.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
