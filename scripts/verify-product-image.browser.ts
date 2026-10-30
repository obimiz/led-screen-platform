// Read-only verification against the configured database and local application.
import { loadEnvConfig } from "@next/env";
import mongoose, { Types } from "mongoose";
import { SignJWT } from "jose";
import { chromium, type Browser } from "@playwright/test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
loadEnvConfig(process.cwd());
async function main() {
  let browser: Browser | undefined;
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
    const db = mongoose.connection.db!;
    const product = await db
      .collection("products")
      .findOne({ _id: new Types.ObjectId("6ac0fd4b6b49322acacddf56") });
    assert.ok(product);
    const url = "/api/product-images/6ad0cabd18acf4c81cff7b2e";
    assert.equal(product.featuredImageUrl, url);
    assert.ok(product.imageUrls.includes(url));
    const asset = await db
      .collection("productimageassets")
      .findOne({ _id: new Types.ObjectId("6ad0cabd18acf4c81cff7b2e") });
    assert.ok(asset);
    const admin = await db.collection("admins").findOne({
      _id: asset.createdBy,
      isActive: true,
      role: { $in: ["owner", "admin"] },
    });
    assert.ok(admin);
    // Exercise normal server session verification with a short-lived token; no login/account mutations.
    const token = await new SignJWT({ sessionVersion: admin.sessionVersion })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(admin._id))
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
    const base = process.env.PRODUCT_IMAGE_TEST_URL || "http://localhost:3000";
    const response = await fetch(base + url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal((await response.arrayBuffer()).byteLength, 329746);
    console.log(
      "PASS: original upload serves anonymously as PNG (329746 bytes)",
    );
    const chrome =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.addCookies([
      {
        name: "led_admin_session",
        value: token,
        url: base,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    for (const [label, route] of [
      ["admin", `/admin/products/${product._id}`],
      ["catalogue", "/led-screens"],
      ["detail", `/led-screens/${product.slug}`],
      ["homepage", "/"],
    ] as const) {
      await page.goto(base + route);
      const image = page.locator(`img[alt="${product.name}"]`).first();
      await image.waitFor();
      await image.scrollIntoViewIfNeeded();
      assert.equal(await image.getAttribute("src"), url);
      await page.waitForFunction(
        (name) =>
          Array.from(document.querySelectorAll<HTMLImageElement>("img")).some(
            (i) => i.alt === name && i.complete && i.naturalWidth > 0,
          ),
        product.name,
      );
      await page.screenshot({
        path: `/private/tmp/product-image-live-${label}.png`,
      });
      console.log(`PASS: existing product image renders on ${label}`);
    }
    await page.goto(base + `/admin/products/${product._id}/edit`);
    assert.equal(
      await page.getByLabel("Featured image URL", { exact: true }).inputValue(),
      url,
    );
    console.log("PASS: admin edit form reloads the persisted featured image");
    const after = await db.collection("products").findOne({ _id: product._id });
    assert.deepEqual(after, product);
    console.log("PASS: read-only verification leaves the product unchanged");
  } finally {
    await browser?.close();
    await mongoose.disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
