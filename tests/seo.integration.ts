// Isolated fixtures only: no Atlas data, real payments, messages or live credentials.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { SignJWT } from "jose";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined;
  let checks = 0;
  const base = "http://127.0.0.1:3120";
  const origin = "https://seo.example.test";
  const secret = "isolated-seo-test-secret-32-characters";
  const pass = (label: string) => {
    checks++;
    console.log(`PASS ${checks}: ${label}`);
  };
  try {
    await mongoose.connect(mongo.getUri("module20_test"));
    const db = mongoose.connection.db!;
    const admin = new Types.ObjectId(),
      category = new Types.ObjectId(),
      musicCategory = new Types.ObjectId();
    const date = new Date("2026-01-02T00:00:00Z");
    await db.collection("admins").insertOne({
      _id: admin,
      name: "SEO Test Owner",
      email: "seo@example.test",
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    await db.collection("businesssettings").insertOne({
      singletonKey: "primary",
      businessName: "SEO Fixture Business",
      description: "Actual fixture display services",
      seoDefaultTitle: "Display solutions for your project",
      seoDefaultDescription: "Fixture screens and support services.",
      ogImageUrl: "https://seo.example.test/share.png",
      googleSiteVerification: "fixture-google-token",
      bingSiteVerification: "fixture-bing-token",
      twitterHandle: "@fixture",
      addressLine1: "1 Fixture Road",
      city: "Fixture City",
      country: "Nigeria",
      updatedAt: date,
      createdAt: date,
    });
    await db.collection("productcategories").insertOne({
      _id: category,
      name: "Screens",
      slug: "screens",
      productType: "led-screen",
      active: true,
    });
    for (const [slug, productType, status, priceType] of [
      ["screen", "led-screen", "published", "fixed"],
      ["accessory", "led-accessory", "published", "quote"],
      ["bell", "bell-alarm-system", "published", "contact"],
      ["bell-accessory", "bell-alarm-accessory", "published", "fixed"],
      ["draft-screen", "led-screen", "draft", "fixed"],
      ["archived-screen", "led-screen", "archived", "fixed"],
    ]) {
      await db.collection("products").insertOne({
        name: slug,
        slug,
        productType,
        status,
        category,
        shortDescription: `Public description for ${slug}`,
        description: "Public equipment information",
        seoTitle: `SEO ${slug}`,
        seoDescription: `Metadata for ${slug}`,
        priceType,
        price: 100,
        currency: "NGN",
        stockStatus: "in-stock",
        featuredImageUrl: "https://seo.example.test/product.png",
        updatedAt: date,
        createdAt: date,
        createdBy: admin,
        updatedBy: admin,
      });
    }
    await db.collection("portfolioprojects").insertMany([
      {
        title: "Hidden Customer display",
        slug: "project",
        status: "published",
        shortDescription: "A display for Hidden Customer",
        seoTitle: "Hidden Customer project",
        seoDescription: "Work for Hidden Customer",
        customerName: "Hidden Customer",
        hideCustomerName: true,
        projectType: "led-installation",
        coverImageUrl: "https://seo.example.test/project.png",
        updatedAt: date,
        createdAt: date,
      },
      { title: "Draft project", slug: "draft-project", status: "draft" },
    ]);
    await db.collection("musiccategories").insertMany([
      {
        _id: musicCategory,
        name: "Hymns",
        slug: "hymns",
        description: "Published hymn selections",
        isActive: true,
        updatedAt: date,
        createdAt: date,
      },
      { name: "Inactive", slug: "inactive", isActive: false },
    ]);
    await db.collection("musicartists").insertMany([
      {
        name: "Fixture Artist",
        slug: "artist",
        bio: "An actual fixture artist biography",
        status: "published",
        updatedAt: date,
        createdAt: date,
      },
      { name: "Draft Artist", slug: "draft-artist", status: "draft" },
    ]);
    await db.collection("musiccontents").insertOne({
      title: "Fixture Hymn",
      slug: "hymn",
      artistName: "Fixture Artist",
      artistSlug: "artist",
      categoryId: musicCategory,
      status: "published",
      description: "Listen through the external provider.",
      coverImageUrl: "https://seo.example.test/hymn.png",
      sourceUrl: "https://www.youtube.com/watch?v=abcdefghijk",
      contentType: "song",
      updatedAt: date,
      createdAt: date,
    });
    await db.collection("galleryitems").insertOne({
      title: "Fixture Gallery",
      slug: "gallery-item",
      status: "published",
      mediaType: "image",
      imageUrl: "https://seo.example.test/full.jpg",
      thumbnailUrl: "https://seo.example.test/thumb.jpg",
      altText: "An installed display",
      updatedAt: date,
      createdAt: date,
    });
    await db.collection("testimonials").insertMany([
      {
        quote: "Approved public feedback",
        customerName: "Internal Testimonial Name",
        customerDisplayName: "Public Client",
        status: "published",
        consentConfirmed: true,
      },
      {
        quote: "Unapproved feedback",
        status: "published",
        consentConfirmed: false,
      },
    ]);
    const orderToken = "a".repeat(64);
    await db.collection("orders").insertOne({
      orderNumber: "SEO-ORDER-001",
      publicTokenHash: createHash("sha256").update(orderToken).digest("hex"),
      customerName: "Private Order Customer",
      customerEmail: "order@example.test",
      customerPhone: "1234567890",
      fulfilmentMethod: "pickup",
      items: [],
      subtotal: 100,
      total: 100,
      currency: "NGN",
      paymentStatus: "paid",
      orderStatus: "completed",
    });
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3120",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("module20_test"),
          AUTH_SECRET: secret,
          NEXT_PUBLIC_APP_URL: origin,
          ALLOW_SEARCH_INDEXING: "true",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let log = "";
    server.stderr?.on("data", (c) => (log += String(c)));
    for (let i = 0; i < 120; i++) {
      try {
        if ((await fetch(base + "/api/health")).ok) break;
      } catch {}
      await delay(250);
    }
    const get = async (path: string, cookie?: string) => {
      const response = await fetch(base + path, {
        headers: { "user-agent": "Googlebot", ...(cookie ? { cookie } : {}) },
        redirect: "manual",
      });
      return { response, html: await response.text() };
    };
    for (const path of [
      "/",
      "/about",
      "/contact",
      "/services",
      "/led-screens",
      "/led-accessories",
      "/rent-led-screen",
      "/led-installation",
      "/led-maintenance",
      "/electronic-bell-alarm",
      "/electronic-bell-alarm/products",
      "/electronic-bell-alarm/accessories",
      "/music",
      "/music/browse",
      "/music/artists",
      "/projects",
      "/gallery",
      "/testimonials",
      "/request-quote",
      "/led-screens/screen",
      "/led-accessories/accessory",
      "/electronic-bell-alarm/products/bell",
      "/electronic-bell-alarm/accessories/bell-accessory",
      "/projects/project",
      "/music/hymn",
      "/music/artists/artist",
      "/music/category/hymns",
      "/gallery/gallery-item",
    ]) {
      const { response, html } = await get(path);
      assert.equal(response.status, 200, `${path}: ${log.slice(-500)}`);
      assert.ok(
        /<title>[^<]+<\/title>/.test(html),
        path + " title: " + log.slice(-1500),
      );
      assert.match(html, /<meta name="description" content="[^"]+"/);
      assert.ok(
        html.includes(
          `rel="canonical" href="${origin}${path === "/" ? "" : path}"`,
        ),
        path + " canonical",
      );
      assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path + " h1");
      assert.equal(
        (html.match(/<main(?:\s|>)/g) || []).length,
        1,
        path + " main",
      );
      if (path === "/projects/project")
        assert.ok(!html.includes("Hidden Customer"));
      if (path === "/testimonials") {
        assert.ok(!html.includes("Internal Testimonial Name"));
        assert.ok(!html.includes("Unapproved feedback"));
      }
      const schemas = [
        ...html.matchAll(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
        ),
      ].map((m) => JSON.parse(m[1]));
      if (path === "/led-screens/screen")
        assert.equal(
          schemas.find((x) => x["@type"] === "Product").offers.price,
          100,
        );
      if (path === "/led-accessories/accessory")
        assert.equal(
          schemas.find((x) => x["@type"] === "Product").offers,
          undefined,
        );
      if (path === "/") {
        assert.ok(html.includes("fixture-google-token"));
        assert.ok(html.includes("fixture-bing-token"));
        assert.equal(
          schemas.find((x) => x["@type"] === "LocalBusiness").name,
          "SEO Fixture Business",
        );
      }
      pass(path + " metadata, landmarks and schema");
    }
    for (const path of [
      "/led-screens/missing",
      "/led-screens/draft-screen",
      "/led-screens/archived-screen",
      "/projects/missing",
      "/projects/draft-project",
      "/music/artists/missing",
      "/music/artists/draft-artist",
      "/music/category/missing",
      "/music/category/inactive",
      "/gallery/missing",
      "/music/missing",
      "/electronic-bell-alarm/products/bell-accessory",
    ]) {
      const { response, html } = await get(path);
      assert.ok(
        response.status === 404 ||
          (response.status === 200 &&
            /<meta name="robots" content="noindex"/.test(html)),
        path,
      );
    }
    pass(
      "Missing, draft, archived and wrong-type routes return 404 or streamed noindex",
    );
    for (const path of [
      "/cart",
      "/checkout",
      "/payment/callback",
      "/orders/missing",
      "/admin/login",
      "/admin/forgot-password",
      "/rent-led-screen/request",
      "/led-installation/request",
      "/led-maintenance/request",
      "/electronic-bell-alarm/request",
    ]) {
      const { html } = await get(path);
      assert.match(html, /<meta name="robots" content="noindex/, path);
    }
    pass("Private, auth, transaction and request routes noindex");
    const orderPage = await get(`/orders/${orderToken}`);
    assert.equal(orderPage.response.status, 200);
    assert.match(orderPage.html, /noindex, nofollow/);
    assert.ok(!orderPage.html.includes('rel="canonical"'));
    assert.ok(orderPage.html.includes("SEO-ORDER-001"));
    pass(
      "Valid tokenized order remains functional without an indexable canonical",
    );

    const token = await new SignJWT({ sessionVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(admin))
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    const dashboard = await get("/admin", `led_admin_session=${token}`);
    assert.equal(dashboard.response.status, 200);
    assert.match(dashboard.html, /noindex, nofollow/);
    pass("Authenticated admin dashboard renders and is noindex");
    const sitemap = await get("/sitemap.xml");
    assert.equal(sitemap.response.status, 200);
    assert.ok(sitemap.html.includes("<urlset"));
    for (const path of [
      "/led-screens/screen",
      "/projects/project",
      "/music/hymn",
      "/music/artists/artist",
    ])
      assert.ok(sitemap.html.includes(origin + path));
    for (const privatePart of [
      "draft-screen",
      "archived-screen",
      "draft-project",
      "draft-artist",
      "/admin",
      "/checkout",
      "/cart",
      "/orders",
      "/payment",
      "/quotation",
    ])
      assert.ok(!sitemap.html.includes(privatePart));
    assert.ok(sitemap.html.includes("2026-01-02"));
    pass("Sitemap publication filtering, absolute URLs and real lastmod");
    const robots = await get("/robots.txt");
    assert.equal(robots.response.status, 200);
    for (const path of [
      "/admin",
      "/api/",
      "/orders/",
      "/payment/",
      "/quotation/",
    ])
      assert.ok(robots.html.includes(`Disallow: ${path}`));
    pass("robots.txt private-path exclusions");
    assert.equal(
      (await get("/api/health")).response.headers.get("x-robots-tag"),
      "noindex, nofollow",
    );
    assert.match(
      (await get("/led-screens?search=screen")).html,
      /<meta name="robots" content="noindex, follow"/,
    );
    pass("API headers and internal search noindex");
    const chrome =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      await page.goto(base + "/");
      assert.equal(await page.locator("h1").count(), 1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await page.goto(base + "/music/browse");
      assert.equal(await page.locator("iframe").count(), 0);
      await page.goto(base + "/gallery");
      assert.ok(
        (await page.locator("main img").first().getAttribute("src"))?.includes(
          "thumb.jpg",
        ),
      );
      pass("Mobile overflow, music listing without embeds, gallery thumbnails");
    } finally {
      await browser.close();
    }
    for (const indexing of ["true", "false"]) {
      const port = indexing === "true" ? 3121 : 3122;
      const modeServer = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
          "-p",
          String(port),
          "-H",
          "127.0.0.1",
        ],
        {
          env: {
            ...process.env,
            NODE_ENV: "production",
            MONGODB_URI: "",
            NEXT_PUBLIC_APP_URL: origin,
            ALLOW_SEARCH_INDEXING: indexing,
          },
          stdio: "ignore",
        },
      );
      try {
        const modeBase = `http://127.0.0.1:${port}`;
        for (let i = 0; i < 120; i++) {
          try {
            if ((await fetch(modeBase + "/api/health")).ok) break;
          } catch {}
          await delay(250);
        }
        const map = await (await fetch(modeBase + "/sitemap.xml")).text();
        const rules = await (await fetch(modeBase + "/robots.txt")).text();
        const about = await (
          await fetch(modeBase + "/about", {
            headers: { "user-agent": "Bingbot" },
          })
        ).text();
        assert.ok(about.includes("<title>About us"));
        if (indexing === "true") {
          assert.ok(map.includes(origin + "/about"));
          assert.ok(!map.includes("/led-screens/screen"));
        } else {
          assert.ok(!map.includes("<url>"));
          assert.ok(rules.includes("Disallow: /"));
          assert.match(about, /noindex, nofollow/);
        }
      } finally {
        modeServer.kill("SIGTERM");
      }
    }
    pass(
      "Database-unavailable metadata/sitemap fallback and explicit staging noindex",
    );
    console.log(`SEO integration: ${checks} checks passed.`);
  } finally {
    server?.kill("SIGTERM");
    await mongoose.disconnect();
    await mongo.stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
