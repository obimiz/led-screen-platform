// Disposable MongoDB and test-only records. No production credentials or records are used.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { chromium, type Browser } from "@playwright/test";
import { SignJWT } from "jose";
import sharp from "sharp";
import {
  homepageSectionDefaults,
  defaultHomepageHeroSettings,
  homepageSectionFallbacks,
} from "../src/lib/constants/homepage";
import { defaultHomepageAccessorySettings } from "../src/lib/constants/homepage-accessories";
import { defaultBellPage } from "../src/lib/validations/bell-page";
async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined, browser: Browser | undefined;
  const base = "http://127.0.0.1:3168",
    secret = "isolated-redesign-test-secret-32-characters";
  let checks = 0,
    logs = "";
  const pass = (s: string) => console.log(`PASS ${++checks}: ${s}`);
  try {
    await mongoose.connect(mongo.getUri("redesign_test"));
    const db = mongoose.connection.db!,
      adminId = new Types.ObjectId(),
      accessoryCategory = new Types.ObjectId(),
      bellCategory = new Types.ObjectId(),
      ledCategory = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: adminId,
      name: "Test owner",
      email: "owner@example.test",
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    await db.collection("productcategories").insertMany([
      {
        _id: accessoryCategory,
        name: "Test accessories",
        slug: "test-accessories",
        productType: "led-accessory",
        active: true,
      },
      {
        _id: bellCategory,
        name: "Test bell systems",
        slug: "test-bells",
        productType: "bell-alarm-system",
        active: true,
      },
      {
        _id: ledCategory,
        name: "Test LED screens",
        slug: "test-led",
        productType: "led-screen",
        active: true,
      },
    ]);
    await db.collection("businesssettings").insertOne({
      singletonKey: "primary",
      businessName: "Test business",
      primaryPhone: "2348039308982",
    });
    const originalSettings = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    // Reproduce a live dev server retaining a model compiled before copy fields existed.
    const cachedSettings = mongoose.model(
      "BusinessSettings",
      new mongoose.Schema({ singletonKey: String, businessName: String }),
    );
    const { BusinessSettingsModel } =
      await import("../src/models/business-settings");
    assert.equal(BusinessSettingsModel, cachedSettings);
    const cachedCopy = {
      homepageHero: {
        heading: "Cached-model hero",
        headingTwo: "Cached second heading",
        description: "Persisted through a reused development model.",
      },
      homepageAccessories: {
        heading: "Cached-model accessories",
        description: "Accessory copy also persists through the reused model.",
      },
    };
    const cachedSaved = await BusinessSettingsModel.findOneAndUpdate(
      { singletonKey: "cached-schema-regression" },
      {
        $set: cachedCopy,
        $setOnInsert: { businessName: "Isolated cached-schema test" },
      },
      { upsert: true, runValidators: true, returnDocument: "after" },
    ).lean();
    assert.deepEqual(cachedSaved?.homepageHero, cachedCopy.homepageHero);
    assert.deepEqual(
      cachedSaved?.homepageAccessories,
      cachedCopy.homepageAccessories,
    );
    const persistedCachedCopy = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "cached-schema-regression" });
    assert.deepEqual(
      persistedCachedCopy?.homepageHero,
      cachedCopy.homepageHero,
    );
    pass(
      "Reused pre-feature Mongoose models persist hero and accessory copy to MongoDB without a server restart",
    );

    const token = await new SignJWT({ sessionVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(adminId))
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    const cookie = `led_admin_session=${token}`;
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-H",
        "127.0.0.1",
        "-p",
        "3168",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("redesign_test"),
          AUTH_SECRET: secret,
          NEXT_PUBLIC_APP_URL: base,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", (d) => (logs += String(d)));
    server.stderr?.on("data", (d) => (logs += String(d)));
    let ready = false;
    for (let i = 0; i < 90; i++) {
      try {
        if ((await fetch(base + "/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(500);
    }
    assert.ok(ready, logs);
    async function api(
      path: string,
      body: unknown,
      method = "POST",
      auth = true,
    ) {
      return fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: base,
          ...(auth ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
      });
    }
    const emptyHome = await (await fetch(base)).text();
    assert.match(emptyHome, /id="electronic-digital-bell"/);
    assert.match(emptyHome, /id="led-screen-cameras"/);
    assert.match(emptyHome, /id="blog"/);
    assert.match(emptyHome, /id="accessories"/);
    assert.match(emptyHome, /View All Articles/);
    assert.match(emptyHome, /Explore Bell &amp; Alarm/);
    assert.match(emptyHome, /Enquire About Live Video Solutions/);
    assert.match(emptyHome, /LED Modules/);
    assert.match(emptyHome, /Video Processors/);
    assert.match(emptyHome, /Receiving Cards &amp; Controllers/);
    const emptyAccessorySection = emptyHome
      .split('id="accessories"')[1]
      ?.split("</section>")[0];
    assert.equal(emptyAccessorySection?.match(/<article\b/g)?.length, 3);
    pass(
      "Bell, camera and blog homepage sections remain visible without published records",
    );
    const product = {
      name: "Isolated accessory",
      productType: "led-accessory",
      category: String(accessoryCategory),
      shortDescription: "Isolated accessory short description",
      description:
        "Isolated accessory detailed description used only in tests.",
      stockStatus: "in-stock",
      priceType: "fixed",
      price: 125000,
      promotionalPrice: 100000,
      status: "published",
      featured: true,
    };
    assert.equal(
      (await api("/api/products", product, "POST", false)).status,
      401,
    );
    assert.equal(
      (
        await api(
          "/api/electronic-bell",
          { action: "publish", content: defaultBellPage },
          "PUT",
          false,
        )
      ).status,
      401,
    );
    assert.equal((await fetch(base + "/api/product-images")).status, 401);
    assert.equal(
      (await api("/api/settings/homepage-images", {}, "PUT", false)).status,
      401,
    );
    pass("Unauthenticated product, page publishing and library access denied");
    assert.equal(
      (await api("/api/products", { ...product, promotionalPrice: 130000 }))
        .status,
      422,
    );
    assert.equal(
      (await api("/api/products", { ...product, price: -1 })).status,
      422,
    );
    assert.equal(
      (
        await api("/api/products", {
          ...product,
          featuredImageUrl: "/api/product-images/507f1f77bcf86cd799439011",
        })
      ).status,
      400,
    );
    pass("Invalid prices and missing media references rejected by API");
    const corrupt = await fetch(base + "/api/product-images", {
      method: "POST",
      headers: { Cookie: cookie, Origin: base, "Content-Type": "image/png" },
      body: new Uint8Array([
        137,
        80,
        78,
        71,
        13,
        10,
        26,
        10,
        ...Array(20).fill(0),
      ]),
    });
    assert.equal(corrupt.status, 400);
    pass("Corrupt image pixels rejected after signature validation");
    const image = await sharp({
      create: { width: 32, height: 24, channels: 3, background: "#28146b" },
    })
      .png()
      .toBuffer();
    const imageResponse = await fetch(base + "/api/product-images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: base,
        "Content-Type": "image/png",
        "X-File-Name": "test-only.png",
      },
      body: new Uint8Array(image),
    });
    assert.equal(imageResponse.status, 201);
    const imageUrl = (await imageResponse.json()).url;
    const imageRead = await fetch(base + imageUrl);
    assert.equal(imageRead.status, 200);
    assert.deepEqual(Buffer.from(await imageRead.arrayBuffer()), image);
    pass("Uploaded image bytes persist in existing MongoDB image collection");
    const create = await api("/api/products", {
      ...product,
      featuredImageUrl: imageUrl,
      imageAlt: "Test image",
      imageUrls: [imageUrl],
    });
    assert.equal(create.status, 201, await create.clone().text());
    const accessory = (await create.json()).data;
    for (let i = 1; i <= 4; i++) {
      const extra = await api("/api/products", {
        ...product,
        name: `Isolated homepage accessory ${i}`,
        featured: i <= 2,
        featuredImageUrl: imageUrl,
      });
      assert.equal(extra.status, 201);
    }
    for (const status of ["draft", "archived"])
      assert.equal(
        (
          await api("/api/products", {
            ...product,
            name: `Hidden ${status} accessory`,
            status,
            featuredImageUrl: imageUrl,
          })
        ).status,
        201,
      );
    const cameraRes = await api("/api/products", {
      ...product,
      name: "Isolated camera",
      showcase: "camera",
      priceType: "quote",
      price: null,
      promotionalPrice: null,
      featuredImageUrl: imageUrl,
    });
    assert.equal(cameraRes.status, 201);
    const camera = (await cameraRes.json()).data;
    const bellRes = await api("/api/products", {
      ...product,
      name: "Isolated bell",
      productType: "bell-alarm-system",
      category: String(bellCategory),
      featuredImageUrl: imageUrl,
    });
    assert.equal(bellRes.status, 201, await bellRes.clone().text());
    const bell = (await bellRes.json()).data;
    pass(
      "Accessories, cameras and bells share Product collection, pricing and media",
    );
    await db.collection("products").insertOne({
      ...product,
      name: "Existing test LED screen",
      slug: "existing-test-led",
      category: ledCategory,
      productType: "led-screen",
      indoorOutdoor: "indoor",
      featuredImageUrl: imageUrl,
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("galleryitems").insertOne({
      title: "Existing test gallery",
      slug: "existing-test-gallery",
      status: "published",
      featured: true,
      mediaType: "image",
      imageUrl,
      thumbnailUrl: imageUrl,
      altText: "Test photograph",
    });
    await db.collection("clientorganisations").insertOne({
      name: "Existing test organisation",
      slug: "existing-test-organisation",
      active: true,
      featured: true,
      displayOrder: 1,
    });
    const existingLed = await db
      .collection("products")
      .findOne({ slug: "existing-test-led" });

    // Test featured and recent article ordering, and preservation of existing records.
    const now = new Date();
    await db.collection("portfolioprojects").insertMany([
      {
        title: "Existing test project",
        slug: "existing-test-project",
        contentType: "project",
        projectStatus: "completed",
        status: "published",
        featured: true,
        createdAt: now,
        shortDescription: "Test completed project",
      },
      {
        title: "Featured isolated article",
        slug: "featured-isolated-article",
        contentType: "article",
        status: "published",
        featured: true,
        publishedAt: new Date("2020-01-01"),
        createdAt: now,
        shortDescription: "Article fixture",
      },
      {
        title: "Recent isolated article",
        slug: "recent-isolated-article",
        contentType: "article",
        status: "published",
        featured: false,
        publishedAt: now,
        createdAt: now,
        shortDescription: "Article fixture",
      },
      {
        title: "Hidden isolated article",
        slug: "hidden-isolated-article",
        contentType: "article",
        status: "draft",
        featured: true,
        createdAt: now,
      },
    ]);
    const beforeDraft = await (
      await fetch(base + "/electronic-bell-alarm")
    ).text();
    assert.ok(beforeDraft.includes(defaultBellPage.heading));
    const draft = {
      ...defaultBellPage,
      heading: "Isolated draft bell heading",
      heroImage: imageUrl,
      heroAlt: "Test hero",
      coverImageUrl: imageUrl,
      imageUrls: [imageUrl],
      imageAlts: ["Page informational photograph"],
    };
    assert.equal(
      (
        await api(
          "/api/electronic-bell",
          { action: "draft", content: draft },
          "PUT",
        )
      ).status,
      200,
    );
    const liveDraft = await (
      await fetch(base + "/electronic-bell-alarm")
    ).text();
    assert.ok(!liveDraft.includes("Isolated draft bell heading"));
    const preview = await fetch(base + "/admin/electronic-bell/preview", {
      headers: { Cookie: cookie },
    });
    assert.equal(preview.status, 200);
    assert.ok((await preview.text()).includes(draft.heading));
    assert.equal(
      (
        await api(
          "/api/electronic-bell",
          { action: "publish", content: { ...draft, heading: "" } },
          "PUT",
        )
      ).status,
      422,
    );
    assert.equal(
      (
        await api(
          "/api/electronic-bell",
          { action: "publish", content: draft },
          "PUT",
        )
      ).status,
      200,
    );
    assert.ok(
      (await (await fetch(base + "/electronic-bell-alarm")).text()).includes(
        draft.heading,
      ),
    );
    const afterSettings = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    assert.equal(afterSettings?.businessName, originalSettings?.businessName);
    pass(
      "Draft, authenticated preview, validated publish and existing business settings preservation",
    );
    const chrome =
      process.env.IGT_TEST_BROWSER ||
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
    console.log("Starting browser checks");
    browser = await chromium.launch({
      timeout: 30000,
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
      args: ["--no-sandbox"],
    });
    const context = await browser.newContext();
    await context.addCookies([
      { name: "led_admin_session", value: token, url: base },
    ]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    console.log("Browser ready");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const bellCategoryValues = {
      name: "Test bell systems",
      productType: "bell-alarm-system",
      active: false,
      sortOrder: 20,
    };
    assert.equal(
      (
        await api(
          `/api/product-categories/${bellCategory}`,
          bellCategoryValues,
          "PUT",
        )
      ).status,
      200,
    );
    await page.goto(base + "/admin/bell-alarm/products/new");
    assert.equal(
      await page
        .getByRole("navigation", { name: "Admin navigation", exact: true })
        .getByRole("link", { name: "Bell & Alarm Categories", exact: true })
        .getAttribute("href"),
      "/admin/bell-alarm/categories",
    );
    await page
      .getByText("No active categories are available", { exact: false })
      .filter({ visible: true })
      .waitFor();
    assert.ok(
      await page
        .getByRole("button", { name: "Save product", exact: true })
        .isDisabled(),
    );
    await page
      .getByRole("link", { name: "Create Category", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("heading", { name: "New category", exact: true })
      .waitFor();
    assert.match(page.url(), /productType=bell-alarm-system/);
    await page
      .getByLabel("Name", { exact: true })
      .filter({ visible: true })
      .fill("Horn Speakers");
    await page
      .getByLabel("Sort order", { exact: true })
      .filter({ visible: true })
      .fill("5");
    await page
      .getByRole("button", { name: "Save category", exact: true })
      .click();
    const hornRow = page
      .getByRole("row")
      .filter({ hasText: "Horn Speakers" })
      .filter({ visible: true });
    await hornRow.waitFor();
    const hornCategory = await db
      .collection("productcategories")
      .findOne({ name: "Horn Speakers", productType: "bell-alarm-system" });
    assert.ok(hornCategory?.active);
    await hornRow.getByRole("button", { name: "Edit", exact: true }).click();
    await page
      .getByLabel("Active", { exact: true })
      .filter({ visible: true })
      .uncheck();
    await page
      .getByLabel("Sort order", { exact: true })
      .filter({ visible: true })
      .fill("1");
    await page
      .getByRole("button", { name: "Save category", exact: true })
      .click();
    await hornRow.getByText("Inactive", { exact: true }).waitFor();
    await hornRow.getByRole("button", { name: "Edit", exact: true }).click();
    await page
      .getByLabel("Active", { exact: true })
      .filter({ visible: true })
      .check();
    await page
      .getByRole("button", { name: "Save category", exact: true })
      .click();
    await hornRow.getByText("Active", { exact: true }).waitFor();
    assert.equal(
      (
        await db
          .collection("productcategories")
          .findOne({ _id: hornCategory._id })
      )?.sortOrder,
      1,
    );
    assert.equal(
      (
        await api(
          `/api/product-categories/${bellCategory}`,
          { ...bellCategoryValues, active: true },
          "PUT",
        )
      ).status,
      200,
    );
    await page.goto(base + "/admin/bell-alarm/products/new");
    const bellSelect = page
      .getByLabel("Category", { exact: true })
      .filter({ visible: true });
    await bellSelect.selectOption(String(hornCategory._id));
    const options = await bellSelect.locator("option").allTextContents();
    assert.deepEqual(options, [
      "Choose category",
      "Horn Speakers",
      "Test bell systems",
    ]);
    await page
      .getByLabel("Product name", { exact: true })
      .filter({ visible: true })
      .fill("Horn Speaker");
    await page
      .getByLabel("Short description", { exact: true })
      .filter({ visible: true })
      .fill("Isolated horn speaker description");
    await page
      .getByLabel("Detailed description", { exact: true })
      .filter({ visible: true })
      .fill(
        "Isolated horn speaker product used only for browser verification.",
      );
    await page
      .getByLabel("Upload cover image", { exact: true })
      .filter({ visible: true })
      .setInputFiles({
        name: "horn-speaker.png",
        mimeType: "image/png",
        buffer: image,
      });
    await page
      .getByText("Images uploaded.", { exact: false })
      .filter({ visible: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Save product", exact: true })
      .click();
    await page.waitForURL(base + "/admin/bell-alarm/products");
    const horn = await db
      .collection("products")
      .findOne({ name: "Horn Speaker" });
    assert.ok(horn);
    assert.equal(String(horn.category), String(hornCategory._id));
    assert.equal(horn.status, "draft");
    assert.ok(horn.featuredImageUrl.startsWith("/api/product-images/"));
    await page.goto(base + `/admin/bell-alarm/products/${horn._id}/edit`);
    assert.equal(
      await page
        .getByLabel("Category", { exact: true })
        .filter({ visible: true })
        .inputValue(),
      String(hornCategory._id),
    );
    await page
      .locator("label")
      .filter({ hasText: /^status/ })
      .locator("select")
      .filter({ visible: true })
      .selectOption("published");
    await page
      .getByRole("button", { name: "Save product", exact: true })
      .click();
    await page.waitForURL(base + "/admin/bell-alarm/products");
    const publishedHorn = await db
      .collection("products")
      .findOne({ _id: horn._id });
    assert.equal(publishedHorn?.status, "published");
    assert.equal(publishedHorn?.featuredImageUrl, horn.featuredImageUrl);
    const publicHorn = await (
      await fetch(base + `/electronic-bell-alarm/products/${horn.slug}`)
    ).text();
    assert.match(publicHorn, /Horn Speaker/);
    assert.ok(publicHorn.includes(horn.featuredImageUrl));
    for (const category of [
      String(ledCategory),
      String(accessoryCategory),
      String(new Types.ObjectId()),
    ]) {
      const rejected = await api("/api/products", {
        ...product,
        name: "Invalid category bell",
        productType: "bell-alarm-system",
        category,
      });
      assert.equal(rejected.status, 400);
      assert.equal(
        (
          await api(
            `/api/products/${horn._id}`,
            {
              ...product,
              name: "Horn Speaker",
              productType: "bell-alarm-system",
              category,
              featuredImageUrl: horn.featuredImageUrl,
            },
            "PUT",
          )
        ).status,
        400,
      );
    }
    const inactiveCategory = await api("/api/product-categories", {
      name: "Inactive bell category",
      productType: "bell-alarm-system",
      active: false,
    });
    const inactiveId = (await inactiveCategory.json()).data.id;
    assert.equal(
      (
        await api("/api/products", {
          ...product,
          name: "Inactive category bell",
          productType: "bell-alarm-system",
          category: inactiveId,
        })
      ).status,
      400,
    );
    const unchangedHorn = await db
      .collection("products")
      .findOne({ _id: horn._id });
    assert.equal(String(unchangedHorn?.category), String(hornCategory._id));
    assert.equal(unchangedHorn?.featuredImageUrl, horn.featuredImageUrl);
    assert.equal(
      (await db.collection("productcategories").findOne({ _id: ledCategory }))
        ?.productType,
      "led-screen",
    );
    assert.equal(
      (
        await db
          .collection("productcategories")
          .findOne({ _id: accessoryCategory })
      )?.productType,
      "led-accessory",
    );
    pass(
      "Bell categories create/edit/activate/order; Horn Speaker saves and publishes with its selected category and uploaded featured image; wrong and inactive categories are rejected",
    );
    await page.goto(base + "/admin/accessories/new");
    console.log("Accessory form ready");
    await page
      .getByLabel("Product name", { exact: true })
      .filter({ visible: true })
      .fill("Browser accessory fixture");
    await page
      .getByLabel("Category", { exact: true })
      .filter({ visible: true })
      .selectOption(String(accessoryCategory));
    await page
      .getByLabel("Short description", { exact: true })
      .filter({ visible: true })
      .fill("Browser accessory short description");
    await page
      .getByLabel("Description", { exact: true })
      .filter({ visible: true })
      .fill("Browser accessory detailed description for integration tests.");
    const dimensions = [
      [1200, 300],
      [300, 1200],
      [600, 600],
    ];
    const photographs = await Promise.all(
      dimensions.map(async ([width, height], i) => ({
        name: `accessory-shape-${i}.png`,
        mimeType: "image/png",
        buffer: await sharp({
          create: {
            width,
            height,
            channels: 3,
            background: ["#28146b", "#84c221", "#dd2421"][i],
          },
        })
          .png()
          .toBuffer(),
      })),
    );
    // Upload a batch with wide, tall/PTZ-shaped and square images.
    await page
      .getByLabel("Upload additional photographs")
      .filter({ visible: true })
      .setInputFiles(photographs);
    await page
      .getByText("Images uploaded.", { exact: false })
      .filter({ visible: true })
      .waitFor();
    await page
      .locator('select[name="priceType"]')
      .filter({ visible: true })
      .selectOption("quote");
    await page.getByRole("button", { name: "Save accessory" }).click();
    await page.waitForURL(/\/admin\/accessories\/[a-f0-9]{24}$/);
    const saved = await db
      .collection("products")
      .findOne({ name: "Browser accessory fixture" });
    assert.ok(saved?.featuredImageUrl?.startsWith("/api/product-images/"));
    assert.ok(saved?.imageUrls.includes(saved.featuredImageUrl));
    pass(
      "Browser form bulk upload auto-selects first featured image and persists after save",
    );
    assert.equal(saved?.imageUrls.length, 3);
    assert.equal(saved?.featuredImageUrl, saved?.imageUrls[0]);
    const originalImages = [...saved!.imageUrls] as string[];
    await page.goto(base + `/admin/accessories/${saved!._id}/edit`);
    await page
      .getByLabel("Photograph 1 alternative text", { exact: true })
      .filter({ visible: true })
      .fill("Wide accessory photograph");
    await page
      .getByLabel("Photograph 2 alternative text", { exact: true })
      .filter({ visible: true })
      .fill("Tall PTZ camera photograph");
    await page
      .getByLabel("Photograph 3 alternative text", { exact: true })
      .filter({ visible: true })
      .fill("Square accessory photograph");
    await page
      .getByRole("button", {
        name: "Set photograph 2 as featured",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Move photograph 3 earlier", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove photograph 1", exact: true })
      .click();
    await page
      .getByLabel("Existing image library")
      .filter({ visible: true })
      .selectOption(originalImages[0]);
    await page
      .getByRole("button", { name: "Add to photographs", exact: true })
      .click();
    await page
      .getByLabel("Photograph 3 alternative text", { exact: true })
      .filter({ visible: true })
      .fill("Wide accessory photograph");
    await page
      .getByRole("button", { name: "Move photograph 3 earlier", exact: true })
      .click();
    await page
      .getByLabel("Status", { exact: true })
      .filter({ visible: true })
      .selectOption("published");
    await page
      .getByRole("button", { name: "Save accessory", exact: true })
      .click();
    await page.waitForURL(base + `/admin/accessories/${saved!._id}`);
    const galleryProduct = await db
      .collection("products")
      .findOne({ _id: saved!._id });
    assert.deepEqual(galleryProduct?.imageUrls, [
      originalImages[2],
      originalImages[0],
      originalImages[1],
    ]);
    assert.deepEqual(galleryProduct?.imageAlts, [
      "Square accessory photograph",
      "Wide accessory photograph",
      "Tall PTZ camera photograph",
    ]);
    assert.equal(galleryProduct?.featuredImageUrl, originalImages[1]);
    assert.equal(galleryProduct?.imageAlt, "Tall PTZ camera photograph");
    await page.goto(base + `/admin/accessories/${saved!._id}/edit`);
    await page.reload();
    assert.equal(
      await page
        .getByLabel("Cover alternative text", { exact: true })
        .filter({ visible: true })
        .inputValue(),
      "Tall PTZ camera photograph",
    );
    assert.equal(
      await page
        .getByLabel("Photograph 1 alternative text", { exact: true })
        .filter({ visible: true })
        .inputValue(),
      "Square accessory photograph",
    );
    assert.equal(
      await page
        .getByRole("button", {
          name: "Set photograph 3 as featured",
          exact: true,
        })
        .getAttribute("aria-pressed"),
      "true",
    );
    pass(
      "Multiple uploads, featured selection, removal, library reuse, ordering and alt text persist after saving and refreshing",
    );

    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + `/led-accessories/${galleryProduct!.slug}`);
      const gallery = page.getByRole("region", {
        name: "Browser accessory fixture image gallery",
        exact: true,
      });
      const primary = gallery.getByRole("button", {
        name: "Enlarge product image",
        exact: true,
      });
      const primaryImage = primary.getByRole("img");
      await primaryImage.waitFor();
      await primaryImage.evaluate(async (element) => {
        const img = element as HTMLImageElement;
        if (!img.complete)
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
          });
      });
      assert.equal(await primaryImage.getAttribute("src"), originalImages[1]);
      const fitting = await primaryImage.evaluate((img) => ({
        fit: getComputedStyle(img).objectFit,
        ratio:
          img.parentElement!.getBoundingClientRect().width /
          img.parentElement!.getBoundingClientRect().height,
        loaded: (img as HTMLImageElement).naturalWidth > 0,
      }));
      assert.equal(fitting.fit, "contain");
      assert.ok(Math.abs(fitting.ratio - 4 / 3) < 0.02);
      assert.ok(fitting.loaded);
      await gallery
        .getByRole("button", { name: "Show product image 2", exact: true })
        .click();
      assert.equal(await primaryImage.getAttribute("src"), originalImages[2]);
      await page.keyboard.press("ArrowRight");
      assert.equal(await primaryImage.getAttribute("src"), originalImages[0]);
      await gallery
        .getByRole("button", { name: "Previous image", exact: false })
        .click();
      assert.equal(await primaryImage.getAttribute("src"), originalImages[2]);
      await primary.click();
      const viewer = page.getByRole("dialog", {
        name: "Browser accessory fixture enlarged image",
        exact: true,
      });
      await viewer.waitFor();
      await viewer
        .getByRole("button", { name: "Next image", exact: false })
        .click();
      assert.equal(
        await viewer.getByRole("img").getAttribute("src"),
        originalImages[0],
      );
      await page.keyboard.press("ArrowLeft");
      assert.equal(
        await viewer.getByRole("img").getAttribute("src"),
        originalImages[2],
      );
      await page.keyboard.press("Escape");
      assert.equal(await viewer.isVisible(), false);
      await primary.evaluate((button) => {
        for (const [type, x] of [
          ["touchstart", 220],
          ["touchend", 40],
        ] as const) {
          const event = new Event(type, { bubbles: true });
          Object.defineProperty(event, "changedTouches", {
            value: [{ clientX: x, clientY: 100 }],
          });
          button.dispatchEvent(event);
        }
      });
      await page.waitForFunction(
        (url) =>
          document
            .querySelector('button[aria-label="Enlarge product image"] img')
            ?.getAttribute("src") === url,
        originalImages[0],
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await page.goto(base + `/led-accessories/${accessory.slug}`);
    const singleGallery = page.getByRole("region", {
      name: `${product.name} image gallery`,
      exact: true,
    });
    assert.equal(
      await singleGallery
        .getByRole("button", {
          name: /Show product image|Next image|Previous image/,
        })
        .count(),
      0,
    );
    await singleGallery
      .getByRole("button", { name: "Enlarge product image", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Close image viewer", exact: true })
      .click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/led-accessories");
    const cameraCard = page
      .locator("article")
      .filter({
        has: page.getByRole("heading", {
          name: "Isolated camera",
          exact: true,
        }),
      })
      .filter({ visible: true });
    await cameraCard.getByRole("img").scrollIntoViewIfNeeded();
    assert.equal(
      await cameraCard
        .getByRole("img")
        .evaluate((img) => getComputedStyle(img).objectFit),
      "contain",
    );
    pass(
      "Accessory gallery supports thumbnails, keyboard, next/previous, enlarged viewing and simulated mobile swipes at three viewport sizes; single-image controls are hidden and catalogue images contain-fit",
    );
    for (let i = 0; i < 3; i++) {
      const response = await api("/api/products", {
        ...product,
        name:
          i === 1
            ? "Alignment product with a considerably longer descriptive title"
            : `Alignment product ${i}`,
        shortDescription:
          i === 0
            ? "Brief product description."
            : "A longer product description that checks consistent catalogue footer alignment. ".repeat(
                3,
              ),
        brand: i === 1 ? "Test brand" : "",
        featured: false,
        priceType: i === 0 ? "quote" : "fixed",
        price: i === 0 ? null : 1000,
        promotionalPrice: i === 2 ? 800 : null,
        isPurchasableOnline: i === 2,
        quantity: 2,
        featuredImageUrl: imageUrl,
        imageUrls: i === 2 ? [imageUrl, originalImages[0]] : [imageUrl],
      });
      assert.equal(response.status, 201, await response.clone().text());
    }
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + "/led-accessories");
      await page.locator("[data-accessory-footer]").first().waitFor();
      await page.mouse.move(0, 0);
      const boxes = await page
        .locator("article:has([data-accessory-footer])")
        .evaluateAll((cards) =>
          cards.map((card) => {
            const rect = card.getBoundingClientRect();
            return {
              y: rect.y,
              height: rect.height,
              price: card
                .querySelector("[data-accessory-price]")!
                .getBoundingClientRect().top,
              stock: card
                .querySelector("[data-accessory-stock]")!
                .getBoundingClientRect().top,
              details: card
                .querySelector("[data-accessory-actions] a:first-child")!
                .getBoundingClientRect().top,
              whatsapp: card
                .querySelector("[data-accessory-actions] a:nth-child(2)")!
                .getBoundingClientRect().top,
            };
          }),
        );
      for (const box of boxes) {
        assert.ok(Math.abs(box.details - box.whatsapp) < 1);
        for (const other of boxes.filter(
          (candidate) => Math.abs(candidate.y - box.y) < 1,
        )) {
          for (const key of [
            "height",
            "price",
            "stock",
            "details",
            "whatsapp",
          ] as const)
            assert.ok(
              Math.abs(box[key] - other[key]) < 2,
              `${width}px ${key} alignment`,
            );
        }
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    pass(
      "Accessory catalogue keeps equal card heights and aligned price, stock, details and WhatsApp rows across varied titles, descriptions, photos and cart eligibility on desktop/tablet/mobile",
    );
    await page.goto(base + `/admin/bell-alarm/products/${bell.id}/edit`);
    await page
      .getByRole("textbox", { name: "Product name", exact: true })
      .fill("Edited isolated bell");
    await page
      .getByRole("button", { name: "Save product", exact: true })
      .click();
    await page.waitForURL(base + "/admin/bell-alarm/products");
    assert.equal(
      (
        await db
          .collection("products")
          .findOne({ _id: new Types.ObjectId(bell.id) })
      )?.name,
      "Edited isolated bell",
    );
    pass("Bell edit form loads saved records and persists changes");
    const fullBellDescription =
      "Full bell description retained on the individual product page. ".repeat(
        8,
      );
    assert.equal(
      (
        await api(
          `/api/products/${bell.id}`,
          {
            ...product,
            productType: "bell-alarm-system",
            category: String(bellCategory),
            name: "Edited isolated bell",
            description: fullBellDescription,
            shortDescription:
              "A published bell product with a longer summary for checking compact, consistent product cards. ".repeat(
                3,
              ),
            featuredImageUrl: imageUrl,
            imageUrls: [originalImages[0]],
            imageAlts: ["Additional bell product photograph"],
          },
          "PUT",
        )
      ).status,
      200,
    );
    for (const count of [2, 1]) {
      await db
        .collection("products")
        .updateOne(
          { _id: horn._id },
          { $set: { status: count === 2 ? "published" : "draft" } },
        );
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(base + "/electronic-bell-alarm");
        const grid = page
          .locator("[data-bell-products]")
          .filter({ visible: true });
        await grid.waitFor();
        const cards = grid.locator("article");
        assert.equal(await cards.count(), count);
        assert.equal(
          await page
            .getByRole("img", {
              name: "Page informational photograph",
              exact: true,
            })
            .count(),
          0,
        );
        const multiCard = cards.filter({ hasText: "Edited isolated bell" });
        const singleCard = cards.filter({ hasText: "Horn Speaker" });
        const multiPrimary = multiCard
          .getByRole("button", { name: "Enlarge product image", exact: true })
          .getByRole("img");
        await multiCard
          .getByText("Click the side arrows to see more images", {
            exact: true,
          })
          .waitFor();
        await multiCard
          .getByRole("button", { name: "Next image", exact: true })
          .click();
        assert.equal(await multiPrimary.getAttribute("src"), originalImages[0]);
        await multiCard
          .getByRole("button", { name: "Previous image", exact: true })
          .click();
        assert.equal(await multiPrimary.getAttribute("src"), imageUrl);
        if (count === 2)
          assert.equal(
            await singleCard
              .getByRole("button", { name: /Next image|Previous image/ })
              .count(),
            0,
          );
        const measurements = await cards.evaluateAll((elements) =>
          elements.map((card) => {
            const rect = card.getBoundingClientRect();
            const img = card.querySelector("img")!;
            const frame = img.parentElement!.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              center: rect.x + rect.width / 2,
              ratio: frame.width / frame.height,
              fit: getComputedStyle(img).objectFit,
              clamp: getComputedStyle(card.querySelector(".line-clamp-3")!)
                .webkitLineClamp,
            };
          }),
        );
        for (const measurement of measurements) {
          assert.ok(measurement.width <= 400.1);
          if (width >= 768) assert.ok(measurement.width >= 350);
          assert.ok(Math.abs(measurement.ratio - 4 / 3) < 0.02);
          assert.equal(measurement.fit, "contain");
          assert.equal(measurement.clamp, "3");
        }
        if (count === 2 && width >= 768) {
          assert.ok(Math.abs(measurements[0].y - measurements[1].y) < 1);
          assert.ok(
            Math.abs(
              (measurements[0].center + measurements[1].center) / 2 - width / 2,
            ) < 2,
          );
          assert.ok(
            Math.abs(measurements[0].height - measurements[1].height) < 2,
          );
        } else {
          for (const measurement of measurements)
            assert.ok(Math.abs(measurement.center - width / 2) < 2);
          if (count === 2) assert.ok(measurements[1].y > measurements[0].y);
        }
        for (const card of await cards.all()) {
          assert.ok(
            await card
              .getByRole("link", { name: "View Details", exact: true })
              .isVisible(),
          );
          assert.match(
            (await card
              .getByRole("link", { name: "Request Quote", exact: true })
              .getAttribute("href"))!,
            /^\/electronic-bell-alarm\/request\?product=/,
          );
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
    }
    await db
      .collection("products")
      .updateOne({ _id: horn._id }, { $set: { status: "published" } });
    await page.goto(base + `/electronic-bell-alarm/products/${bell.slug}`);
    await page
      .getByText(fullBellDescription.trim(), { exact: true })
      .filter({ visible: true })
      .waitFor();
    await page
      .getByRole("img", {
        name: "Additional bell product photograph",
        exact: true,
      })
      .waitFor();
    const storedBell = await db
      .collection("products")
      .findOne({ _id: new Types.ObjectId(bell.id) });
    assert.deepEqual(storedBell?.imageUrls, [originalImages[0]]);
    const bellSettings = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    assert.deepEqual(bellSettings?.bellPagePublished?.imageUrls, [imageUrl]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    pass(
      "Bell page centers one/two cards, uses two desktop columns and one mobile column, contains 4:3 images, clamps summaries and preserves page media plus full detail descriptions and additional photographs",
    );

    await page.goto(base);
    assert.equal(
      await page.locator("#services article").filter({ visible: true }).count(),
      1,
    );
    assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
    const headings = await page
      .locator("main h2")
      .filter({ visible: true })
      .allTextContents();
    let last = -1;
    for (const title of [
      "Our Services",
      "Featured LED Screens",
      "Edited isolated bell",
      "Isolated camera",
      "LED Screen Accessories",
      "Featured Projects",
      "Latest News & Insights",
    ]) {
      const i = headings.indexOf(title);
      assert.ok(i > last, `${title}: ${headings}`);
      last = i;
    }
    assert.ok(
      (
        await page.locator("main").filter({ visible: true }).innerText()
      ).indexOf("Featured isolated article") <
        (
          await page.locator("main").filter({ visible: true }).innerText()
        ).indexOf("Recent isolated article"),
    );
    assert.equal(
      await page.getByText("Hidden isolated article", { exact: true }).count(),
      0,
    );
    pass(
      "Homepage section order, one services card, one H1 and featured-first published articles",
    );
    const accessorySection = page
      .locator("#accessories")
      .filter({ visible: true });
    const accessoryCards = accessorySection.locator("article");
    assert.equal(await accessoryCards.count(), 3);
    const accessoryNames = await accessoryCards.locator("h3").allTextContents();
    assert.ok(accessoryNames.slice(0, 3).includes(product.name));
    assert.ok(
      accessoryNames.slice(0, 3).includes("Isolated homepage accessory 1"),
    );
    assert.ok(
      accessoryNames.slice(0, 3).includes("Isolated homepage accessory 2"),
    );
    for (const card of await accessoryCards.all()) {
      assert.ok(await card.getByRole("img").getAttribute("src"));
      assert.equal(
        await card
          .getByRole("img")
          .evaluate((img) => getComputedStyle(img).objectFit),
        "contain",
      );
      assert.ok(
        (await card.locator("p").first().innerText()).includes(
          product.shortDescription,
        ),
      );
      assert.equal(
        await card
          .getByRole("link", { name: "Read More", exact: true })
          .getAttribute("href"),
        "/accessories",
      );
    }
    assert.ok(
      !(await accessorySection.innerText()).includes("Hidden draft accessory"),
    );
    assert.ok(
      !(await accessorySection.innerText()).includes(
        "Hidden archived accessory",
      ),
    );
    assert.ok(
      !(await accessorySection.innerText()).includes("Isolated camera"),
    );
    await accessoryCards
      .first()
      .getByRole("link", { name: "Read More", exact: true })
      .click();
    await page.waitForURL(base + "/accessories");
    await page.locator("[data-page-hero]").filter({ visible: true }).waitFor();
    pass(
      "Homepage shows three real accessory image/description cards with Read More links to the accessories catalogue",
    );
    for (const route of [
      "/led-screens",
      "/led-screens/existing-test-led",
      "/accessories",
      "/led-accessories",
      `/accessories/${accessory.slug}`,
      "/electronic-bell-alarm",
      `/electronic-bell-alarm/products/${bell.slug}`,
      "/projects/existing-test-project",
      "/blog/featured-isolated-article",
      "/music",
      "/gallery",
      "/projects",
      "/blog",
      "/contact",
      "/led-installation",
      "/led-maintenance",
      "/rent-led-screen",
    ]) {
      await page.goto(base + route);
      await page
        .locator("[data-page-hero]")
        .filter({ visible: true })
        .waitFor();
      assert.equal(
        await page
          .locator("[data-page-hero]")
          .filter({ visible: true })
          .count(),
        1,
        route,
      );
      assert.equal(
        await page.getByRole("heading", { level: 1 }).count(),
        1,
        route,
      );
      if (
        ["/led-installation", "/led-maintenance", "/rent-led-screen"].includes(
          route,
        )
      )
        assert.equal(
          await page
            .locator("main > section[data-page-hero]")
            .filter({ visible: true })
            .count(),
          1,
          `${route} has a single standalone hero`,
        );
    }
    pass("Main public routes each render exactly one hero and H1");
    for (const width of [390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `horizontal overflow ${width}`,
      );
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `/private/tmp/igt-home-${width}.png`,
          fullPage: true,
        });
    }
    pass("Mobile, tablet and desktop browser viewport checks");
    const mainNavigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    for (const name of ["Electronic Bell & Alarm", "Blog", "About", "Contact"])
      assert.equal(
        await mainNavigation.getByRole("link", { name, exact: true }).count(),
        1,
      );
    assert.equal(
      await mainNavigation.locator('a[href="/request-quote"]').count(),
      1,
    );
    assert.ok(
      (
        await mainNavigation
          .locator('a[href="/request-quote"]')
          .getAttribute("class")
      )?.includes("bg-primary"),
    );
    assert.equal(
      await mainNavigation
        .getByRole("link", { name: "LED Installation", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await mainNavigation
        .getByRole("link", { name: "Music", exact: true })
        .count(),
      0,
    );
    await mainNavigation.locator("details summary").click();
    assert.equal(
      await page
        .locator("#public-more-navigation")
        .getByRole("link", { name: "Music", exact: true })
        .count(),
      1,
    );
    await page
      .locator("#public-more-navigation")
      .getByRole("link", { name: "LED Installation", exact: true })
      .click();
    assert.equal(
      await page.locator("#public-more-navigation").isVisible(),
      false,
    );
    assert.equal(
      await page
        .locator("header")
        .evaluate((el) => getComputedStyle(el).position),
      "sticky",
    );
    assert.ok(
      (await page.locator('a[href^="https://wa.me/2348039308982"]').count()) >
        0,
    );
    pass(
      "Navigation dropdown closes, sticky header and official WhatsApp links remain functional",
    );
    for (const width of [390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      const mobile = page.getByRole("navigation", {
        name: "Mobile navigation",
        exact: true,
      });
      for (const name of [
        "Electronic Bell & Alarm",
        "Blog",
        "About",
        "Contact",
      ])
        assert.equal(
          await mobile.getByRole("link", { name, exact: true }).count(),
          1,
        );
      assert.equal(await mobile.locator('a[href="/request-quote"]').count(), 1);
      assert.equal(
        await mobile
          .getByRole("link", { name: "LED Installation", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await mobile.getByRole("link", { name: "Music", exact: true }).count(),
        0,
      );
      await mobile.locator("summary").click();
      assert.equal(
        await mobile.getByRole("link", { name: "Music", exact: true }).count(),
        1,
      );
      await mobile
        .getByRole("link", { name: "LED Installation", exact: true })
        .click();
      assert.equal(await page.locator("#mobile-navigation").count(), 0);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    pass(
      "Prominent main links, one quote CTA and installation under More on desktop/mobile",
    );

    assert.deepEqual(
      await db.collection("products").findOne({ slug: "existing-test-led" }),
      existingLed,
    );
    pass("Existing LED product remains unchanged by accessory and page edits");
    const productsBeforeAdmin = await db
      .collection("products")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const retiredSettings = {
      bellHeading: "Retired bell heading",
      cameraHeading: "Retired camera heading",
      bellDescription: "Retired bell copy",
      cameraDescription: "Retired camera copy",
      bellImageUrl: originalImages[1],
      cameraImageUrl: originalImages[2],
    };
    await db.collection("businesssettings").updateOne(
      { singletonKey: "primary" },
      {
        $set: {
          homepageImages: retiredSettings,
          "homepageHero.messageOne": "Retired message one",
          "homepageHero.messageTwo": "Retired message two",
        },
      },
    );
    await page.goto(base + "/admin/settings/homepage");
    await page
      .getByRole("heading", { name: "Homepage Content", exact: true })
      .waitFor();
    assert.equal(await page.locator("main form").count(), 3);
    assert.equal(await page.getByRole("textbox").count(), 21);
    assert.equal(
      await page.getByRole("textbox", { name: /Bell|Camera/ }).count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("textbox", {
          name: "Accessories section heading",
          exact: true,
        })
        .inputValue(),
      defaultHomepageAccessorySettings.heading,
    );
    assert.equal(
      await page
        .getByRole("textbox", {
          name: "Accessories section description",
          exact: true,
        })
        .inputValue(),
      defaultHomepageAccessorySettings.description,
    );
    assert.equal(await page.locator('input[type="file"]').count(), 0);
    assert.equal(
      await page
        .getByRole("link", { name: "Manage Bell products", exact: true })
        .getAttribute("href"),
      "/admin/bell-alarm/products",
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Manage camera products", exact: true })
        .getAttribute("href"),
      "/admin/accessories",
    );
    assert.equal(
      (await api("/api/settings/homepage-images", retiredSettings, "PUT"))
        .status,
      410,
    );
    assert.deepEqual(
      (
        await db
          .collection("businesssettings")
          .findOne({ singletonKey: "primary" })
      )?.homepageImages,
      retiredSettings,
    );
    assert.deepEqual(
      await db.collection("products").find().sort({ _id: 1 }).toArray(),
      productsBeforeAdmin,
    );
    pass(
      "Homepage Content links to Product Management without duplicate fields; retired save endpoint refuses writes and preserves records",
    );
    const newAccessoryCopy = {
      heading: "LED Accessories & Components",
      description:
        "Enquire about LED parts with <strong>literal text</strong> shown safely.",
    };
    assert.equal(
      (await api("/api/settings/homepage", newAccessoryCopy, "PUT", false))
        .status,
      401,
    );
    assert.equal(
      (await api("/api/settings/homepage", { heading: " " }, "PUT")).status,
      422,
    );
    assert.equal(
      (
        await api(
          "/api/settings/homepage",
          { ...newAccessoryCopy, bellHeading: "Disallowed override" },
          "PUT",
        )
      ).status,
      422,
    );
    assert.equal(
      (
        await fetch(base + "/api/settings/homepage", {
          method: "PUT",
          headers: {
            Cookie: cookie,
            Origin: "https://untrusted.example",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newAccessoryCopy),
        })
      ).status,
      403,
    );
    await page
      .getByRole("textbox", {
        name: "Accessories section heading",
        exact: true,
      })
      .fill(newAccessoryCopy.heading);
    await page
      .getByRole("textbox", {
        name: "Accessories section description",
        exact: true,
      })
      .fill(newAccessoryCopy.description);
    await page
      .getByRole("button", { name: "Save accessories section", exact: true })
      .click();
    await page
      .getByText("Accessories homepage section saved.", { exact: true })
      .waitFor();
    const savedHomepage = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    assert.deepEqual(savedHomepage?.homepageAccessories, newAccessoryCopy);
    assert.deepEqual(savedHomepage?.homepageImages, retiredSettings);
    assert.equal(savedHomepage?.businessName, originalSettings?.businessName);
    assert.deepEqual(
      await db.collection("products").find().sort({ _id: 1 }).toArray(),
      productsBeforeAdmin,
    );
    await page.reload();
    assert.equal(
      await page
        .getByRole("textbox", {
          name: "Accessories section heading",
          exact: true,
        })
        .inputValue(),
      newAccessoryCopy.heading,
    );
    assert.equal(
      await page
        .getByRole("textbox", {
          name: "Accessories section description",
          exact: true,
        })
        .inputValue(),
      newAccessoryCopy.description,
    );
    await page
      .getByRole("textbox", {
        name: "Accessories section heading",
        exact: true,
      })
      .fill("Unsaved accessories heading");
    await page
      .getByRole("form", { name: "Accessories homepage settings", exact: true })
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("textbox", {
          name: "Accessories section heading",
          exact: true,
        })
        .inputValue(),
      newAccessoryCopy.heading,
    );
    pass(
      "Accessory homepage copy saves and reloads in the existing settings record; defaults, discard, validation/authentication and unrelated records are preserved",
    );

    const heroForm = page.getByRole("form", {
      name: "Homepage hero settings",
      exact: true,
    });
    assert.equal(
      await heroForm
        .getByRole("textbox", { name: "Heading 1", exact: true })
        .inputValue(),
      defaultHomepageHeroSettings.heading,
    );
    assert.equal(
      await heroForm
        .getByRole("textbox", { name: "Hero description", exact: true })
        .inputValue(),
      defaultHomepageHeroSettings.description,
    );
    const newHeroCopy = {
      heading: "LED Display Solutions for Your Venue",
      headingTwo: "Equipment for Your Venue",
      description:
        "Custom hero write-up with <strong>plain text</strong> for visitors.",
    };
    assert.equal(
      (await api("/api/settings/homepage", newHeroCopy, "PATCH", false)).status,
      401,
    );
    assert.equal(
      (await api("/api/settings/homepage", { heading: " " }, "PATCH")).status,
      422,
    );
    assert.equal(
      (
        await fetch(base + "/api/settings/homepage", {
          method: "PATCH",
          headers: {
            Cookie: cookie,
            Origin: "https://untrusted.example",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newHeroCopy),
        })
      ).status,
      403,
    );
    await heroForm
      .getByRole("textbox", { name: "Heading 1", exact: true })
      .fill(newHeroCopy.heading);
    await heroForm
      .getByRole("textbox", { name: "Hero description", exact: true })
      .fill(newHeroCopy.description);
    for (const field of ["headingTwo"] as const) {
      await heroForm
        .getByRole("textbox", {
          name: "Heading 2 (optional)",
          exact: true,
        })
        .fill(newHeroCopy[field]);
    }
    await heroForm
      .getByRole("button", { name: "Save hero", exact: true })
      .click();
    await heroForm.getByText("Homepage hero saved.", { exact: true }).waitFor();
    const savedHeroSettings = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    assert.deepEqual(savedHeroSettings?.homepageHero, {
      ...newHeroCopy,
      messageOne: "Retired message one",
      messageTwo: "Retired message two",
    });
    assert.deepEqual(savedHeroSettings?.homepageAccessories, newAccessoryCopy);
    assert.deepEqual(savedHeroSettings?.homepageImages, retiredSettings);
    assert.deepEqual(
      await db.collection("products").find().sort({ _id: 1 }).toArray(),
      productsBeforeAdmin,
    );
    await page.reload();
    assert.equal(
      await heroForm
        .getByRole("textbox", { name: "Heading 1", exact: true })
        .inputValue(),
      newHeroCopy.heading,
    );
    assert.equal(
      await heroForm
        .getByRole("textbox", { name: "Hero description", exact: true })
        .inputValue(),
      newHeroCopy.description,
    );
    await heroForm
      .getByRole("textbox", { name: "Heading 1", exact: true })
      .fill("Unsaved hero heading");
    await heroForm
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    assert.equal(
      await heroForm
        .getByRole("textbox", { name: "Heading 1", exact: true })
        .inputValue(),
      newHeroCopy.heading,
    );
    for (const field of ["headingTwo"] as const) {
      const textbox = heroForm.getByRole("textbox", {
        name: "Heading 2 (optional)",
        exact: true,
      });
      assert.equal(await textbox.inputValue(), newHeroCopy[field]);
      await textbox.fill("Unsaved message");
      await heroForm
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
      assert.equal(await textbox.inputValue(), newHeroCopy[field]);
    }
    // Saving accessories later must not overwrite the hero.
    assert.equal(
      (await api("/api/settings/homepage", newAccessoryCopy, "PUT")).status,
      200,
    );
    assert.deepEqual(
      (
        await db
          .collection("businesssettings")
          .findOne({ singletonKey: "primary" })
      )?.homepageHero,
      {
        ...newHeroCopy,
        messageOne: "Retired message one",
        messageTwo: "Retired message two",
      },
    );
    pass(
      "Hero write-up defaults, editing, persistence, reload, discard and auth validation work independently of accessories and product content",
    );
    for (const width of [390, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      const publicHero = page.locator("#home-hero").filter({ visible: true });
      await publicHero
        .getByRole("heading", {
          name: `${newHeroCopy.heading} ${newHeroCopy.headingTwo}`,
          level: 1,
          exact: true,
        })
        .waitFor();
      assert.equal(
        await publicHero.locator("h1 + p").innerText(),
        newHeroCopy.description,
      );
      const firstHeading = publicHero.locator('[data-hero-heading="1"]');
      const secondHeading = publicHero.locator('[data-hero-heading="2"]');
      assert.equal(await firstHeading.textContent(), newHeroCopy.heading);
      assert.equal(await secondHeading.textContent(), newHeroCopy.headingTwo);
      const firstBox = await firstHeading.boundingBox();
      const secondBox = await secondHeading.boundingBox();
      const descriptionBox = await publicHero.locator("h1 + p").boundingBox();
      assert.ok(firstBox && secondBox && descriptionBox);
      assert.ok(secondBox.y >= firstBox.y + firstBox.height);
      assert.ok(descriptionBox.y > secondBox.y);
      assert.ok(secondBox.x >= 0 && secondBox.width <= width);
      assert.equal(await publicHero.locator("[data-hero-message]").count(), 0);
      assert.equal(await publicHero.locator("strong").count(), 0);
      assert.equal(
        await publicHero
          .getByRole("link", { name: "Explore Products", exact: true })
          .getAttribute("href"),
        "/led-screens",
      );
      assert.equal(
        await publicHero
          .getByRole("link", { name: "Request a Quote", exact: true })
          .getAttribute("href"),
        "/request-quote",
      );
      const accessorySection = page
        .locator("#accessories")
        .filter({ visible: true });
      await accessorySection
        .getByRole("heading", {
          name: newAccessoryCopy.heading,
          level: 2,
          exact: true,
        })
        .waitFor();
      await accessorySection
        .getByText(newAccessoryCopy.description, { exact: true })
        .waitFor();
      assert.equal(await accessorySection.locator("strong").count(), 0);
      assert.equal(await accessorySection.locator("article").count(), 3);
      assert.equal(
        await accessorySection
          .getByRole("link", { name: "View All Accessories", exact: false })
          .getAttribute("href"),
        "/accessories",
      );
      for (const [selector, productName, summary] of [
        [
          "#electronic-digital-bell",
          "Edited isolated bell",
          storedBell!.shortDescription.trim(),
        ],
        ["#led-screen-cameras", camera.name, camera.shortDescription.trim()],
      ]) {
        const section = page.locator(selector).filter({ visible: true });
        const heading = section.getByRole("heading", {
          name: productName,
          exact: true,
          level: 2,
        });
        await heading.waitFor();
        assert.equal(await section.locator("h3").count(), 0);
        assert.equal(await section.locator("p").count(), 1);
        assert.equal((await section.locator("p").innerText()).trim(), summary);
        assert.ok(!(await section.innerText()).includes("Retired"));
        const photo = section.getByRole("img");
        assert.equal(await photo.getAttribute("src"), imageUrl);
        await photo.scrollIntoViewIfNeeded();
        const photoBox = await photo.boundingBox(),
          headingBox = await heading.boundingBox();
        assert.ok(photoBox && headingBox);
        if (width >= 768)
          assert.ok(photoBox.x + photoBox.width <= headingBox.x + 2);
        else assert.ok(photoBox.y + photoBox.height <= headingBox.y + 2);
      }
      assert.equal(
        await page.locator("#led-screen-cameras article").count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    pass(
      "Featured product names are section headings with exactly one product summary and photo; retired settings have no effect at mobile/desktop widths",
    );
    const updatedBellSummary =
      "Updated bell summary from the existing product editor.";
    const updatedCameraSummary =
      "Updated camera summary from the existing product editor.";
    assert.equal(
      (
        await api(
          `/api/products/${bell.id}`,
          {
            ...product,
            productType: "bell-alarm-system",
            category: String(bellCategory),
            name: "Updated featured bell",
            shortDescription: updatedBellSummary,
            featuredImageUrl: originalImages[0],
          },
          "PUT",
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await api(
          `/api/products/${camera.id}`,
          {
            ...product,
            showcase: "camera",
            name: "Updated featured camera",
            shortDescription: updatedCameraSummary,
            featuredImageUrl: originalImages[2],
          },
          "PUT",
        )
      ).status,
      200,
    );
    await page.goto(base);
    for (const [selector, name, summary, photo] of [
      [
        "#electronic-digital-bell",
        "Updated featured bell",
        updatedBellSummary,
        originalImages[0],
      ],
      [
        "#led-screen-cameras",
        "Updated featured camera",
        updatedCameraSummary,
        originalImages[2],
      ],
    ]) {
      const section = page.locator(selector).filter({ visible: true });
      await section
        .getByRole("heading", { name, level: 2, exact: true })
        .waitFor();
      assert.equal(await section.locator("p").innerText(), summary);
      assert.equal(await section.getByRole("img").getAttribute("src"), photo);
    }
    pass(
      "Product Management edits automatically update homepage headings, descriptions and photographs without homepage settings",
    );
    assert.equal(
      (
        await api(
          `/api/products/${bell.id}`,
          {
            ...product,
            productType: "bell-alarm-system",
            category: String(bellCategory),
            name: "Featured bell without photo",
            shortDescription: updatedBellSummary,
            featuredImageUrl: "",
            imageUrls: [],
          },
          "PUT",
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await api(
          `/api/products/${camera.id}`,
          {
            ...product,
            showcase: "camera",
            name: "Featured camera without photo",
            shortDescription: updatedCameraSummary,
            featuredImageUrl: "",
            imageUrls: [],
          },
          "PUT",
        )
      ).status,
      200,
    );
    await page.goto(base);
    for (const [selector, name] of [
      ["#electronic-digital-bell", "Featured bell without photo"],
      ["#led-screen-cameras", "Featured camera without photo"],
    ]) {
      const section = page.locator(selector).filter({ visible: true });
      await section
        .getByRole("heading", { name, level: 2, exact: true })
        .waitFor();
      assert.equal(await section.getByRole("img").count(), 0);
      assert.equal(await section.locator("p").count(), 1);
    }
    pass(
      "Featured products without photographs retain their own headings/summaries with branded placeholders; old overrides cannot reappear",
    );
    assert.equal(
      (
        await api(
          `/api/products/${bell.id}`,
          {
            ...product,
            productType: "bell-alarm-system",
            category: String(bellCategory),
            featured: false,
            status: "draft",
          },
          "PUT",
        )
      ).status,
      200,
    );
    const archivedResponse = await api(
      `/api/products/${accessory.id}`,
      { ...product, status: "archived" },
      "PUT",
    );
    const draftResponse = await api(
      `/api/products/${camera.id}`,
      {
        ...product,
        name: "Isolated camera",
        showcase: "camera",
        status: "draft",
      },
      "PUT",
    );
    assert.equal(archivedResponse.status, 200);
    assert.equal(draftResponse.status, 200);
    assert.equal(
      (
        await db
          .collection("products")
          .findOne({ _id: new Types.ObjectId(accessory.id) })
      )?.status,
      "archived",
    );
    const hidden = await fetch(base + `/led-accessories/${accessory.slug}`);
    const hiddenHtml = await hidden.text();
    // Next.js 16 returns 200 for a streamed notFound response; content must still be absent and noindexed.
    assert.ok([200, 404].includes(hidden.status));
    assert.ok(!hiddenHtml.includes("Isolated accessory"));
    assert.match(hiddenHtml, /noindex/);
    const home = await (await fetch(base)).text();
    assert.match(home, /id="electronic-digital-bell"/);
    assert.match(home, /id="led-screen-cameras"/);
    assert.ok(!home.includes('href="/led-accessories/' + accessory.slug + '"'));
    assert.ok(!home.includes('href="/led-accessories/' + camera.slug + '"'));
    pass(
      "Archived and draft products disappear from public detail pages and homepage",
    );
    await page.goto(base);
    for (const [selector, fallback] of [
      ["#electronic-digital-bell", homepageSectionFallbacks.bell],
      ["#led-screen-cameras", homepageSectionFallbacks.camera],
    ]) {
      const section = page.locator(selector).filter({ visible: true });
      await section.getByText(fallback, { exact: true }).waitFor();
      const heading =
        selector === "#electronic-digital-bell"
          ? homepageSectionDefaults.bellHeading
          : homepageSectionDefaults.cameraHeading;
      await section
        .getByRole("heading", { name: heading, level: 2, exact: true })
        .waitFor();
      assert.equal(await section.locator("h3").count(), 0);
      assert.equal(await section.locator("p").count(), 1);
    }
    await page.goto(base);
    for (const selector of ["#electronic-digital-bell", "#led-screen-cameras"])
      assert.equal(
        await page
          .locator(selector)
          .filter({ visible: true })
          .getByRole("img")
          .count(),
        0,
      );
    pass(
      "No featured products produces one safe fallback message per section; missing image overrides use branded placeholders without broken images",
    );
    assert.deepEqual(errors, []);
    pass("No client runtime exceptions during browser checks");
    console.log(`Completed ${checks} integration checks.`);
  } catch (e) {
    console.error(logs.slice(-6000));
    throw e;
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
