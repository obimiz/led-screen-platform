// All mutations target an ephemeral MongoDB instance and generated/disposable records.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync, readFileSync } from "node:fs";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { chromium, type Browser } from "@playwright/test";
import { hash } from "bcryptjs";
async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let browser: Browser | undefined, server: ChildProcess | undefined;
  const base = "http://127.0.0.1:3157";
  let checks = 0;
  const pass = (label: string) => console.log(`PASS ${++checks}: ${label}`);
  let serverLog = "";
  try {
    await mongoose.connect(mongo.getUri("publishing_test"));
    const db = mongoose.connection.db!,
      productCategoryId = new Types.ObjectId(),
      adminId = new Types.ObjectId(),
      productId = new Types.ObjectId(),
      galleryId = new Types.ObjectId(),
      orgId = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: adminId,
      name: "Publishing Test Owner",
      email: "publishing@example.test",
      passwordHash: await hash("PublishingTest2026!", 10),
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    await db.collection("businesssettings").insertOne({
      singletonKey: "primary",
      businessName: "Publishing Test Business",
      createdAt: new Date("2020-01-01"),
      updatedAt: new Date("2020-01-01"),
    });
    await db.collection("productcategories").insertOne({
      _id: productCategoryId,
      name: "Synthetic displays",
      slug: "synthetic-displays",
      productType: "led-screen",
      active: true,
    });
    await db.collection("products").insertOne({
      _id: productId,
      name: "Unchanged synthetic product",
      slug: "unchanged-synthetic-product",
      category: productCategoryId,
      priceType: "contact",
      productType: "led-screen",
      status: "published",
      featured: true,
      featuredImageUrl: "/branding/image-grant-technology-logo.jpeg",
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("galleryitems").insertOne({
      _id: galleryId,
      title: "Unchanged synthetic gallery fixture",
      slug: "unchanged-gallery-fixture",
      status: "draft",
      mediaType: "image",
      imageUrl: "/branding/image-grant-technology-logo.jpeg",
    });
    await db.collection("organisations").insertOne({
      _id: orgId,
      name: "Unchanged synthetic organisation",
      isActive: false,
    });
    const snapshots = await Promise.all(
      ["products", "galleryitems", "organisations"].map((c, i) =>
        db.collection(c).findOne({ _id: [productId, galleryId, orgId][i] }),
      ),
    );
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3157",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("publishing_test"),
          AUTH_SECRET: "publishing-test-secret-with-at-least-32-characters",
          ALLOW_SEARCH_INDEXING: "true",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stderr?.on("data", (c) => (serverLog += String(c)));
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
    assert.ok(ready, serverLog);
    for (const route of [
      "/api/portfolio",
      "/api/portfolio/categories",
      "/api/product-images",
    ]) {
      assert.equal(
        (
          await fetch(base + route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          })
        ).status,
        401,
      );
    }
    assert.equal((await fetch(base + "/api/portfolio")).status, 401);
    assert.equal(
      (await fetch(base + "/api/portfolio/categories?admin=1")).status,
      401,
    );
    pass(
      "unauthorised CMS mutations, private listings and media uploads are rejected",
    );
    const chrome =
      process.env.IGT_TEST_BROWSER ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      timezoneId: "Africa/Lagos",
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/admin/login");
    await page
      .getByLabel("Email address", { exact: true })
      .filter({ visible: true })
      .fill("publishing@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .filter({ visible: true })
      .fill("PublishingTest2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/admin");
    const cookie = (await page.context().cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    async function request(
      path: string,
      method = "GET",
      data?: unknown,
      origin = base,
    ) {
      return page.request.fetch(base + path, {
        method,
        headers: { Cookie: cookie, Origin: origin },
        ...(data === undefined ? {} : { data }),
      });
    }
    async function api(path: string, method = "GET", data?: unknown) {
      const r = await request(path, method, data);
      const b = await r.json();
      assert.ok(r.ok(), `${method} ${path}: ${JSON.stringify(b)}`);
      return b.data;
    }
    async function feedbackSave(preview = false) {
      await page
        .waitForURL(
          preview
            ? /\/admin\/blog\/[^/]+\/preview$/
            : /\/admin\/blog\?saved=1$/,
        )
        .catch(async (e) => {
          console.error(
            "Save feedback:",
            await page.locator("form").innerText(),
          );
          console.error(serverLog);
          throw e;
        });
    }
    await page
      .getByRole("link", { name: "Blog & Projects", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Manage categories", exact: true })
      .click();
    await page
      .getByLabel("New category name")
      .filter({ visible: true })
      .fill("Company News");
    await page
      .getByRole("combobox", { name: /Category type/ })
      .first()
      .selectOption("article");
    await page
      .getByRole("button", { name: "Create category", exact: true })
      .click();
    await page
      .getByText("Category created", { exact: true })
      .filter({ visible: true })
      .waitFor();
    let categories = await api("/api/portfolio/categories?admin=1");
    const articleCategory = categories.find(
      (c: { name: string }) => c.name === "Company News",
    );
    assert.ok(articleCategory);
    await page
      .getByLabel("New category name")
      .filter({ visible: true })
      .fill("LED Screen Installation");
    await page
      .getByRole("combobox", { name: /Category type/ })
      .first()
      .selectOption("project");
    const categoryResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/portfolio/categories") &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Create category", exact: true })
      .click();
    assert.equal((await categoryResponse).status(), 201);
    categories = await api("/api/portfolio/categories?admin=1");
    const projectCategory = categories.find(
      (c: { name: string }) => c.name === "LED Screen Installation",
    );
    assert.ok(projectCategory);
    assert.equal(
      (
        await request("/api/portfolio/categories", "POST", {
          name: "company news",
          scope: "article",
        })
      ).status(),
      409,
    );
    pass(
      "real admin login, sidebar navigation and dynamic scoped categories with duplicate protection",
    );
    await page.goto(base + "/admin/blog");
    await page
      .getByRole("link", { name: "Add blog article", exact: true })
      .click();
    await page
      .getByLabel("Title", { exact: true })
      .filter({ visible: true })
      .fill("Disposable technology insight");
    await page
      .getByRole("combobox", { name: /^Category/ })
      .selectOption(articleCategory.id);
    await page
      .getByLabel("Author", { exact: true })
      .filter({ visible: true })
      .fill("Test editor");
    await page
      .getByLabel("Publication date (optional)")
      .filter({ visible: true })
      .fill("2026-10-01T09:30");
    await page
      .getByLabel("Short excerpt", { exact: true })
      .filter({ visible: true })
      .fill(
        "A disposable article created to verify the full publishing workflow.",
      );
    await page
      .getByLabel("Tags (comma separated)")
      .filter({ visible: true })
      .fill("technology,testing,");
    const editor = page.getByRole("textbox", {
      name: "Detailed content",
      exact: true,
    });
    await editor.fill(
      "A formatted article body with useful technology information.",
    );
    await editor.press("ControlOrMeta+A");
    await page.getByRole("button", { name: "Bold", exact: true }).click();
    await editor.press("ArrowRight");
    await editor.type(" Bold content");
    await page.getByRole("button", { name: "Bold", exact: true }).click();
    const png = readFileSync(
      "public/Images/bell-alarm/digital-school-bell.png",
    );
    const coverResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/product-images") &&
        r.request().method() === "POST",
    );
    await page
      .getByLabel("Upload cover image", { exact: true })
      .filter({ visible: true })
      .setInputFiles({
        name: "disposable-cover.png",
        mimeType: "image/png",
        buffer: png,
      });
    assert.equal((await coverResponse).status(), 201);
    await page
      .getByLabel("Cover alternative text")
      .filter({ visible: true })
      .fill("A disposable cover photograph for the test article");
    await page
      .getByLabel("Inline image alt text")
      .filter({ visible: true })
      .fill("An inline equipment photograph used by this test");
    const inlineResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/product-images") &&
        r.request().method() === "POST",
    );
    await page
      .getByLabel(/^Insert image/)
      .filter({ visible: true })
      .setInputFiles({
        name: "inline.png",
        mimeType: "image/png",
        buffer: png,
      });
    assert.equal((await inlineResponse).status(), 201);
    await page
      .getByText("Image inserted. Save the post to apply changes.")
      .filter({ visible: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Save & Preview", exact: true })
      .click();
    await feedbackSave(true);
    await page
      .getByText(/Administrator preview · draft/)
      .filter({ visible: true })
      .waitFor();
    let rows = await api("/api/portfolio"),
      article = rows.rows[0];
    assert.equal(article.status, "draft");
    assert.equal(article.publishedAt, "2026-10-01T09:30:00.000Z");
    assert.ok(article.richContent);
    assert.ok(JSON.stringify(article.richContent).includes("bold"));
    assert.ok(JSON.stringify(article.richContent).includes("image"));
    assert.ok(
      (await page.locator("main").last().innerText()).includes(
        "A formatted article body",
      ),
    );
    const draftHtml = await (
      await fetch(base + `/blog/${article.slug}`)
    ).text();
    assert.ok(!draftHtml.includes(article.title));
    assert.ok(!draftHtml.includes(article.coverImageUrl));
    assert.ok(
      !(await (await fetch(base + "/sitemap.xml")).text()).includes(
        `/blog/${article.slug}`,
      ),
    );
    assert.equal(
      (await fetch(base + `/api/portfolio/${article.id}`)).status,
      401,
    );
    const privatePreview = await fetch(
      base + `/admin/blog/${article.id}/preview`,
      { redirect: "manual" },
    );
    assert.ok([303, 307, 308].includes(privatePreview.status));
    pass(
      "cover/inline image upload, formatted draft persistence, authenticated preview and draft privacy",
    );
    await page
      .getByRole("link", { name: "Continue editing", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Title", { exact: true })
        .filter({ visible: true })
        .inputValue(),
      article.title,
    );
    assert.ok((await editor.innerText()).includes("Bold content"));
    await page
      .getByRole("button", { name: "Publish post", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Confirm permission" })
      .waitFor();
    await page
      .getByLabel(/^I confirm permission to publish/)
      .filter({ visible: true })
      .check();
    await page
      .getByLabel("Featured", { exact: true })
      .filter({ visible: true })
      .check();
    await page
      .locator("summary")
      .filter({ hasText: "Search engine metadata" })
      .click();
    await page
      .getByLabel("SEO title", { exact: true })
      .filter({ visible: true })
      .fill("Technology insight SEO title");
    await page
      .getByLabel("SEO description", { exact: true })
      .filter({ visible: true })
      .fill(
        "A concise verified description for the disposable technology insight.",
      );
    await page
      .getByRole("button", { name: "Publish post", exact: true })
      .click();
    await feedbackSave();
    article = await api(`/api/portfolio/${article.id}`);
    assert.equal(article.status, "published");
    assert.ok(article.publishedAt);
    const conflicting = await api("/api/portfolio", "POST", {
      title: "Disposable duplicate draft",
      slug: article.slug,
      contentType: "article",
      shortDescription: "Another disposable draft article.",
      description: "Draft body",
    });
    assert.notEqual(conflicting.slug, article.slug);
    const malicious = await request(`/api/portfolio/${article.id}`, "PUT", {
      richContent: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Unsafe link",
                marks: [
                  { type: "link", attrs: { href: "javascript:alert(1)" } },
                ],
              },
            ],
          },
        ],
      },
    });
    assert.equal(malicious.status(), 422);
    assert.equal(
      (
        await request(
          `/api/portfolio/${article.id}`,
          "PUT",
          { title: "Unwanted change" },
          "https://evil.example",
        )
      ).status(),
      403,
    );
    assert.equal(
      (
        await request(
          "/api/portfolio/categories",
          "POST",
          { name: "Evil category" },
          "https://evil.example",
        )
      ).status(),
      403,
    );
    assert.equal(
      (await api(`/api/portfolio/${article.id}`)).title,
      article.title,
    );
    pass(
      "permission-gated publication, featured state, safe rich content and slug conflict handling",
    );
    const visitor = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      publicPage = await visitor.newPage();
    publicPage.on("pageerror", (e) => errors.push(e.message));
    await publicPage.goto(base + `/blog/${article.slug}`);
    await publicPage
      .getByRole("heading", { name: article.title, exact: true })
      .waitFor();
    assert.match(await publicPage.title(), /^Technology insight SEO title/);
    assert.ok(
      (
        await publicPage.locator("link[rel=canonical]").getAttribute("href")
      )?.endsWith(`/blog/${article.slug}`),
    );
    assert.equal(
      await publicPage
        .locator('meta[property="og:type"]')
        .getAttribute("content"),
      "article",
    );
    assert.equal(
      await publicPage
        .locator("meta[name=description]")
        .getAttribute("content"),
      article.seoDescription,
    );
    assert.ok(
      (
        await publicPage
          .locator('script[type="application/ld+json"]')
          .allTextContents()
      ).some((t) => t.includes("BlogPosting") && t.includes("Test editor")),
    );
    assert.ok(
      await publicPage
        .getByRole("link", { name: "Facebook", exact: true })
        .count(),
    );
    assert.ok(await publicPage.locator("main strong").count());
    assert.ok(
      (await (await fetch(base + "/sitemap.xml")).text()).includes(
        `/blog/${article.slug}`,
      ),
    );
    await publicPage.goto(base + "/blog");
    await publicPage
      .getByRole("heading", { name: "Featured articles", exact: true })
      .waitFor();
    await publicPage
      .getByRole("textbox", { name: "Search articles", exact: true })
      .fill("technology");
    await publicPage
      .getByRole("combobox", { name: /^Category/ })
      .selectOption(articleCategory.id);
    await publicPage
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await publicPage.waitForURL(/q=technology/);
    await publicPage
      .getByRole("link", { name: article.title, exact: true })
      .waitFor();
    assert.equal(
      await publicPage.locator("meta[name=robots]").getAttribute("content"),
      "noindex, follow",
    );
    await publicPage
      .getByRole("textbox", { name: "Search articles", exact: true })
      .fill("[");
    await publicPage
      .getByRole("button", { name: "Search", exact: true })
      .click();
    await publicPage.waitForURL(/q=%5B/);
    await publicPage
      .getByText("No posts match your filters.")
      .filter({ visible: true })
      .waitFor();
    assert.ok((await (await fetch(base)).text()).includes(article.title));
    pass(
      "public article rendering, rich text, sharing, SEO, search/category filters and homepage integration",
    );
    await page.goto(base + "/admin/blog/new?type=project");
    await page
      .getByLabel("Title", { exact: true })
      .filter({ visible: true })
      .fill("Disposable completed installation");
    await page
      .getByRole("combobox", { name: /^Category/ })
      .selectOption(projectCategory.id);
    await page
      .getByLabel("Client or organisation (private unless approved)", {
        exact: true,
      })
      .filter({ visible: true })
      .fill("Private Test Organisation");
    await page
      .getByLabel("Approved public client display name")
      .filter({ visible: true })
      .fill("Approved Test Organisation");
    await page
      .getByLabel("Project location / city (optional)")
      .filter({ visible: true })
      .fill("Test location");
    await page
      .getByLabel("Completion date", { exact: true })
      .filter({ visible: true })
      .fill("2026-10-01");
    await page
      .getByLabel("Short project description")
      .filter({ visible: true })
      .fill("A disposable completed installation with approved photographs.");
    await editor.fill(
      "Private Test Organisation commissioned this synthetic test installation.",
    );
    await page
      .getByLabel("Services delivered (one per line)")
      .filter({ visible: true })
      .fill("Screen installation\nCommissioning");
    await page
      .getByLabel("Equipment / LED screen types used (one per line)")
      .filter({ visible: true })
      .fill("Synthetic display equipment");
    const projectCover = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/product-images") &&
        r.request().method() === "POST",
    );
    await page
      .getByLabel("Upload cover image", { exact: true })
      .filter({ visible: true })
      .setInputFiles({
        name: "project-cover.png",
        mimeType: "image/png",
        buffer: png,
      });
    assert.equal((await projectCover).status(), 201);
    await page
      .getByLabel("Cover alternative text")
      .filter({ visible: true })
      .fill("Completed test installation cover");
    await page
      .getByLabel("Upload additional photographs", { exact: true })
      .filter({ visible: true })
      .setInputFiles([
        { name: "project-one.png", mimeType: "image/png", buffer: png },
        { name: "project-two.png", mimeType: "image/png", buffer: png },
      ]);
    await page
      .getByLabel("Photograph 2 alternative text")
      .filter({ visible: true })
      .waitFor();
    await page
      .getByLabel("Photograph 1 alternative text")
      .filter({ visible: true })
      .fill("First test project photograph");
    await page
      .getByLabel("Photograph 2 alternative text")
      .filter({ visible: true })
      .fill("Second test project photograph");
    await page
      .getByRole("button", { name: "Move photograph 2 earlier", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Photograph 1 alternative text")
        .filter({ visible: true })
        .inputValue(),
      "Second test project photograph",
    );
    await page
      .getByLabel(/^I confirm permission to publish/)
      .filter({ visible: true })
      .check();
    await page
      .getByLabel("Featured", { exact: true })
      .filter({ visible: true })
      .check();
    await page
      .getByRole("button", { name: "Publish post", exact: true })
      .click();
    await feedbackSave();
    rows = await api("/api/portfolio?type=project");
    let project = rows.rows[0];
    assert.equal(project.imageUrls.length, 2);
    assert.equal(project.imageAlts[0], "Second test project photograph");
    assert.equal(project.status, "published");
    const incomplete = await request(`/api/portfolio/${project.id}`, "PUT", {
      projectStatus: "in-progress",
    });
    assert.equal(incomplete.status(), 422);
    assert.equal(
      (
        await request(`/api/portfolio/${project.id}`, "PUT", {
          hideCustomerName: false,
          clientPermissionConfirmed: false,
        })
      ).status(),
      422,
    );
    assert.equal(
      (
        await request(`/api/portfolio/${project.id}`, "PUT", {
          categoryId: articleCategory.id,
        })
      ).status(),
      400,
    );
    await publicPage.goto(base + `/projects/${project.slug}`);
    await publicPage
      .getByRole("heading", { name: project.title, exact: true })
      .waitFor();
    const html = await publicPage.content();
    assert.ok(!html.includes("Private Test Organisation"));
    assert.ok(!html.includes("Approved Test Organisation"));
    assert.ok(html.includes("Private client commissioned"));
    await publicPage
      .getByRole("button", { name: "Enlarge photograph 1", exact: true })
      .click();
    await publicPage
      .getByRole("dialog", { name: "Project photograph viewer" })
      .waitFor();
    await publicPage.keyboard.press("ArrowRight");
    await publicPage
      .getByRole("dialog")
      .getByText(/2 \/ 2/)
      .filter({ visible: true })
      .waitFor();
    await publicPage.keyboard.press("Escape");
    assert.equal(await publicPage.getByRole("dialog").count(), 0);
    const whatsapp = await publicPage
      .getByRole("link", {
        name: "Enquire about a similar project",
        exact: true,
      })
      .getAttribute("href");
    assert.ok(whatsapp?.startsWith("https://wa.me/2348039308982?text="));
    assert.ok(whatsapp?.includes(encodeURIComponent(project.title)));
    pass(
      "completed project publication, multi-image ordering/lightbox, permissions, client privacy and official WhatsApp enquiry",
    );
    await page.goto(base + `/admin/blog/${project.id}/edit`);
    await page
      .getByLabel("Display the approved client name publicly")
      .filter({ visible: true })
      .check();
    await page
      .getByLabel(
        "The client has approved publication of their name and project information.",
      )
      .filter({ visible: true })
      .check();
    await page
      .getByLabel("Title", { exact: true })
      .filter({ visible: true })
      .fill("Updated disposable installation");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await feedbackSave();
    project = await api(`/api/portfolio/${project.id}`);
    await publicPage.goto(base + `/projects/${project.slug}`);
    await publicPage
      .getByText("Approved Test Organisation", { exact: true })
      .filter({ visible: true })
      .waitFor();
    assert.ok((await (await fetch(base)).text()).includes(project.title));
    await api(`/api/portfolio/categories/${projectCategory.id}`, "PUT", {
      name: "Approved installation work",
      isActive: false,
    });
    await api(`/api/portfolio/${project.id}`, "PUT", { sortOrder: 1 });
    assert.equal(
      (await api(`/api/portfolio/${project.id}`)).categoryId,
      projectCategory.id,
    );
    assert.equal(
      (
        await request(
          `/api/portfolio/categories/${projectCategory.id}`,
          "PUT",
          { scope: "article" },
        )
      ).status(),
      400,
    );
    pass(
      "editing preserves images and rich content, approved client identity and inactive category associations",
    );
    for (const width of [390, 768, 1440]) {
      await publicPage.setViewportSize({ width, height: 900 });
      for (const path of [
        "/blog",
        "/projects",
        `/blog/${article.slug}`,
        `/projects/${project.slug}`,
      ]) {
        await publicPage.goto(base + path);
        assert.ok(
          await publicPage.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${path} overflows at ${width}`,
        );
      }
      await publicPage.screenshot({
        path: `/private/tmp/publishing-public-${width}.png`,
      });
      await publicPage.goto(base + "/");
      if (width < 1280) {
        await publicPage
          .getByRole("button", { name: "Open navigation", exact: true })
          .click();
        await publicPage
          .getByRole("navigation", { name: "Mobile navigation", exact: true })
          .getByRole("link", { name: "Blog", exact: true })
          .click();
        assert.equal(
          await publicPage
            .getByRole("navigation", { name: "Mobile navigation", exact: true })
            .count(),
          0,
        );
      } else {
        await publicPage
          .locator('summary[aria-controls="public-more-navigation"]')
          .click();
        await publicPage
          .locator("#public-more-navigation")
          .getByRole("link", { name: "LED Installation", exact: true })
          .click();
        assert.equal(await publicPage.locator("details[open]").count(), 0);
      }
    }
    pass(
      "desktop/tablet/mobile content layouts and dropdown navigation close correctly",
    );
    await page.goto(base + "/admin/blog?q=Disposable+technology");
    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await page.getByRole("button", { name: "Publish", exact: true }).waitFor();
    assert.ok(
      !(await (await fetch(base + `/blog/${article.slug}`)).text()).includes(
        article.title,
      ),
    );
    assert.ok(
      !(await (await fetch(base + "/sitemap.xml")).text()).includes(
        `/blog/${article.slug}`,
      ),
    );
    assert.ok(!(await (await fetch(base)).text()).includes(article.title));
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    assert.equal((await api(`/api/portfolio/${article.id}`)).status, "draft");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await page
      .locator("article")
      .filter({ hasText: article.title })
      .getByText(/· archived/)
      .filter({ visible: true })
      .waitFor();
    assert.equal(
      (await api(`/api/portfolio/${article.id}`)).status,
      "archived",
    );
    const imageCount = await db
      .collection("productimageassets")
      .countDocuments();
    assert.ok(imageCount >= 5);
    assert.equal(
      (
        await request(`/api/portfolio/${conflicting.id}`, "DELETE", {})
      ).status(),
      400,
    );
    await page.goto(
      base + `/admin/blog?q=${encodeURIComponent(conflicting.title)}`,
    );
    const deleteButtons = page.getByRole("button", {
      name: "Delete",
      exact: true,
    });
    page.once("dialog", (d) => d.dismiss());
    await deleteButtons.first().click();
    assert.ok(
      await db
        .collection("portfolioprojects")
        .findOne({ _id: new Types.ObjectId(article.id) }),
    );
    await page.goto(
      base + `/admin/blog?q=${encodeURIComponent(project.title)}`,
    );
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByText("No posts match these filters.", { exact: false })
      .filter({ visible: true })
      .waitFor();
    assert.equal(
      await db
        .collection("portfolioprojects")
        .findOne({ _id: new Types.ObjectId(project.id) }),
      null,
    );
    assert.equal(
      await db.collection("productimageassets").countDocuments(),
      imageCount,
    );
    assert.ok(
      !(await (await fetch(base + "/sitemap.xml")).text()).includes(
        `/projects/${project.slug}`,
      ),
    );
    pass(
      "unpublish/archive hide public content and sitemap entries; confirmed deletion preserves all media assets",
    );
    const stored = await db
      .collection("portfolioprojects")
      .findOne({ _id: new Types.ObjectId(article.id) });
    for (let i = 0; i < 14; i++)
      await db.collection("portfolioprojects").insertOne({
        ...stored,
        _id: new Types.ObjectId(),
        slug: `pagination-${i}`,
        title: `Pagination fixture ${i}`,
        status: "draft",
      });
    const first = await api("/api/portfolio"),
      second = await api("/api/portfolio?page=2");
    assert.equal(first.rows.length, 12);
    assert.ok(second.rows.length > 0);
    await page.goto(base + "/admin/blog");
    await page.getByRole("link", { name: "Next page →", exact: true }).click();
    await page.waitForURL(/page=2/);
    await page
      .getByText(/Page 2 of/)
      .filter({ visible: true })
      .first()
      .waitFor();
    await page.setViewportSize({ width: 390, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: "/private/tmp/publishing-admin-390.png" });
    for (const path of [
      "/led-screens",
      "/gallery",
      "/music",
      "/admin/products",
      "/admin/gallery",
      "/admin/music",
    ]) {
      const r = await page.goto(base + path);
      if (r?.status() !== 200) console.error(serverLog);
      assert.equal(r?.status(), 200, path);
    }
    const after = await Promise.all(
      ["products", "galleryitems", "organisations"].map((c, i) =>
        db.collection(c).findOne({ _id: [productId, galleryId, orgId][i] }),
      ),
    );
    assert.deepEqual(after, snapshots);
    assert.deepEqual(errors, []);
    await visitor.close();
    pass(
      "efficient admin pagination, responsive admin, existing modules and unchanged business fixtures",
    );
    console.log(`Publishing integration: ${checks} checks passed.`);
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
