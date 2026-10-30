// Synthetic fixtures in an ephemeral MongoDB only. No configured database writes.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium, type Browser } from "@playwright/test";
import bcrypt from "bcryptjs";
async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined, browser: Browser | undefined;
  const base = "http://127.0.0.1:3146";
  let checks = 0;
  const pass = (s: string) => console.log(`PASS ${++checks}: ${s}`);
  try {
    await mongoose.connect(mongo.getUri("gallery_test"));
    const db = mongoose.connection.db!;
    await db.collection("admins").insertOne({
      _id: new Types.ObjectId(),
      name: "Gallery Test Admin",
      email: "gallery@example.test",
      passwordHash: await bcrypt.hash("Gallery-test-password-2026!", 12),
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    const productId = new Types.ObjectId();
    const productCategoryId = new Types.ObjectId();
    await db.collection("productcategories").insertOne({
      _id: productCategoryId,
      name: "Synthetic products",
      slug: "synthetic-products",
      productType: "led-screen",
      active: true,
    });
    await db.collection("products").insertOne({
      category: productCategoryId,
      createdAt: new Date(),
      updatedAt: new Date(),
      _id: productId,
      name: "Synthetic display",
      slug: "synthetic-display",
      status: "draft",
      productType: "led-screen",
      imageUrls: [],
    });
    const log = await import("node:fs");
    const stream = log.openSync("/private/tmp/gallery-test-server.log", "w");
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3146",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("gallery_test"),
          AUTH_SECRET: "isolated-gallery-secret-at-least-32-characters",
          NEXT_PUBLIC_APP_URL: base,
        },
        stdio: ["ignore", stream, stream],
      },
    );
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
    assert.ok(ready, "server starts");
    for (const path of [
      "/api/gallery",
      "/api/gallery/012345678901234567890123",
    ])
      assert.equal((await fetch(base + path)).status, 401);
    assert.equal(
      (
        await fetch(base + "/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
    );
    pass("gallery metadata and mutations require authentication");
    const chrome =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("requestfailed", (r) => {
      if (r.url().includes("/_next/image"))
        console.log("Failed image", r.url(), r.failure());
    });
    page.on("response", (r) => {
      if (r.url().includes("/_next/image"))
        console.log(
          "Image response",
          r.status(),
          r.url(),
          r.headers()["content-type"],
        );
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/admin/login");
    await page.getByLabel("Email").fill("gallery@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("Gallery-test-password-2026!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/admin");
    pass("administrator logs in through the real login form");
    const cookie = (await page.context().cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const api = async (path: string, method = "GET", body?: unknown) => {
      const response = await page.request.fetch(base + path, {
        method,
        headers: { Cookie: cookie },
        ...(body === undefined ? {} : { data: body }),
      });
      const result = await response.json();
      assert.ok(response.ok(), `${method} ${path}: ${JSON.stringify(result)}`);
      return result.data;
    };
    const cat = await api("/api/gallery/categories", "POST", {
      name: "LED Screen Products",
    });
    const other = await api("/api/gallery/categories", "POST", {
      name: "Accessories & Components",
    });
    const dup = await page.request.post(base + "/api/gallery/categories", {
      headers: { Cookie: cookie },
      data: { name: "led screen products" },
    });
    assert.equal(dup.status(), 409);
    await page.getByRole("link", { name: "Gallery", exact: true }).click();
    await page.getByRole("link", { name: "Add Gallery Item" }).click();
    const png = readFileSync(
      "public/Images/bell-alarm/digital-school-bell.png",
    );
    await page.locator("input[type=file]").setInputFiles({
      name: "gallery-fixture.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByText("Images ready. Save to apply changes.").waitFor();
    await page
      .getByLabel("Title", { exact: true })
      .fill("Synthetic gallery fixture");
    await page
      .getByLabel("Caption", { exact: true })
      .fill("Product showcase photograph");
    await page
      .getByRole("combobox", { name: /^Category/ })
      .selectOption(cat.id);
    await page
      .getByLabel("Alternative text (describe the image)")
      .fill("LED display module product photograph");
    await page
      .getByRole("combobox", { name: /^Associated product/ })
      .selectOption(String(productId));
    await page
      .getByRole("button", { name: "Save as Draft", exact: true })
      .click();
    await page.waitForURL("**/admin/gallery?saved=1");
    const rows = await api("/api/gallery");
    let item = rows.rows.find(
      (x: { title: string }) => x.title === "Synthetic gallery fixture",
    );
    assert.ok(item);
    const id = item.id;
    const originalUrl = item.imageUrl;
    assert.equal((await fetch(base + `/gallery/${item.slug}`)).status, 404);
    assert.ok(
      !(await (await fetch(base + "/gallery")).text()).includes(
        "Synthetic gallery fixture",
      ),
    );
    pass("PNG upload and draft creation; public list and detail hide draft");
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    assert.equal(
      await page.getByLabel("Title", { exact: true }).inputValue(),
      "Synthetic gallery fixture",
    );
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.waitForURL("**/admin/gallery?saved=1");
    assert.ok(
      (await (await fetch(base + "/gallery")).text()).includes(
        "Synthetic gallery fixture",
      ),
    );
    await page.getByRole("button", { name: "Feature", exact: true }).click();
    await page
      .getByRole("button", { name: "Unfeature", exact: true })
      .waitFor();
    assert.ok(
      (await (await fetch(base)).text()).includes("Synthetic gallery fixture"),
    );
    const optimized = await fetch(
      base +
        "/_next/image?url=" +
        encodeURIComponent(originalUrl) +
        "&w=640&q=75",
    );
    assert.equal(optimized.status, 200);
    pass(
      "editing publishes, featuring updates homepage and MongoDB images optimize successfully",
    );
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await page
      .getByLabel("Title", { exact: true })
      .fill("Updated synthetic fixture");
    await page
      .getByLabel("Caption", { exact: true })
      .fill("Updated product caption");
    await page
      .getByRole("combobox", { name: /^Category/ })
      .selectOption(other.id);
    await page.locator("input[type=file]").setInputFiles({
      name: "replacement.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByText("Images ready. Save to apply changes.").waitFor();
    await page
      .getByRole("button", { name: "Save and publish", exact: true })
      .click();
    await page.waitForURL("**/admin/gallery?saved=1");
    item = await api(`/api/gallery/${id}`);
    assert.equal(item.caption, "Updated product caption");
    assert.equal(item.categoryId, other.id);
    assert.equal(item.productId, String(productId));
    assert.notEqual(item.imageUrl, originalUrl);
    assert.ok((await fetch(base + originalUrl)).ok);
    pass(
      "title, caption, category and image replacement preserve product reference and original asset",
    );
    await api(`/api/gallery/categories/${other.id}`, "PUT", {
      isActive: false,
    });
    await api(`/api/gallery/${id}`, "PUT", { sortOrder: 2 });
    assert.equal((await api(`/api/gallery/${id}`)).categoryId, other.id);
    pass(
      "deactivating category preserves association and still permits editing",
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/gallery?category=" + other.id);
      try {
        await page.waitForFunction(
          () =>
            Array.from(
              document.querySelectorAll<HTMLImageElement>("main article img"),
            ).every((i) => i.complete && i.naturalWidth > 0),
          undefined,
          { timeout: 10000 },
        );
      } catch (error) {
        console.log(
          "Image diagnostics",
          await page.locator("main article img").evaluateAll((images) =>
            images.map((i) => ({
              src: (i as HTMLImageElement).currentSrc,
              complete: (i as HTMLImageElement).complete,
              width: (i as HTMLImageElement).naturalWidth,
              box: i.getBoundingClientRect().toJSON(),
            })),
          ),
        );
        const imageSource = await page
          .locator("main article img")
          .first()
          .getAttribute("src");
        const imageResponse = await fetch(base + imageSource!, {
          headers: { Accept: "image/webp" },
        });
        console.log(
          "Node image response",
          imageResponse.status,
          imageResponse.headers.get("content-type"),
          Buffer.from(await imageResponse.arrayBuffer())
            .subarray(0, 100)
            .toString("hex"),
        );
        console.log(
          "CSP",
          (await fetch(base + "/gallery")).headers.get(
            "content-security-policy",
          ),
        );
        await page.screenshot({
          path: "/private/tmp/gallery-image-failure.png",
          fullPage: true,
        });
        throw error;
      }
      await page
        .getByRole("button", { name: "Enlarge Updated synthetic fixture" })
        .click();
      await page.getByRole("dialog").waitFor();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").isVisible(), false);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: `/private/tmp/gallery-public-${width}.png`,
      });
    }
    pass(
      "category filters and lightbox keyboard controls work on mobile and desktop",
    );
    await page.goto(base + "/gallery?category=" + cat.id);
    assert.equal(
      await page
        .getByRole("button", { name: "Enlarge Updated synthetic fixture" })
        .count(),
      0,
    );
    await page.goto(base + "/admin/gallery");
    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await page.getByRole("button", { name: "Publish", exact: true }).waitFor();
    assert.ok(
      !(await (await fetch(base + "/gallery")).text()).includes(
        "Updated synthetic fixture",
      ),
    );
    assert.ok(
      !(await (await fetch(base)).text()).includes("Updated synthetic fixture"),
    );
    assert.equal((await fetch(base + `/gallery/${item.slug}`)).status, 404);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await page.getByText(/archived ·/).waitFor();
    item = await api(`/api/gallery/${id}`);
    assert.equal(item.status, "archived");
    assert.equal(item.productId, String(productId));
    assert.ok((await fetch(base + item.imageUrl)).ok);
    assert.ok(
      await db
        .collection("galleryitems")
        .findOne({ _id: new Types.ObjectId(id) }),
    );
    pass(
      "unpublish hides list, detail and homepage; confirmed archive retains record and images",
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/admin/gallery");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: `/private/tmp/gallery-admin-${width}.png`,
      });
    }
    await page.goto(base + "/admin/gallery/new");
    const librarySelect = page.getByRole("combobox", {
      name: /^Select from image library/,
    });
    await librarySelect.selectOption(originalUrl);
    await librarySelect.selectOption(item.imageUrl);
    assert.equal(
      await page.getByRole("button", { name: /Remove image/ }).count(),
      2,
    );
    await page
      .getByRole("button", { name: "Remove image 1", exact: true })
      .click();
    assert.equal(
      await page.getByRole("button", { name: /Remove image/ }).count(),
      1,
    );
    await librarySelect.selectOption(originalUrl);
    await page
      .getByLabel("Title", { exact: true })
      .fill("Batch library fixture");
    await page
      .getByLabel("Alternative text (describe the image)")
      .fill("Synthetic library image");
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("link", { name: "Cancel", exact: true }).click();
    assert.ok(page.url().endsWith("/admin/gallery/new"));
    await page
      .getByRole("button", { name: "Save as Draft", exact: true })
      .click();
    await page.waitForURL("**/admin/gallery?saved=1");
    const batch = await api("/api/gallery?q=Batch");
    assert.equal(batch.total, 2);
    assert.equal(
      new Set(batch.rows.map((x: { imageUrl: string }) => x.imageUrl)).size,
      2,
    );
    pass(
      "library selection, removal, multiple-image creation and unsaved-change confirmation",
    );
    const fixture = await db
      .collection("galleryitems")
      .findOne({ _id: new Types.ObjectId(id) });
    const { _id, ...baseFixture } = fixture!;
    void _id;
    await db.collection("galleryitems").insertMany(
      Array.from({ length: 25 }, (_, i) => ({
        ...baseFixture,
        title: `Pagination fixture ${i}`,
        slug: `pagination-fixture-${i}`,
      })),
    );
    const firstPage = await api("/api/gallery");
    const secondPage = await api("/api/gallery?page=2");
    assert.equal(firstPage.rows.length, 24);
    assert.equal(secondPage.rows.length, 4);
    assert.equal(firstPage.total, 28);
    await page.goto(base + "/admin/gallery");
    await page.getByRole("link", { name: "Next →", exact: true }).click();
    await page.getByText("28 items · Page 2 of 2").waitFor();
    pass("collection API and management page paginate on the server");
    await page.goto(base + "/admin/products");
    await page
      .getByRole("heading", { name: /products/i })
      .first()
      .waitFor();
    assert.equal(await db.collection("products").countDocuments(), 1);
    pass("responsive admin and existing product management remain accessible");
    const invalid = await page.request.post(base + "/api/product-images", {
      headers: { "Content-Type": "image/png", Origin: base, Cookie: cookie },
      data: Buffer.from("not a PNG"),
    });
    assert.equal(invalid.status(), 400);
    const oversized = await page.request.post(base + "/api/product-images", {
      headers: { "Content-Type": "image/png", Origin: base, Cookie: cookie },
      data: Buffer.alloc(4 * 1024 * 1024 + 1),
    });
    assert.equal(oversized.status(), 413);
    pass("shared uploader rejects invalid signature and oversized files");
    assert.deepEqual(errors, []);
    pass("no browser runtime errors");
    writeFileSync(
      "/private/tmp/gallery-browser-results.json",
      JSON.stringify({ checks }, null, 2),
    );
  } finally {
    await browser?.close();
    server?.kill("SIGTERM");
    await mongoose.disconnect();
    await mongo.stop();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
