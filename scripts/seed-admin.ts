import { loadEnvConfig } from "@next/env";

import { hashPassword } from "../src/lib/auth/password-core";
import { connectToDatabase } from "../src/lib/db/connection";
import { seedAdminSchema } from "../src/lib/validations/auth";
import { Admin } from "../src/models/admin";

async function seedAdmin() {
  loadEnvConfig(process.cwd());

  const parsed = seedAdminSchema.safeParse({
    name: process.env.ADMIN_SEED_NAME,
    email: process.env.ADMIN_SEED_EMAIL,
    password: process.env.ADMIN_SEED_PASSWORD,
  });

  if (!parsed.success) {
    console.error(
      "Admin seed configuration is invalid. Check ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD.",
    );
    process.exitCode = 1;
    return;
  }

  await connectToDatabase();
  if (await Admin.exists({ email: parsed.data.email })) {
    console.error(
      "An admin account with that email already exists. No changes were made.",
    );
    process.exitCode = 1;
    return;
  }

  await Admin.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role: "owner",
    isActive: true,
  });
  console.info("Initial owner account created successfully.");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error("Unable to create the initial owner account.");
    if (error instanceof Error) {
      if (error.message === "Unable to connect to the database.") {
        console.error(
          "Unable to connect to MongoDB. Check MONGODB_URI in .env.local, including the actual cluster hostname, database credentials, and network access settings.",
        );
        const cause = error.cause;
        if (cause instanceof Error && "code" in cause) {
          // Only print known codes; driver messages can contain credentials.
          const hints: Record<string, string> = {
            ENOTFOUND:
              "Database hostname not found. Replace any placeholder hostname in MONGODB_URI.",
            ECONNREFUSED:
              "Connection refused. Check database availability and DNS/network access.",
            ETIMEDOUT:
              "Connection timed out. Check database availability and network access.",
            "18": "Authentication failed. Check your MongoDB database username and password.",
          };
          const hint = hints[String(cause.code)];
          if (hint) console.error(hint);
        }
      } else if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is missing. Set it in .env.local.");
      } else {
        console.error(
          "Check that the database user can read and insert admin accounts and that the seed email is unique.",
        );
      }
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import("mongoose");
    await mongoose.default.disconnect();
  });
