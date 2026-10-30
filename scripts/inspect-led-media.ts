import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { Product } from "../src/models/product";
import { ProductCategory } from "../src/models/product-category";
import { GalleryItem } from "../src/models/gallery-item";
import { GalleryCategory } from "../src/models/gallery-category";

loadEnvConfig(process.cwd());
async function main() {
  await connectToDatabase();
  const [products, categories, gallery, galleryCategories] = await Promise.all([
    Product.find({ productType: { $in: ["led-screen", "led-accessory"] } })
      .select(
        "name slug productType category indoorOutdoor pixelPitch specifications cabinetSize moduleSize featuredImageUrl imageUrls imageFit priceType status featured",
      )
      .lean(),
    ProductCategory.find().select("name slug productType").lean(),
    GalleryItem.find()
      .select(
        "title slug mediaType imageUrl thumbnailUrl categoryId serviceType sourceType sourceRecordId portfolioProjectId status featured sortOrder",
      )
      .lean(),
    GalleryCategory.find().select("name slug").lean(),
  ]);
  // Never print remote URLs, which could contain signed tokens.
  console.log(
    JSON.stringify(
      { products, categories, gallery, galleryCategories },
      (key, value) => {
        if (typeof value === "string" && /^https?:\/\//i.test(value))
          return "[external URL omitted]";
        return value;
      },
      2,
    ),
  );
}
main()
  .catch(() => {
    console.error(
      "LED media inspection failed; database connection/query unavailable.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
