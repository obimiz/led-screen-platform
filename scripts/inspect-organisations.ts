import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { ClientOrganisation } from "../src/models/client-organisation";
import { initialOrganisationNames } from "../src/lib/constants/organisations";
loadEnvConfig(process.cwd());
async function main() {
  await connectToDatabase();
  const rows = await ClientOrganisation.find()
    .select("name active featured logoUrl displayOrder")
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  const expectedCounts = initialOrganisationNames.map((name) => ({
    name,
    count: rows.filter((row) => row.name === name).length,
  }));
  console.log(
    JSON.stringify(
      {
        total: rows.length,
        publicCount: rows.filter((r) => r.active && r.featured).length,
        allExpectedPresentOnce: expectedCounts.every(
          ({ count }) => count === 1,
        ),
        unexpectedCounts: expectedCounts.filter(({ count }) => count !== 1),
        records: rows.map((r) => ({
          name: r.name,
          active: r.active,
          featured: r.featured,
          hasLogo: Boolean(r.logoUrl),
          logoPath:
            r.logoUrl?.startsWith("/") && !r.logoUrl.startsWith("//")
              ? r.logoUrl
              : r.logoUrl
                ? "[external URL omitted]"
                : "",
          displayOrder: r.displayOrder,
        })),
      },
      null,
      2,
    ),
  );
}
main()
  .catch((error: unknown) => {
    console.error(
      "Organisation inspection failed: database connection/query unavailable.",
    );
    let cause: unknown = error;
    while (cause instanceof Error) {
      console.error(
        JSON.stringify({
          name: cause.name,
          code: "code" in cause ? cause.code : undefined,
        }),
      );
      cause = cause.cause;
    }
    console.error(
      JSON.stringify({
        uriConfigured: Boolean(process.env.MONGODB_URI),
        uriSchemeValid: /^mongodb(\+srv)?:\/\//.test(
          process.env.MONGODB_URI || "",
        ),
      }),
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
