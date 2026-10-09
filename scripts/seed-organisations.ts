import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { ClientOrganisation } from "../src/models/client-organisation";
import { createSlug } from "../src/lib/utils/slug";
import { initialOrganisationNames } from "../src/lib/constants/organisations";
async function seed() {
  loadEnvConfig(process.cwd());
  await connectToDatabase();
  await ClientOrganisation.init();
  let inserted = 0;
  for (const [displayOrder, name] of initialOrganisationNames.entries()) {
    const slug = createSlug(name);
    const result = await ClientOrganisation.updateOne(
      { $or: [{ slug }, { name }] },
      {
        $setOnInsert: {
          name,
          slug,
          displayOrder,
          active: true,
          featured: true,
          logoUrl: "",
          location: "",
          website: "",
        },
      },
      { upsert: true },
    );
    inserted += result.upsertedCount;
  }
  console.info(
    `Organisations ready: ${inserted} added. Existing records preserved.`,
  );
}
seed()
  .catch(() => {
    console.error(
      "Unable to seed organisations. Check the database configuration and retry.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
