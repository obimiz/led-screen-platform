import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { ClientOrganisation } from "../src/models/client-organisation";

const mappings = [
  ["Divine Mercy Catholic Church, Lekki", "divine-mercy-lekki.png"],
  [
    "Catholic Church of the Transfiguration, Lekki",
    "transfiguration-lekki.png",
  ],
  ["St. Patrick, Alaba International", "st-patrick-alaba.png"],
  ["Holy Family Catholic Church, Festac", "holy-family-festac.png"],
  ["Catholic Church of the Visitation, Festac", "visitation-festac.png"],
  ["St. Mary's, Isolo", "st-marys-isolo.png"],
  ["St. Michael Catholic Church, Okpanam", "st-michael-okpanam.png"],
  ["Madonna University", "madonna-university.png"],
  ["Glorious Praise", "glorious-praise.png"],
  ["Affable Homes", "affable-homes.png"],
] as const;

async function main() {
  loadEnvConfig(process.cwd());
  // Match the on-disk casing: Next's public URL lookup is case-sensitive,
  // even when the development filesystem accepts either spelling.
  for (const [, file] of mappings)
    await access(`public/Images/clients/${file}`);
  await connectToDatabase();
  const before = await ClientOrganisation.find().lean();
  const updates = mappings.map(([name, file]) => {
    const matches = before.filter((record) => record.name === name);
    assert.equal(
      matches.length,
      1,
      `Expected exactly one existing record: ${name}`,
    );
    return { record: matches[0], logoUrl: `/Images/clients/${file}` };
  });
  for (const { record, logoUrl } of updates) {
    if (record.logoUrl === logoUrl) continue;
    const result = await ClientOrganisation.updateOne(
      { _id: record._id, logoUrl: record.logoUrl ?? null },
      { $set: { logoUrl } },
      { runValidators: true, timestamps: false, upsert: false },
    );
    assert.equal(
      result.matchedCount,
      1,
      `Record changed concurrently: ${record.name}`,
    );
  }
  const after = await ClientOrganisation.find().lean();
  assert.equal(after.length, before.length);
  for (const original of before) {
    const current = after.find(
      (row) => String(row._id) === String(original._id),
    );
    const update = updates.find(
      ({ record }) => String(record._id) === String(original._id),
    );
    assert.deepEqual(
      current,
      update ? { ...original, logoUrl: update.logoUrl } : original,
    );
  }
  console.log(
    JSON.stringify(
      after.map(({ name, logoUrl }) => ({ name, logoUrl })),
      null,
      2,
    ),
  );
  console.log(
    `Verified: ${updates.length} logo mappings; all other fields and unmatched records preserved.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      "Logo update or verification failed. Inspect existing records before retrying.",
    );
    if (error instanceof assert.AssertionError) console.error(error.message);
    else {
      let cause = error;
      while (cause instanceof Error) {
        console.error(cause.name, "code" in cause ? cause.code : "");
        cause = cause.cause;
      }
    }
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
