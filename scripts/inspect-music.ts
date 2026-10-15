// Read-only inventory; never changes music or business records.
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd());
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
  });
  const db = mongoose.connection.db!;
  console.log(
    JSON.stringify(
      {
        musicCount: await db.collection("musiccontents").countDocuments(),
        indexes: await db
          .collection("musiccontents")
          .listIndexes()
          .toArray()
          .catch(() => []),
        items: await db
          .collection("musiccontents")
          .find()
          .project({ title: 1, status: 1, sourcePlatform: 1, audioUrl: 1 })
          .limit(20)
          .toArray(),
        categories: await db
          .collection("musiccategories")
          .find()
          .project({ name: 1, slug: 1, isActive: 1 })
          .toArray(),
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
