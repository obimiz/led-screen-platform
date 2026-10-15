// Repairs only the legacy music text index. Documents and other indexes are untouched.
// Dry run by default; use --apply once before starting the updated application.
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd());
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { autoIndex: false });
  const collection = mongoose.connection.db!.collection("musiccontents");
  const indexes = await collection
    .listIndexes()
    .toArray()
    .catch((e) => {
      if (e.code === 26) return [];
      throw e;
    });
  const index = indexes.find((i) => i.key._fts === "text");
  const fields = ["title", "artistName", "albumTitle", "description", "tags"];
  if (!index || index.language_override === "musicTextIndexLanguage") {
    console.log("No legacy music text index needs repair.");
    return;
  }
  if (
    index.language_override !== "language" ||
    Object.keys(index.weights || {})
      .sort()
      .join() !== [...fields].sort().join()
  )
    throw Error(
      "Unexpected music text index; inspect manually before modifying it.",
    );
  const count = await collection.countDocuments();
  console.log(`Legacy music text index: ${index.name}; documents: ${count}.`);
  if (!process.argv.includes("--apply")) {
    console.log(
      "Dry run. Use --apply to rebuild this index without changing documents.",
    );
    return;
  }
  await collection.dropIndex(index.name!);
  await collection.createIndex(
    Object.fromEntries(fields.map((field) => [field, "text" as const])),
    {
      name: index.name,
      language_override: "musicTextIndexLanguage",
      default_language: index.default_language || "english",
      weights: index.weights,
    },
  );
  console.log(
    `Music text index repaired; documents retained: ${await collection.countDocuments()}.`,
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
