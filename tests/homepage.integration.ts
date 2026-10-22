// Ephemeral MongoDB and synthetic test fixtures only; never uses Atlas data.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium, type Browser } from "@playwright/test";
import { SignJWT } from "jose";
import { initialOrganisationNames } from "../src/lib/constants/organisations";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined, browser: Browser | undefined;
  const base = "http://127.0.0.1:3126",
    secret = "isolated-homepage-test-secret-32-characters";
  let checks = 0;
  const pass = (label: string) => console.log(`PASS ${++checks}: ${label}`);
  try {
    await mongoose.connect(mongo.getUri("homepage_test"));
    const db = mongoose.connection.db!,
      adminId = new Types.ObjectId(),
      category = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: adminId,
      name: "Test Admin",
      email: "admin@example.test",
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    await db.collection("productcategories").insertOne({
      _id: category,
      name: "Test category",
      slug: "test-category",
      active: true,
      productType: "led-screen",
    });
    await db.collection("products").insertMany(
      ["fixed", "from", "per_sqm", "contact"].map((priceType, i) => ({
        createdAt: new Date(),
        updatedAt: new Date(),
        name: `Test display ${i}`,
        slug: `test-display-${i}`,
        category,
        productType: "led-screen",
        shortDescription:
          "Test product description supplied only as an isolated fixture.",
        description: "Test description for product detail.",
        priceType,
        price: priceType === "contact" ? null : 850000,
        currency: "NGN",
        featured: true,
        status: "published",
        indoorOutdoor: "indoor",
        stockStatus: "made-to-order",
        featuredImageUrl: "/missing-test-image.png",
        imageUrls: [],
        features: [],
        specifications: [],
        supportedInputs: [],
        usageApplications: [],
      })),
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
        "-p",
        "3126",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("homepage_test"),
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
    assert.ok(ready, "Test server starts");
    assert.equal((await fetch(base + "/api/organisations")).status, 401);
    assert.equal(
      (
        await fetch(base + "/api/organisations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
    );
    pass("Organisation APIs reject unauthenticated access");
    async function api(path: string, method = "GET", body?: unknown) {
      const r = await fetch(base + path, {
        method,
        headers: { cookie, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      assert.ok(r.ok, `${method} ${path}: ${r.status}`);
      return (await r.json()).data;
    }
    for (let i = 0; i < 10; i++)
      await api("/api/organisations", "POST", {
        name: `Test organisation ${i}`,
        logoUrl:
          i === 0
            ? "/branding/image-grant-technology-logo.jpeg"
            : "/missing-test-logo.png",
        displayOrder: 10 - i,
        featured: true,
        active: true,
      });
    let rows = await api("/api/organisations");
    assert.equal(rows.length, 10);
    assert.equal(rows[0].name, "Test organisation 9");
    const row = rows[0],
      { id, slug, ...values } = row;
    await api(`/api/organisations/${id}`, "PUT", {
      ...values,
      name: "Edited test organisation",
      active: false,
    });
    void slug;
    let home = await (await fetch(base)).text();
    assert.ok(!home.includes("Edited test organisation"));
    await api(`/api/organisations/${id}`, "PUT", {
      ...values,
      name: "Edited test organisation",
      featured: false,
    });
    home = await (await fetch(base)).text();
    assert.ok(!home.includes("Edited test organisation"));
    await api(`/api/organisations/${id}`, "PUT", {
      ...values,
      name: "Edited test organisation",
    });
    pass("Create/edit, ordering, active and featured filtering");
    const chrome =
      process.env.IGT_TEST_BROWSER ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    const page = await browser.newPage();
    for (const width of [375, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.locator("h1").waitFor();
      assert.equal(await page.locator(".organisation-row").count(), 1);
      const cards = await page
        .locator(".organisation-card")
        .evaluateAll((items) =>
          items.map((item) => {
            const bounds = item.getBoundingClientRect();
            return {
              top: bounds.top,
              width: Math.round(bounds.width),
              height: Math.round(bounds.height),
            };
          }),
        );
      assert.equal(new Set(cards.map((card) => card.top)).size, 1);
      assert.equal(
        new Set(cards.map((card) => `${card.width}x${card.height}`)).size,
        1,
      );
      assert.equal(
        await page.locator("h1").textContent(),
        "Professional LED Display Solutions",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `No overflow at ${width}`,
      );
      assert.equal(
        await page
          .getByRole("link", { name: "Explore Products", exact: true })
          .getAttribute("href"),
        "/led-screens",
      );
      assert.equal(
        await page.locator("video").count(),
        0,
        "Missing production video not requested",
      );
      await page.screenshot({
        path: `/private/tmp/homepage-${width}.png`,
        fullPage: false,
      });
    }
    pass(
      "Homepage, poster, CTAs, names and no overflow at all six requested widths",
    );
    assert.ok(
      (await page
        .locator("section")
        .filter({ has: page.locator("#organisations-heading") })
        .getByText("TO", { exact: true })
        .count()) > 0,
      "Broken logos use initials",
    );
    const track = page.locator(".organisation-track").first();
    assert.equal(
      await track.evaluate((e) => getComputedStyle(e).animationName),
      "organisation-scroll",
    );
    await page.locator(".organisation-row").first().hover();
    assert.equal(
      await track.evaluate((e) => getComputedStyle(e).animationPlayState),
      "paused",
    );
    await page.getByLabel("Pause scrolling").check();
    assert.equal(
      await track.evaluate((e) => getComputedStyle(e).animationPlayState),
      "paused",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await track.evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    assert.equal(await page.locator(".organisation-group:visible").count(), 1);
    const marqueeRow = page.locator(".organisation-row");
    await page.waitForFunction(() => {
      const row = document.querySelector(".organisation-row")!;
      return (
        getComputedStyle(row).overflowX === "auto" &&
        row.scrollWidth > row.clientWidth
      );
    });
    await marqueeRow.scrollIntoViewIfNeeded();
    await marqueeRow.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () => document.querySelector(".organisation-row")!.scrollLeft > 0,
    );
    assert.equal(await page.locator("video").count(), 0);
    pass(
      "Logo fallback, CSS animation, hover/pause control and reduced motion",
    );
    assert.ok(
      await page.getByText("From ₦850,000.00", { exact: true }).count(),
    );
    assert.ok(
      await page.getByText("₦850,000.00 / m²", { exact: true }).count(),
    );
    await page.goto(base + "/led-screens/test-display-0");
    assert.ok(
      await page
        .getByRole("heading", { name: "Test display 0", exact: true })
        .count(),
    );
    await page.goto(base + "/request-quote?product=test-display-0");
    assert.ok(
      !(await page.textContent("body"))?.includes(
        "selected product is unavailable",
      ),
    );
    pass("Product prices, details and quote product selection");
    await page
      .context()
      .addCookies([{ name: "led_admin_session", value: token, url: base }]);
    await page.goto(base + "/admin/organisations");
    await page
      .getByRole("button", {
        name: "Edit Edited test organisation",
        exact: true,
      })
      .waitFor();
    await page.getByLabel("Organisation Name").fill("UI test organisation");
    await page
      .getByRole("button", { name: "Save organisation", exact: true })
      .click();
    await page.getByText("Organisation saved.", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Edit UI test organisation", exact: true })
      .click();
    await page.getByLabel("Location", { exact: true }).fill("Test location");
    await page.getByLabel("active", { exact: true }).uncheck();
    await page
      .getByRole("button", { name: "Save organisation", exact: true })
      .click();
    await page.getByText("Organisation saved.", { exact: true }).waitFor();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Delete UI test organisation", exact: true })
      .click();
    await page.getByText("Organisation deleted.", { exact: true }).waitFor();
    pass(
      "Authenticated admin list and add/edit/deactivate/delete form interactions",
    );
    await api(`/api/organisations/${id}`, "DELETE");
    rows = await api("/api/organisations");
    assert.equal(rows.length, 9);
    for (const r of rows) await api(`/api/organisations/${r.id}`, "DELETE");
    await page.goto(base);
    assert.equal(await page.locator("#organisations-heading").count(), 0);
    pass("Delete and empty organisation homepage fallback");
    async function seed() {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--import", "tsx", "scripts/seed-organisations.ts"],
          {
            env: { ...process.env, MONGODB_URI: mongo.getUri("homepage_test") },
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
    await db
      .collection("clientorganisations")
      .updateOne(
        { slug: "madonna-university" },
        { $set: { name: "Manually edited name", active: false } },
      );
    await seed();
    assert.equal(
      await db.collection("clientorganisations").countDocuments(),
      10,
    );
    assert.equal(
      (
        await db
          .collection("clientorganisations")
          .findOne({ slug: "madonna-university" })
      )?.name,
      "Manually edited name",
    );
    pass("Idempotent supplied-name seed preserves manual edits");
    // Restore the edited test fixture, then verify the supplied data in real HTML.
    await db
      .collection("clientorganisations")
      .updateOne(
        { slug: "madonna-university" },
        { $set: { name: "Madonna University", active: true, logoUrl: null } },
      );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    for (const width of [375, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base);
      const section = page.locator(".organisation-section");
      await section.waitFor();
      for (const name of initialOrganisationNames)
        assert.ok(await section.getByText(name, { exact: true }).count(), name);
      assert.deepEqual(
        await page
          .locator("main > section")
          .evaluateAll((sections) =>
            sections
              .slice(0, 5)
              .map((s) => s.querySelector("h1,h2")?.textContent),
          ),
        [
          "Professional LED Display Solutions",
          "Our Services",
          "Featured LED Screens",
          "Electronic Digital Bell Systems",
          "LED Screen Cameras & Live Video Solutions",
        ],
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(
        await section.locator("img").count(),
        0,
        "All supplied records render without fabricated logos",
      );
      await section.screenshot({
        path: `/private/tmp/supplied-organisations-${width}.png`,
      });
    }
    assert.deepEqual(pageErrors, [], "No hydration or uncaught browser errors");
    pass(
      "All ten supplied names, null logos and exact Hero → Services → Catalogue → Bell → Cameras order at six widths",
    );

    await page.route("**/_next/image?**", (route) => route.abort());
    await page.goto(base);
    await page.waitForTimeout(300);
    assert.equal(
      await page.locator("h1").textContent(),
      "Professional LED Display Solutions",
    );
    assert.ok(
      await page
        .getByRole("link", { name: "Explore Products", exact: true })
        .isVisible(),
    );
    pass("Missing poster preserves readable hero and CTA");
    await mongo.stop();
    await page.goto(base);
    assert.equal(
      await page.locator("h1").textContent(),
      "Professional LED Display Solutions",
    );
    assert.equal(await page.locator("#organisations-heading").count(), 0);
    pass("Database outage leaves homepage usable");
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
