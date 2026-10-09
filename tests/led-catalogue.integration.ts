// Isolated MongoDB and synthetic image fixtures only. Never modifies application data.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium, type Browser } from "@playwright/test";
import { SignJWT } from "jose";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  const base = "http://127.0.0.1:3135",
    secret = "led-catalogue-test-secret-at-least-32-characters";
  let server: ChildProcess | undefined, browser: Browser | undefined;
  try {
    await mongoose.connect(mongo.getUri("led_catalogue_test"));
    const db = mongoose.connection.db!,
      adminId = new Types.ObjectId();
    await db
      .collection("admins")
      .insertOne({
        _id: adminId,
        role: "owner",
        name: "Test owner",
        email: "owner@example.test",
        isActive: true,
        sessionVersion: 0,
      });
    async function seed() {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--import", "tsx", "scripts/seed-led-catalogue.ts"],
          {
            env: {
              ...process.env,
              MONGODB_URI: mongo.getUri("led_catalogue_test"),
            },
            stdio: "ignore",
          },
        );
        child.on("error", reject);
        child.on("exit", (code) =>
          code === 0 ? resolve() : reject(new Error("Seed failed")),
        );
      });
    }
    await seed();
    assert.equal(await db.collection("products").countDocuments(), 6);
    assert.equal(await db.collection("productcategories").countDocuments(), 6);
    await db
      .collection("products")
      .updateOne(
        { slug: "indoor-led-display" },
        {
          $set: {
            priceType: "fixed",
            price: 850000,
            featuredImageUrl: "/led-test-installation.svg",
            imageFit: "cover",
          },
        },
      );
    await db
      .collection("products")
      .updateOne(
        { slug: "outdoor-led-display" },
        {
          $set: {
            featuredImageUrl: "/led-test-isolated.svg",
            imageFit: "contain",
          },
        },
      );
    await db
      .collection("products")
      .updateOne(
        { slug: "rental-led-screen" },
        { $set: { featuredImageUrl: "/led-test-missing.svg" } },
      );
    const longName =
      "Professional LED display for conferences and commercial presentation spaces "
        .repeat(2)
        .trim();
    await db
      .collection("products")
      .updateOne(
        { slug: "event-stage-led-screen" },
        { $set: { name: longName } },
      );
    const before = await db
      .collection("products")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const categoriesBefore = await db
      .collection("productcategories")
      .find()
      .sort({ _id: 1 })
      .toArray();
    await seed();
    assert.deepEqual(
      await db.collection("products").find().sort({ _id: 1 }).toArray(),
      before,
    );
    assert.deepEqual(
      await db
        .collection("productcategories")
        .find()
        .sort({ _id: 1 })
        .toArray(),
      categoriesBefore,
    );
    console.log(
      "PASS: seed creates six records/categories and preserves existing names, images, prices and timestamps on rerun",
    );
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3135",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("led_catalogue_test"),
          AUTH_SECRET: secret,
          NEXT_PUBLIC_APP_URL: base,
        },
        stdio: "ignore",
      },
    );
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(base + "/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(250);
    }
    assert.ok(ready);
    const chrome =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/led-test-*.svg", (route) =>
      route.request().url().includes("missing")
        ? route.fulfill({ status: 404, body: "missing fixture" })
        : route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="1200" height="600" fill="#ddd"/><rect x="50" y="50" width="1100" height="500" fill="#28146b"/></svg>',
          }),
    );
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + "/led-screens");
      const cards = page.locator("main article");
      assert.equal(await cards.count(), 6);
      for (const card of await cards.all()) await card.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          document.querySelectorAll("main article img").length === 2 &&
          [
            ...document.querySelectorAll<HTMLImageElement>("main article img"),
          ].every((i) => i.complete && i.naturalWidth > 0),
      );
      assert.equal(
        await cards.getByText("Image coming soon", { exact: true }).count(),
        4,
      );
      assert.equal(
        await cards.getByText("Request Price", { exact: true }).count(),
        5,
      );
      assert.equal(
        await cards.getByText("₦850,000.00", { exact: true }).count(),
        1,
      );
      const dimensions = await cards.evaluateAll((items) =>
        items.map((item) => {
          const box = item.getBoundingClientRect(),
            media = item.firstElementChild!.getBoundingClientRect();
          return {
            top: box.top,
            height: Math.round(box.height),
            width: box.width,
            mediaHeight: media.height,
          };
        }),
      );
      assert.equal(
        dimensions.filter((item) => item.top === dimensions[0].top).length,
        width >= 1024 ? 3 : width >= 640 ? 2 : 1,
      );
      assert.equal(new Set(dimensions.map((d) => d.height)).size, 1);
      assert.ok(
        dimensions.every(
          (d) => Math.abs((d.width - 2) / d.mediaHeight - 1.6) < 0.02,
        ),
      );
      assert.equal(
        await cards
          .locator('img[src="/led-test-isolated.svg"]')
          .evaluate((el) => getComputedStyle(el).objectFit),
        "contain",
      );
      assert.equal(
        await cards
          .locator('img[src="/led-test-installation.svg"]')
          .evaluate((el) => getComputedStyle(el).objectFit),
        "cover",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: `/private/tmp/led-fixture-${width}.png`,
        fullPage: true,
      });
      for (const product of before) {
        await page.goto(base + `/led-screens/${product.slug}`);
        assert.equal(await page.locator("h1").textContent(), product.name);
        assert.ok(
          await page
            .getByRole("heading", { name: "Applications", exact: true })
            .isVisible(),
        );
        const quote = page
          .getByRole("main")
          .getByRole("link", { name: "Request Quote", exact: true });
        assert.equal(
          await quote.getAttribute("href"),
          `/request-quote?product=${product.slug}`,
        );
        await quote.click();
        await page
          .getByRole("heading", { name: product.name, exact: true })
          .waitFor();
        assert.equal(
          await page.locator('input[name="productSlug"]').inputValue(),
          product.slug,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
      await page.goto(base);
      const featured = page
        .locator("section")
        .filter({
          has: page.getByRole("heading", {
            name: "Featured LED screens",
            exact: true,
          }),
        });
      assert.equal(await featured.locator("article").count(), 6);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      console.log(
        `PASS: ${width}px catalogue, six database-loaded products, long name, missing/real price, image modes/fallback, details, quote context and featured cards`,
      );
    }
    const token = await new SignJWT({ sessionVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(adminId))
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    await page
      .context()
      .addCookies([{ name: "led_admin_session", value: token, url: base }]);
    const indoor = before.find((p) => p.slug === "indoor-led-display")!;
    await page.goto(base + `/admin/products/${indoor._id}/edit`);
    await page
      .getByLabel("Featured image URL", { exact: true })
      .fill("/images/products/led-screens/indoor-led-screen.png");
    await page
      .getByLabel("Image presentation", { exact: true })
      .selectOption("contain");
    const save = page.getByRole("button", { name: /save|update/i }).last();
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        response.url().includes(`/api/products/${indoor._id}`),
    );
    await save.click();
    assert.ok((await responsePromise).ok());
    const saved = await db.collection("products").findOne({ _id: indoor._id });
    assert.equal(saved?.imageFit, "contain");
    assert.equal(
      saved?.featuredImageUrl,
      "/images/products/led-screens/indoor-led-screen.png",
    );
    assert.equal(saved?.price, 850000);
    console.log(
      "PASS: existing admin saves local image paths and fit mode while preserving price",
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    server?.kill("SIGTERM");
    await mongoose.disconnect();
    await mongo.stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
