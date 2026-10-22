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
    assert.match(emptyHome, /View All Articles/);
    assert.match(emptyHome, /Explore Bell &amp; Alarm/);
    assert.match(emptyHome, /Enquire About Live Video Solutions/);
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
    // Upload using the additional-images input: it must populate the featured image automatically.
    await page
      .getByLabel("Upload additional photographs")
      .filter({ visible: true })
      .setInputFiles({
        name: "browser-fixture.png",
        mimeType: "image/png",
        buffer: image,
      });
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
      "Electronic Digital Bell Systems",
      "LED Screen Cameras & Live Video Solutions",
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
    await page.getByRole("button", { name: /More/ }).click();
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
    assert.equal(await page.locator("#public-more-navigation").count(), 0);
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
    await page.goto(base + "/admin/settings/homepage");
    for (const [legend, name, alt] of [
      [
        "Electronic Bell homepage photo",
        "homepage-bell.png",
        "Uploaded homepage bell",
      ],
      [
        "LED Screen Camera homepage photo",
        "homepage-camera.png",
        "Uploaded homepage camera",
      ],
    ]) {
      const field = page.getByRole("group", { name: legend, exact: true });
      await field
        .locator('input[type="file"]')
        .setInputFiles({ name, mimeType: "image/png", buffer: image });
      await field
        .getByText("Image uploaded and selected. Save changes to apply it.", {
          exact: true,
        })
        .filter({ visible: true })
        .waitFor();
      await field.getByRole("textbox").fill(alt);
    }
    await page
      .getByRole("button", { name: "Save homepage images", exact: true })
      .click();
    await page
      .getByText("Homepage images saved.", { exact: true })
      .filter({ visible: true })
      .waitFor();
    const imageSettings = (
      await db
        .collection("businesssettings")
        .findOne({ singletonKey: "primary" })
    )?.homepageImages;
    assert.ok(imageSettings.bellImageUrl.startsWith("/api/product-images/"));
    assert.ok(imageSettings.cameraImageUrl.startsWith("/api/product-images/"));
    assert.notEqual(imageSettings.bellImageUrl, imageSettings.cameraImageUrl);
    await page.reload();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Bell image alt text", exact: true })
        .inputValue(),
      "Uploaded homepage bell",
    );
    for (const width of [390, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      for (const [selector, alt] of [
        ["#electronic-digital-bell", "Uploaded homepage bell"],
        ["#led-screen-cameras", "Uploaded homepage camera"],
      ]) {
        const section = page.locator(selector).filter({ visible: true }),
          photo = section.getByRole("img", { name: alt, exact: true }),
          heading = section.locator(
            selector === "#electronic-digital-bell"
              ? "#bell-showcase-heading"
              : "#camera-showcase-heading",
          );
        await photo.waitFor();
        await photo.scrollIntoViewIfNeeded();
        await page.waitForFunction(
          ({ selector, alt }) =>
            Array.from(document.querySelectorAll(selector + " img")).some(
              (el) =>
                el instanceof HTMLImageElement &&
                el.alt === alt &&
                el.complete &&
                el.naturalWidth > 0,
            ),
          { selector, alt },
        );
        assert.ok(
          await photo.evaluate(
            (el) =>
              el instanceof HTMLImageElement &&
              el.complete &&
              el.naturalWidth > 0,
          ),
        );
        const photoBox = await photo.boundingBox(),
          headingBox = await heading.boundingBox();
        assert.ok(photoBox && headingBox);
        if (width >= 768)
          assert.ok(
            photoBox.x + photoBox.width <= headingBox.x + 2,
            `${selector} photograph sits beside its write-up`,
          );
        else
          assert.ok(
            photoBox.y + photoBox.height <= headingBox.y + 2,
            `${selector} photograph stacks above its write-up`,
          );
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    assert.equal(
      (
        await api(
          "/api/settings/homepage-images",
          { bellImageUrl: "/api/product-images/507f1f77bcf86cd799439011" },
          "PUT",
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await db
          .collection("businesssettings")
          .findOne({ singletonKey: "primary" })
      )?.businessName,
      originalSettings?.businessName,
    );
    pass(
      "Owner uploads distinct homepage bell/camera photos; selection and alt text persist and render side by side on desktop, stacked on mobile",
    );

    await page.goto(base + "/admin/settings/homepage");
    const bellPhotoField = page.getByRole("group", {
      name: "Electronic Bell homepage photo",
      exact: true,
    });
    await bellPhotoField
      .getByRole("button", { name: "Remove photo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save homepage images", exact: true })
      .click();
    await page
      .getByText("Homepage images saved.", { exact: true })
      .filter({ visible: true })
      .waitFor();
    assert.equal(
      (
        await db
          .collection("businesssettings")
          .findOne({ singletonKey: "primary" })
      )?.homepageImages.bellImageUrl,
      "",
    );
    await page.reload();
    const restoreField = page.getByRole("group", {
      name: "Electronic Bell homepage photo",
      exact: true,
    });
    await restoreField
      .getByRole("combobox")
      .selectOption(imageSettings.bellImageUrl);
    await restoreField
      .getByRole("button", { name: "Use selected image", exact: true })
      .click();
    await restoreField.getByRole("textbox").fill("Restored homepage bell");
    await page
      .getByRole("button", { name: "Save homepage images", exact: true })
      .click();
    await page
      .getByText("Homepage images saved.", { exact: true })
      .filter({ visible: true })
      .waitFor();
    assert.equal(
      (
        await db
          .collection("businesssettings")
          .findOne({ singletonKey: "primary" })
      )?.homepageImages.bellImageUrl,
      imageSettings.bellImageUrl,
    );
    pass(
      "Homepage photo removal preserves the stored asset and existing-library selection restores it",
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
    assert.ok(home.includes(imageSettings.bellImageUrl));
    assert.ok(home.includes(imageSettings.cameraImageUrl));
    assert.ok(!home.includes('href="/led-accessories/' + accessory.slug + '"'));
    assert.ok(!home.includes('href="/led-accessories/' + camera.slug + '"'));
    pass(
      "Archived and draft products disappear from public detail pages and homepage",
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
