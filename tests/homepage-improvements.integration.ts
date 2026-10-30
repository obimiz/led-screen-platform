// Isolated fixtures only: never connects to the configured application database.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium, type Browser } from "@playwright/test";
import { SignJWT } from "jose";
import { hashPassword } from "../src/lib/auth/password-core";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined, browser: Browser | undefined;
  const base = "http://127.0.0.1:3137",
    secret = "isolated-homepage-improvements-secret-12345";
  try {
    await mongoose.connect(mongo.getUri("homepage_improvements"));
    const db = mongoose.connection.db!,
      adminId = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: adminId,
      name: "Test Admin",
      email: "admin@example.test",
      role: "owner",
      isActive: true,
      sessionVersion: 0,
      passwordHash: await hashPassword("FixturePassword123!"),
    });
    for (const [slug, showcase] of [
      ["power-supplies", "accessory"],
      ["video-processors", "accessory"],
      ["other-video", "video"],
    ]) {
      const category = new Types.ObjectId();
      await db.collection("productcategories").insertOne({
        _id: category,
        name: slug,
        slug,
        productType: "led-accessory",
        active: true,
      });
      await db.collection("products").insertOne({
        name: slug,
        slug,
        category,
        productType: "led-accessory",
        showcase,
        status: "published",
        featured: true,
        shortDescription:
          "Isolated test accessory with complete description details.",
        featuredImageUrl: "/Images/hero/hero-led-screen.jpeg",
        description: "Test description",
        priceType: "quote",
        currency: "NGN",
        stockStatus: "in-stock",
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }
    const token = await new SignJWT({ sessionVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(adminId))
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3137",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("homepage_improvements"),
          AUTH_SECRET: secret,
          NEXT_PUBLIC_APP_URL: base,
        },
        stdio: "ignore",
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
    assert.ok(ready, "isolated server starts");
    const foreignLogin = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: {
        Origin: "https://untrusted.example",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: "admin@example.test",
        password: "FixturePassword123!",
      }),
      redirect: "manual",
    });
    assert.equal(foreignLogin.status, 403);
    assert.equal(
      (
        await fetch(base + "/api/settings/homepage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
    );
    browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.IGT_TEST_BROWSER ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    await page.goto(base + "/admin");
    await page.waitForURL("**/admin/login");
    await page
      .getByLabel("Email address", { exact: true })
      .fill("admin@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Invalid email or password" })
      .waitFor();
    assert.equal(
      await page.getByLabel("Email address", { exact: true }).inputValue(),
      "admin@example.test",
    );
    await page
      .getByLabel("Password", { exact: true })
      .fill("FixturePassword123!");
    await page.getByLabel("Password", { exact: true }).press("Enter");
    await page.waitForURL(base + "/admin");
    await page
      .getByRole("navigation", { name: "Admin navigation", exact: true })
      .waitFor();
    await page.reload();
    assert.equal(new URL(page.url()).pathname, "/admin");
    console.log(
      "PASS real login after a failed attempt, fresh dashboard navigation and persisted session on reload",
    );
    await page.goto(base + "/admin/accessory-categories");
    await page.locator('input[name="name"]:visible').fill("Video Accessories");
    await page
      .locator('input[name="imageUrl"]:visible')
      .fill("/Images/hero/hero-led-screen.jpeg");
    await page
      .locator('textarea[name="description"]:visible')
      .fill("Video equipment and parts");
    await page
      .getByRole("button", { name: "Save category", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Category created" })
      .waitFor();
    await page
      .getByRole("row")
      .filter({ hasText: "Video Accessories" })
      .waitFor();
    const savedVideoCategory = await db
      .collection("productcategories")
      .findOne({
        name: "Video Accessories",
        productType: "led-accessory",
      });
    assert.equal(
      savedVideoCategory?.imageUrl,
      "/Images/hero/hero-led-screen.jpeg",
    );
    await page.reload();
    assert.equal(
      await page
        .getByRole("row")
        .filter({ hasText: "Video Accessories" })
        .count(),
      1,
    );
    await page.locator('input[name="name"]:visible').fill("Video Cables");
    await page
      .getByRole("button", { name: "Save category", exact: true })
      .click();
    await page.getByRole("row").filter({ hasText: "Video Cables" }).waitFor();
    assert.equal(
      await db.collection("productcategories").countDocuments({
        name: "Video Cables",
        productType: "led-accessory",
        imageUrl: "",
      }),
      1,
    );
    await page.locator('input[name="name"]:visible').fill("Unsafe Video Image");
    await page
      .locator('input[name="imageUrl"]:visible')
      .fill("javascript:alert(1)");
    await page
      .getByRole("button", { name: "Save category", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: /URL|local path|safe image/ })
      .waitFor();
    assert.equal(
      await db
        .collection("productcategories")
        .countDocuments({ name: "Unsafe Video Image" }),
      0,
    );
    console.log(
      "PASS video accessory categories save with local or no image, persist after reload and show unsafe image errors",
    );
    await page.goto(base + "/admin/settings/homepage");
    await page
      .getByRole("heading", { name: "Video Accessories cards", exact: true })
      .waitFor();
    const form = page.getByRole("form", { name: "Homepage services settings" });
    await form
      .getByLabel("Services section heading", { exact: true })
      .fill("Our Expert Services");
    await form
      .getByLabel("Service 1 title", { exact: true })
      .fill("Display advice and sales");
    await form
      .getByRole("button", { name: "Save services section", exact: true })
      .click();
    await form
      .getByRole("status")
      .filter({ hasText: "Services homepage section saved." })
      .waitFor();
    await page.reload();
    assert.equal(
      await form
        .getByLabel("Services section heading", { exact: true })
        .inputValue(),
      "Our Expert Services",
    );
    const persisted = await db
      .collection("businesssettings")
      .findOne({ singletonKey: "primary" });
    assert.equal(
      persisted?.homepageServices.items[0].title,
      "Display advice and sales",
    );
    console.log(
      "PASS admin services form saves to MongoDB and survives reload",
    );
    const hero = {
      heading: "- Professional LED Display Solutions",
      headingTwo: "— Sales and after-sales support",
      description: "- Original description preserved\n- With a second line",
    };
    const response = await fetch(base + "/api/settings/homepage", {
      method: "PATCH",
      headers: {
        cookie: `led_admin_session=${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hero),
    });
    assert.equal(response.status, 200);
    const invalid = await fetch(base + "/api/settings/homepage", {
      method: "POST",
      headers: {
        cookie: `led_admin_session=${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ buttonHref: "//unsafe.example" }),
    });
    assert.equal(invalid.status, 422);

    for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      assert.equal(
        await page.locator('[data-hero-heading="1"]').textContent(),
        "Professional LED Display Solutions",
      );
      assert.equal(
        await page.locator('[data-hero-heading="2"]').textContent(),
        "Sales and after-sales support",
      );
      assert.equal(
        await page
          .locator("#home-hero")
          .getByText("LED SCREEN PLATFORM", { exact: true })
          .count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `no overflow at ${width}`,
      );
      assert.equal(
        await page.locator("#services h2").textContent(),
        "Our Expert Services",
      );
      assert.equal(
        await page
          .locator("#accessories")
          .getByRole("heading", { name: "power-supplies", exact: true })
          .count(),
        1,
      );
      assert.equal(
        await page
          .locator("#accessories")
          .getByRole("heading", { name: "video-processors", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .locator("#video-accessories")
          .getByRole("heading", { name: "video-processors", exact: true })
          .count(),
        1,
      );
      assert.equal(
        await page.locator("#home-hero a").first().getAttribute("href"),
        "/led-screens",
      );
      assert.ok(
        (await page
          .locator('[data-hero-heading="2"]')
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))) <
          (await page
            .locator('[data-hero-heading="1"]')
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))),
      );
      assert.equal(
        await page
          .locator("#video-accessories [data-video-accessory-card]")
          .count(),
        3,
      );
      const videoCard = page
        .locator("#video-accessories [data-video-accessory-card]")
        .first();
      assert.equal(
        await videoCard.locator("img").first().getAttribute("src"),
        "/Images/hero/hero-led-screen.jpeg",
      );
      assert.ok(
        await videoCard
          .getByText(
            "Isolated test accessory with complete description details.",
            { exact: true },
          )
          .isVisible(),
      );
      assert.ok(
        (
          await videoCard
            .getByRole("link", {
              name: "View accessory details →",
              exact: true,
            })
            .getAttribute("href")
        )?.startsWith("/led-accessories/"),
      );
      const more =
        width >= 1280
          ? page.locator('nav[aria-label="Main navigation"] summary')
          : page.locator("#mobile-navigation summary");
      if (width < 1280)
        await page
          .getByRole("button", { name: "Open navigation", exact: true })
          .click();
      await more.click();
      const menu = page.locator(
        width >= 1280 ? "#public-more-navigation" : "#mobile-navigation",
      );
      await menu
        .getByRole("link", { name: "Music", exact: true })
        .waitFor({ state: "visible" });
      if (width >= 1280) {
        await page.keyboard.press("Escape");
        assert.equal(
          await page.locator("#public-more-navigation").isVisible(),
          false,
        );
        await more.focus();
        await page.keyboard.press("Enter");
        await menu
          .getByRole("link", { name: "Music", exact: true })
          .waitFor({ state: "visible" });
      }
      await menu.getByRole("link", { name: "Music", exact: true }).click();
      await page.waitForURL("**/music");
      await page.goto(base);
      await page.screenshot({
        path: `/private/tmp/igt-homepage-improved-${width}.png`,
      });
    }
    console.log(
      "PASS responsive Hero, separate accessory sections and desktop/mobile More navigation at six widths",
    );
    for (const cataloguePath of ["/accessories", "/led-accessories"]) {
      await page.goto(base + cataloguePath);
      assert.equal(
        await page
          .locator("#led-screen-accessories")
          .getByRole("heading", { name: "power-supplies", exact: true })
          .count(),
        1,
      );
      assert.equal(
        await page
          .locator("#video-accessories")
          .getByRole("heading", { name: "video-processors", exact: true })
          .count(),
        1,
      );
    }
    await db
      .collection("products")
      .updateMany({ showcase: "video" }, { $set: { status: "draft" } });
    const videoCategory = await db
      .collection("productcategories")
      .findOne({ slug: "video-processors" });
    await db
      .collection("products")
      .updateMany(
        { category: videoCategory?._id },
        { $set: { status: "draft" } },
      );
    await page.goto(base);
    const fallbackCard = page.locator(
      "#video-accessories [data-video-accessory-card]",
    );
    assert.equal(await fallbackCard.count(), 3);
    for (const title of [
      "Video Processors",
      "Video Switchers",
      "Video Connectivity Accessories",
    ]) {
      await fallbackCard
        .getByRole("heading", { name: title, exact: true })
        .waitFor();
    }
    assert.equal(
      await fallbackCard
        .getByText("Image coming soon", { exact: true })
        .count(),
      3,
    );
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const bounds = await fallbackCard.evaluateAll((cards) =>
        cards.map((card) => ({
          top: card.getBoundingClientRect().top,
          width: card.getBoundingClientRect().width,
        })),
      );
      assert.equal(
        new Set(bounds.map((card) => Math.round(card.top))).size,
        width === 1440 ? 1 : width === 768 ? 2 : 3,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.locator("#video-accessories").screenshot({
        path: `/private/tmp/igt-video-three-cards-${width}.png`,
      });
    }
    console.log(
      "PASS three video image-and-description cards at desktop, tablet and mobile widths",
    );
    assert.deepEqual(errors, []);
    const savedHero = (
      await db
        .collection("businesssettings")
        .findOne({ singletonKey: "primary" })
    )?.homepageHero;
    assert.deepEqual(
      savedHero,
      hero,
      "display formatting does not overwrite saved Hero copy",
    );
    const noJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const staticPage = await noJS.newPage();
    let invalidRedirect = "";
    staticPage.on("response", (response) => {
      if (
        response.url().includes("/api/auth/login") &&
        response.status() === 303
      )
        invalidRedirect = response.headers().location || "";
    });
    await staticPage.goto(base);
    await staticPage
      .locator('nav[aria-label="Main navigation"] summary')
      .click();
    assert.ok(
      await staticPage
        .locator("#public-more-navigation")
        .getByRole("link", { name: "Music", exact: true })
        .isVisible(),
    );
    await staticPage.goto(base + "/admin/login");
    await staticPage
      .getByLabel("Email address", { exact: true })
      .fill("admin@example.test");
    await staticPage
      .getByLabel("Password", { exact: true })
      .fill("WrongPassword123!");
    await staticPage.getByLabel("Password", { exact: true }).press("Enter");
    await staticPage.waitForURL("**/admin/login?error=invalid");
    assert.equal(invalidRedirect, "/admin/login?error=invalid");
    await staticPage
      .getByRole("alert")
      .filter({ hasText: "Invalid email or password" })
      .waitFor();
    assert.ok(!staticPage.url().includes("WrongPassword123!"));
    await staticPage
      .getByLabel("Email address", { exact: true })
      .fill("admin@example.test");
    await staticPage
      .getByLabel("Password", { exact: true })
      .fill("FixturePassword123!");
    await staticPage.getByLabel("Password", { exact: true }).press("Enter");
    await staticPage.waitForURL(base + "/admin");
    await staticPage
      .getByRole("navigation", { name: "Admin navigation", exact: true })
      .waitFor();
    await page.evaluate(() => {
      const form = document.createElement("form");
      form.action = "/api/product-categories";
      form.method = "post";
      for (const [name, value] of Object.entries({
        name: "Native Video Accessories",
        description: "Saved without client scripts",
        imageUrl: "",
        active: "on",
        sortOrder: "0",
        productType: "led-accessory",
      })) {
        const input = document.createElement("input");
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    });
    await page.waitForURL(base + "/admin/accessory-categories?saved=1");
    await page
      .getByRole("status")
      .filter({ hasText: "Category saved." })
      .waitFor();
    const nativeCategory = await db.collection("productcategories").findOne({
      name: "Native Video Accessories",
      productType: "led-accessory",
    });
    assert.ok(nativeCategory);
    assert.equal(nativeCategory.active, true);
    assert.equal(nativeCategory.sortOrder, 0);
    await page.goto(base + "/admin/accessory-categories?saved=1");
    await page
      .getByRole("cell", { name: "Native Video Accessories" })
      .waitFor();
    await noJS.close();
    console.log(
      "PASS shared accessories page, saved Hero wording, no browser errors, More, Enter sign-in and native category save",
    );
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
