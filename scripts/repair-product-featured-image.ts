// Targeted repair of the reported record; retains the gallery association and every other field.
import { loadEnvConfig } from "@next/env";
import mongoose, { Types } from "mongoose";
import assert from "node:assert/strict";
import { validateProductImage } from "../src/lib/media/product-images";
loadEnvConfig(process.cwd());
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
  });
  const db = mongoose.connection.db!;
  const id = new Types.ObjectId("6ac0fd4b6b49322acacddf56");
  const url = "/api/product-images/6ad0cabd18acf4c81cff7b2e";
  const before = await db.collection("products").findOne({ _id: id });
  assert.ok(before);
  assert.equal(before.name, "Event & Stage LED Screen");
  assert.ok(before.imageUrls.includes(url));
  const asset = await db
    .collection("productimageassets")
    .findOne({ _id: new Types.ObjectId(url.split("/").pop()) });
  assert.ok(asset);
  validateProductImage(Buffer.from(asset.data.buffer), asset.contentType);
  if (before.featuredImageUrl === url) {
    console.log("Featured image already repaired.");
    return;
  }
  assert.equal(before.featuredImageUrl, "");
  if (!process.argv.includes("--apply")) {
    console.log(
      "Verified stored PNG and gallery association. Run with --apply to set this product’s featured image only.",
    );
    return;
  }
  const result = await db.collection("products").updateOne(
    {
      _id: id,
      featuredImageUrl: "",
      imageUrls: url,
      updatedAt: before.updatedAt,
    },
    { $set: { featuredImageUrl: url } },
  );
  assert.equal(result.modifiedCount, 1);
  const after = await db.collection("products").findOne({ _id: id });
  assert.ok(after);
  const { featuredImageUrl: oldImage, ...previousFields } = before;
  const { featuredImageUrl: newImage, ...currentFields } = after;
  void oldImage;
  assert.deepEqual(previousFields, currentFields);
  assert.equal(newImage, url);
  console.log(
    "Repaired Event & Stage LED Screen featured image. Gallery, timestamps, prices, descriptions and all other fields unchanged.",
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
