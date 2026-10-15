// Read-only image association and persistent asset audit.
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { Product } from "../src/models/product";
import { ProductImageAsset } from "../src/models/product-image";
loadEnvConfig(process.cwd());
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
  });
  const product = await Product.findById("6ac0fd4b6b49322acacddf56")
    .select("name slug featuredImageUrl imageUrls status featured updatedAt")
    .lean();
  const uploads = await ProductImageAsset.find()
    .select("+data name contentType createdAt createdBy")
    .sort({ createdAt: -1 })
    .limit(15);
  const otherProducts = await Product.find({ productType: "led-screen" })
    .select("name featuredImageUrl imageUrls")
    .lean();
  console.log(
    JSON.stringify(
      {
        product,
        uploads: uploads.map((i) => ({
          id: i.id,
          name: i.name,
          contentType: i.contentType,
          bytes: i.data.length,
          signature: i.data.subarray(0, 16).toString("hex"),
          createdAt: i.createdAt,
          createdBy: i.createdBy,
        })),
        otherProducts,
      },
      (key, value) =>
        typeof value === "string" && /^https?:/.test(value)
          ? "[external URL omitted]"
          : value,
      2,
    ),
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
