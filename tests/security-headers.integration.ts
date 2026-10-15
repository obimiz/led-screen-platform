// Ephemeral fixtures only; never connects to the configured business database.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { SignJWT } from "jose";
async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined;
  const base = "http://127.0.0.1:3148",
    secret = "isolated-security-regression-secret-at-least-32-characters";
  try {
    await mongoose.connect(mongo.getUri("security_headers_test"));
    const db = mongoose.connection.db!;
    await db.collection("businesssettings").insertOne({
      singletonKey: "primary",
      businessName: "Security Fixture Business",
      primaryPhone: "+234 800 000 0000",
      whatsappNumber: "2348000000000",
      primaryEmail: "contact@example.test",
      createdAt: new Date("2020-01-01"),
      updatedAt: new Date("2020-01-01"),
    });
    const admin = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: admin,
      name: "Security Fixture Owner",
      email: "security@example.test",
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    const before = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    const token = await new SignJWT({ sessionVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(admin))
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(secret));
    let output = "";
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3148",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("security_headers_test"),
          AUTH_SECRET: secret,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stderr?.on("data", (c) => (output += String(c)));
    let ready = false;
    for (let i = 0; i < 120; i++) {
      try {
        if ((await fetch(base + "/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(250);
    }
    assert.ok(ready, "production server starts");
    for (const route of [
      "/led-screens?page=1",
      "/gallery",
      "/",
      "/admin/login",
      "/admin",
    ]) {
      const response = await fetch(base + route, {
        headers: { cookie: `led_admin_session=${token}` },
      });
      assert.equal(response.status, 200, route);
      await response.text();
      const policy = response.headers.get("content-security-policy")!;
      assert.ok(policy.includes("script-src 'self' 'unsafe-inline'"), route);
      assert.ok(!policy.includes("'unsafe-eval'"), route);
      assert.ok(policy.includes("object-src 'none'"));
      assert.ok(policy.includes("frame-ancestors 'self'"));
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
      console.log(`PASS: production headers remain restrictive on ${route}`);
    }
    const contact = await (await fetch(base + "/contact")).text();
    assert.ok(contact.includes('href="tel:+2348039308982"'));
    assert.ok(contact.includes('href="https://wa.me/2348039308982"'));
    assert.ok(contact.includes("+234 803 930 8982"));
    assert.ok(contact.includes('href="mailto:contact@example.test"'));
    const stored = await (
      await fetch(base + "/api/settings/business", {
        headers: { cookie: `led_admin_session=${token}` },
      })
    ).json();
    assert.equal(stored.data.primaryPhone, "+234 800 000 0000");
    assert.equal(stored.data.whatsappNumber, "2348000000000");
    console.log(
      "PASS: official public contact links preserve stored admin settings and unrelated email",
    );
    assert.deepEqual(
      await db
        .collection("businesssettings")
        .findOne({ singletonKey: "primary" }),
      before,
    );
    assert.equal(await db.collection("products").countDocuments(), 0);
    assert.ok(!/\[MONGOOSE\].*the `new` option/.test(output), output);
    console.log(
      "PASS: public and admin settings reads preserve all existing fields/timestamps and produce no deprecated-option warning",
    );
  } finally {
    server?.kill("SIGTERM");
    await mongoose.disconnect();
    await mongo.stop();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
