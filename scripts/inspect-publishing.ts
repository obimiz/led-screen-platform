// Read-only inventory: do not import application models or create indexes.
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd());
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
  });
  const db = mongoose.connection.db!;
  console.log(
    JSON.stringify(
      {
        posts: await db.collection("portfolioprojects").countDocuments(),
        records: await db
          .collection("portfolioprojects")
          .find()
          .project({
            title: 1,
            slug: 1,
            status: 1,
            contentType: 1,
            coverImageUrl: 1,
            imageUrls: 1,
          })
          .limit(20)
          .toArray(),
        categories: await db.collection("portfoliocategories").find().toArray(),
      },
      null,
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
