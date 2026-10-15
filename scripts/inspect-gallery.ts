// Read-only gallery inventory. Does not print credentials or change records.
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
async function main() {
  loadEnvConfig(process.cwd());
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
    const db = mongoose.connection.db!;
    const items = await db
      .collection("galleryitems")
      .find({})
      .project({
        title: 1,
        imageUrl: 1,
        caption: 1,
        status: 1,
        categoryId: 1,
        productId: 1,
        sourceType: 1,
        sourceRecordId: 1,
      })
      .limit(30)
      .toArray();
    console.log(
      JSON.stringify(
        {
          count: await db.collection("galleryitems").countDocuments(),
          items,
          categories: await db
            .collection("gallerycategories")
            .find({})
            .toArray(),
          uploadedAssets: await db
            .collection("productimageassets")
            .countDocuments(),
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
