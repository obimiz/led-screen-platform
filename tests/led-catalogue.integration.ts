// Isolated MongoDB and synthetic image fixtures only. Never modifies application data.
import assert from "node:assert/strict";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:https";
import { request as proxyRequest } from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium, type Browser } from "@playwright/test";
import { hash } from "bcryptjs";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  const base = "https://localhost:3136",
    secret = "led-catalogue-test-secret-at-least-32-characters";
  let server: ChildProcess | undefined, browser: Browser | undefined;
  const certificateDirectory = mkdtempSync(
    path.join(tmpdir(), "led-admin-https-"),
  );
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      path.join(certificateDirectory, "key.pem"),
      "-out",
      path.join(certificateDirectory, "cert.pem"),
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
    ],
    { stdio: "ignore" },
  );
  const proxy = createServer(
    {
      key: readFileSync(path.join(certificateDirectory, "key.pem")),
      cert: readFileSync(path.join(certificateDirectory, "cert.pem")),
    },
    (incoming, outgoing) => {
      const upstream = proxyRequest(
        {
          hostname: "127.0.0.1",
          port: 3135,
          path: incoming.url,
          method: incoming.method,
          headers: {
            ...incoming.headers,
            "x-forwarded-proto": "https",
            "x-forwarded-host": "localhost:3136",
          },
        },
        (response) => {
          outgoing.writeHead(response.statusCode || 502, response.headers);
          response.pipe(outgoing);
        },
      );
      upstream.on("error", () => {
        outgoing.writeHead(502);
        outgoing.end();
      });
      incoming.pipe(upstream);
    },
  );
  // Native unauthenticated checks go directly to the HTTP upstream; browser traffic uses TLS.
  const fetch = (url: string, options?: RequestInit) =>
    globalThis.fetch(url.replace(base, "http://127.0.0.1:3135"), options);
  try {
    await mongoose.connect(mongo.getUri("led_catalogue_test"));
    const db = mongoose.connection.db!,
      adminId = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: adminId,
      role: "owner",
      name: "Test owner",
      email: "owner@example.test",
      isActive: true,
      sessionVersion: 0,
      passwordHash: await hash("ProductTest123!", 10),
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
    await db.collection("products").updateOne(
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
    await db.collection("products").updateOne(
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
    await new Promise<void>((resolve, reject) => {
      proxy.once("error", reject);
      proxy.listen(3136, "127.0.0.1", resolve);
    });
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
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
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
      const featured = page.locator("section").filter({
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
    await page.goto(base + "/admin/login");
    await page
      .getByLabel("Email address")
      .filter({ visible: true })
      .fill("owner@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .filter({ visible: true })
      .fill("ProductTest123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(base + "/admin");
    console.log("PASS: authorised administrator signs in using login form");
    assert.equal((await fetch(base + "/api/product-images")).status, 401);
    assert.equal(
      (
        await fetch(base + "/api/product-images", {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: "invalid",
        })
      ).status,
      401,
    );
    const library = await page.request.get(base + "/api/product-images");
    assert.equal(library.status(), 200);
    const png = readFileSync(
      "public/Images/bell-alarm/digital-school-bell.png",
    );
    const upload = await page.request.post(base + "/api/product-images", {
      headers: { "Content-Type": "image/png", "X-File-Name": "test.png" },
      data: png,
    });
    assert.equal(upload.status(), 201);
    const uploadedUrl = (await upload.json()).url;
    const retrieved = await fetch(base + uploadedUrl);
    assert.equal(retrieved.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await retrieved.arrayBuffer()), png);
    assert.equal(
      (
        await page.request.post(base + "/api/product-images", {
          headers: { "Content-Type": "image/png" },
          data: "fake PNG",
        })
      ).status(),
      400,
    );
    assert.equal(
      (
        await page.request.post(base + "/api/product-images", {
          headers: { "Content-Type": "image/svg+xml" },
          data: "<svg/>",
        })
      ).status(),
      415,
    );
    assert.equal(
      (
        await page.request.post(base + "/api/product-images", {
          headers: {
            "Content-Type": "image/png",
            Origin: "https://untrusted.test",
          },
          data: png,
        })
      ).status(),
      403,
    );
    console.log(
      "PASS: authenticated persistent uploads, public retrieval, library access, invalid files and cross-origin rejection",
    );
    const indoor = before.find((p) => p.slug === "indoor-led-display")!;
    // Reproduce the reported gallery-only association without changing genuine records.
    await db.collection("products").updateOne(
      { _id: indoor._id },
      {
        $set: {
          featuredImageUrl: "",
          imageUrls: [uploadedUrl, "/led-test-isolated.svg"],
          featured: true,
        },
      },
    );
    for (const route of [
      `/admin/products/${indoor._id}`,
      "/led-screens",
      `/led-screens/${indoor.slug}`,
      "/",
    ]) {
      await page.goto(base + route);
      await page.locator(`img[src="${uploadedUrl}"]`).first().waitFor();
      await page.locator(`img[src="${uploadedUrl}"]`).first().scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (url) =>
          Array.from(document.querySelectorAll<HTMLImageElement>("img")).some(
            (i) =>
              i.getAttribute("src") === url && i.complete && i.naturalWidth > 0,
          ),
        uploadedUrl,
      );
      if (route === `/led-screens/${indoor.slug}`)
        assert.equal(
          await page.locator('img[src="/led-test-isolated.svg"]').count(),
          1,
        );
    }
    assert.equal(
      (await db.collection("products").findOne({ _id: indoor._id }))
        ?.featuredImageUrl,
      "",
    );
    await db.collection("products").updateOne(
      { _id: indoor._id },
      {
        $set: {
          featuredImageUrl: indoor.featuredImageUrl,
          imageUrls: indoor.imageUrls,
          featured: indoor.featured,
        },
      },
    );
    console.log(
      "PASS: gallery-only image association renders in admin detail, public catalogue, detail, homepage and additional thumbnails without rewriting stored fields",
    );

    await page.goto(base + `/admin/products/${indoor._id}/edit`);
    await page
      .getByLabel("Featured image URL", { exact: true })
      .filter({ visible: true })
      .fill("/images/products/led-screens/indoor-led-screen.png");
    await page
      .getByLabel("Image presentation", { exact: true })
      .filter({ visible: true })
      .selectOption("contain");
    const save = page.getByRole("button", {
      name: "Save Product",
      exact: true,
    });
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
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("navigation", { name: "Admin navigation", exact: true })
      .getByRole("link", { name: "Products", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Add Product", exact: true })
      .first()
      .click();
    await page.waitForURL(base + "/admin/products/new");
    // Field validation catches an empty submission without creating records.
    const initialCount = await db.collection("products").countDocuments();
    await page
      .getByRole("button", { name: "Save as Draft", exact: true })
      .click();
    await page
      .getByText("Please correct the highlighted fields before saving.")
      .waitFor();
    assert.equal(
      await db.collection("products").countDocuments(),
      initialCount,
    );
    await page
      .getByLabel("Product name", { exact: true })
      .filter({ visible: true })
      .fill("Owner workflow display");
    const category = await db
      .collection("productcategories")
      .findOne({ productType: "led-screen" });
    await page
      .getByLabel("Category", { exact: true })
      .filter({ visible: true })
      .selectOption(String(category!._id));
    await page
      .getByLabel("Short description", { exact: true })
      .filter({ visible: true })
      .fill("Owner-managed LED display for indoor installations.");
    await page
      .getByLabel("Full description", { exact: true })
      .filter({ visible: true })
      .fill(
        "Owner-managed LED display with flexible specifications and persistent image uploads.",
      );
    await page
      .getByLabel("Price type", { exact: true })
      .filter({ visible: true })
      .selectOption("contact");
    await page
      .getByRole("button", { name: "Add specification", exact: true })
      .click();
    await page
      .getByLabel("Specification 1 label")
      .filter({ visible: true })
      .fill("Refresh rate");
    await page
      .getByLabel("Specification 1 value")
      .filter({ visible: true })
      .fill("3840 Hz");
    const uploaded = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/product-images") &&
        response.request().method() === "POST",
    );
    await page.locator('input[type="file"]').setInputFiles({
      name: "owner-workflow.png",
      mimeType: "image/png",
      buffer: png,
    });
    assert.equal((await uploaded).status(), 201);
    await page
      .getByText(
        "Image uploaded and selected as the featured image. Save the product to apply it.",
      )
      .waitFor();
    await page.waitForFunction(() => {
      const image = document.querySelector(
        'img[alt="Selected product image"]',
      ) as HTMLImageElement | null;
      return Boolean(image?.complete && image.naturalWidth);
    });
    const selectedUrl = await page
      .getByLabel("Select an existing image", { exact: true })
      .filter({ visible: true })
      .inputValue();
    assert.equal(
      await page
        .getByLabel("Featured image URL", { exact: true })
        .filter({ visible: true })
        .inputValue(),
      selectedUrl,
      "upload selects a featured image before saving",
    );
    await page
      .getByRole("button", { name: "Add to gallery", exact: true })
      .click();
    const createResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/products") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Save as Draft", exact: true })
      .click();
    const createdProduct = (await (await createResponse).json()).data;
    await page.waitForURL(
      base + `/admin/products/${createdProduct.id}?saved=1`,
    );
    await page.getByText("Product saved successfully as draft.").waitFor();
    assert.equal(
      (await fetch(base + `/api/products/${createdProduct.id}`)).status,
      404,
    );
    async function editAndSave(change: () => Promise<void>, draft = false) {
      await page.goto(base + `/admin/products/${createdProduct.id}/edit`);
      await change();
      const response = page.waitForResponse(
        (response) =>
          response.request().method() === "PUT" &&
          response.url().endsWith(`/api/products/${createdProduct.id}`),
      );
      await page
        .getByRole("button", {
          name: draft ? "Save as Draft" : "Save Product",
          exact: true,
        })
        .click();
      assert.equal((await response).status(), 200);
      await page.waitForURL(
        base + `/admin/products/${createdProduct.id}?saved=1`,
      );
    }
    await editAndSave(async () => {
      await page
        .getByLabel("Publication status", { exact: true })
        .filter({ visible: true })
        .selectOption("published");
    });
    await page.goto(base + "/led-screens?search=Owner%20workflow");
    await page
      .getByRole("link", { name: "Owner workflow display", exact: true })
      .waitFor();
    await page.goto(base + `/led-screens/${createdProduct.slug}`);
    await page
      .getByRole("heading", { name: "Owner workflow display", exact: true })
      .waitFor();
    assert.equal(await page.locator(`img[src="${selectedUrl}"]`).count(), 1);
    await editAndSave(async () => {
      await page
        .getByLabel("Featured product", { exact: true })
        .filter({ visible: true })
        .check();
    });
    await page.goto(base + "/");
    await page
      .getByRole("link", { name: "Owner workflow display", exact: true })
      .waitFor();
    await editAndSave(async () => {
      await page
        .getByLabel("Product name", { exact: true })
        .filter({ visible: true })
        .fill("Owner updated display");
      await page
        .getByLabel("Full description", { exact: true })
        .filter({ visible: true })
        .fill(
          "Updated display details saved by the business owner without developer assistance.",
        );
      await page
        .getByLabel("Price type", { exact: true })
        .filter({ visible: true })
        .selectOption("fixed");
      await page
        .getByLabel("Price", { exact: true })
        .filter({ visible: true })
        .fill("123456");
    });
    await page.goto(base + `/led-screens/${createdProduct.slug}`);
    await page
      .getByRole("heading", { name: "Owner updated display", exact: true })
      .waitFor();
    assert.ok((await page.locator("main").innerText()).includes("123,456"));
    assert.ok(
      (await page.locator("main").innerText()).includes(
        "Updated display details",
      ),
    );
    await editAndSave(async () => {
      await page
        .getByLabel("Select an existing image", { exact: true })
        .filter({ visible: true })
        .selectOption(uploadedUrl);
      await page
        .getByRole("button", { name: "Use as featured image", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Remove Additional image URLs item 1",
          exact: true,
        })
        .click();
    });
    const replaced = await db
      .collection("products")
      .findOne({ _id: new Types.ObjectId(createdProduct.id) });
    assert.equal(replaced?.featuredImageUrl, uploadedUrl);
    assert.deepEqual(replaced?.imageUrls, []);
    await editAndSave(async () => {
      await page
        .getByRole("button", { name: "Remove featured image", exact: true })
        .click();
      assert.equal(
        await page
          .getByLabel("Featured image URL", { exact: true })
          .filter({ visible: true })
          .inputValue(),
        "",
      );
      await page
        .getByLabel("Select an existing image", { exact: true })
        .filter({ visible: true })
        .selectOption(selectedUrl);
      await page
        .getByRole("button", { name: "Use as featured image", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Add to gallery", exact: true })
        .click();
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(base + `/admin/products/${createdProduct.id}/edit`);
    await page
      .getByLabel("Product name", { exact: true })
      .filter({ visible: true })
      .fill("Unsaved test change");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("link", { name: "View site", exact: true }).click();
    assert.ok(page.url().endsWith("/edit"));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("link", { name: "View site", exact: true }).click();
    await page.waitForURL(base + "/");
    assert.equal(
      (
        await db
          .collection("products")
          .findOne({ _id: new Types.ObjectId(createdProduct.id) })
      )?.name,
      "Owner updated display",
    );
    console.log(
      "PASS: library image replacement/removal, tablet form layout and unsaved navigation cancellation",
    );
    // Unpublishing removes a product from public detail and catalogue, without erasing fields.
    await editAndSave(async () => {}, true);
    assert.equal(
      (await fetch(base + `/api/products/${createdProduct.id}`)).status,
      404,
    );
    await editAndSave(async () => {
      await page
        .getByLabel("Publication status", { exact: true })
        .filter({ visible: true })
        .selectOption("published");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/admin/products");
    await page.getByRole("button", { name: "Open admin navigation" }).click();
    await page
      .getByRole("navigation", { name: "Admin mobile navigation", exact: true })
      .getByRole("link", { name: "Products", exact: true })
      .click();
    await page
      .getByLabel("Search products", { exact: true })
      .filter({ visible: true })
      .fill("Owner updated display");
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    const row = page
      .getByRole("row")
      .filter({ hasText: "Owner updated display" });
    await row.waitFor();
    page.once("dialog", (dialog) => dialog.dismiss());
    await row.getByRole("button", { name: "Archive", exact: true }).click();
    assert.equal(
      (await fetch(base + `/api/products/${createdProduct.id}`)).status,
      200,
    );
    page.once("dialog", (dialog) => dialog.accept());
    const archiveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().endsWith(`/api/products/${createdProduct.id}`),
    );
    await row.getByRole("button", { name: "Archive", exact: true }).click();
    assert.equal((await archiveResponse).status(), 200);
    assert.equal(
      (await fetch(base + `/api/products/${createdProduct.id}`)).status,
      404,
    );
    await page.goto(base + "/led-screens?search=Owner%20updated");
    assert.equal(
      await page
        .getByRole("link", { name: "Owner updated display", exact: true })
        .count(),
      0,
    );
    await page.goto(base + "/");
    assert.equal(
      await page
        .getByRole("link", { name: "Owner updated display", exact: true })
        .count(),
      0,
    );
    const historical = await db
      .collection("products")
      .findOne({ _id: new Types.ObjectId(createdProduct.id) });
    assert.equal(
      (await fetch(base + `/led-screens/${createdProduct.slug}`)).status,
      404,
    );
    assert.equal(historical?.status, "archived");
    assert.equal(historical?.featuredImageUrl, selectedUrl);
    assert.deepEqual(historical?.imageUrls, [selectedUrl]);
    assert.deepEqual(historical?.specifications, [
      { label: "Refresh rate", value: "3840 Hz" },
    ]);
    assert.equal(
      await db.collection("products").countDocuments(),
      initialCount + 1,
    );
    console.log(
      "PASS: browser navigation, validation, PNG upload, draft, publish, public detail/catalogue, feature/homepage, edits, unpublish, mobile search, archive confirmation and retained history",
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    proxy.closeAllConnections();
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
    rmSync(certificateDirectory, { recursive: true, force: true });
    server?.kill("SIGTERM");
    await mongoose.disconnect();
    await mongo.stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
