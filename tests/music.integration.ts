// Disposable fixtures in ephemeral MongoDB; never connects to the business database.
import assert from "node:assert/strict";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync, readFileSync } from "node:fs";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { chromium, type Browser } from "@playwright/test";
import { hash } from "bcryptjs";
function recording(frequency = 220) {
  const sampleRate = 8000,
    samples = sampleRate * 10,
    data = Buffer.alloc(44 + samples * 2);
  data.write("RIFF");
  data.writeUInt32LE(data.length - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24);
  data.writeUInt32LE(sampleRate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    data.writeInt16LE(
      Math.round(3000 * Math.sin((2 * Math.PI * frequency * i) / sampleRate)),
      44 + i * 2,
    );
  return data;
}
async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let browser: Browser | undefined, server: ChildProcess | undefined;
  const base = "http://127.0.0.1:3156";
  let checks = 0;
  const pass = (label: string) => console.log(`PASS ${++checks}: ${label}`);
  try {
    await mongoose.connect(mongo.getUri("music_test"));
    const musicCollection = mongoose.connection.db!.collection("musiccontents");
    await musicCollection.createIndex({
      title: "text",
      artistName: "text",
      albumTitle: "text",
      description: "text",
      tags: "text",
    });
    const legacy = {
      _id: new Types.ObjectId(),
      title: "Legacy index fixture",
      language: "english",
    };
    await musicCollection.insertOne(legacy);
    execFileSync(
      process.execPath,
      ["--import", "tsx", "scripts/repair-music-index.ts", "--apply"],
      {
        env: { ...process.env, MONGODB_URI: mongo.getUri("music_test") },
      },
    );
    assert.deepEqual(
      await musicCollection.findOne({ _id: legacy._id }),
      legacy,
    );
    assert.equal(
      (await musicCollection.listIndexes().toArray()).find(
        (i) => i.key._fts === "text",
      )?.language_override,
      "musicTextIndexLanguage",
    );
    await musicCollection.deleteOne({ _id: legacy._id });
    pass(
      "legacy text-index repair preserves documents and decouples music language metadata",
    );
    const db = mongoose.connection.db!,
      adminId = new Types.ObjectId(),
      productId = new Types.ObjectId(),
      productCategoryId = new Types.ObjectId();
    await db.collection("admins").insertOne({
      _id: adminId,
      name: "Music Test Owner",
      email: "music@example.test",
      passwordHash: await hash("MusicTestPassword2026!", 10),
      role: "owner",
      isActive: true,
      sessionVersion: 0,
    });
    await db.collection("businesssettings").insertOne({
      singletonKey: "primary",
      businessName: "Music Test Business",
      createdAt: new Date("2020-01-01"),
      updatedAt: new Date("2020-01-01"),
    });
    await db.collection("productcategories").insertOne({
      _id: productCategoryId,
      name: "Synthetic products",
      slug: "synthetic-products",
      productType: "led-screen",
      active: true,
    });
    await db.collection("products").insertOne({
      _id: productId,
      name: "Unchanged synthetic display",
      slug: "unchanged-synthetic-display",
      category: productCategoryId,
      productType: "led-screen",
      status: "published",
      featured: true,
      priceType: "contact",
      featuredImageUrl: "/branding/image-grant-technology-logo.jpeg",
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const productBefore = await db
      .collection("products")
      .findOne({ _id: productId });
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3156",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("music_test"),
          AUTH_SECRET: "isolated-music-secret-at-least-32-characters",
          MUSIC_AUDIO_MAX_BYTES: String(1024 * 1024),
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let log = "";
    server.stderr?.on("data", (c) => (log += String(c)));
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
    assert.ok(ready, log);
    for (const route of [
      "/api/music",
      "/api/music/categories",
      "/api/music/audio",
    ]) {
      const r = await fetch(base + route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(r.status, 401);
    }
    assert.equal((await fetch(base + "/api/music?admin=1")).status, 401);
    assert.equal((await fetch(base + "/api/music/audio")).status, 401);
    pass(
      "unauthorised metadata mutations, upload and private library access are rejected",
    );
    const chrome =
      process.env.IGT_TEST_BROWSER ||
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
    browser = await chromium.launch({
      headless: true,
      args: ["--autoplay-policy=no-user-gesture-required"],
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/admin/login");
    await page
      .getByLabel("Email address", { exact: true })
      .fill("music@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("MusicTestPassword2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/admin");
    const cookie = (await page.context().cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    async function api(path: string, method = "GET", data?: unknown) {
      const r = await page.request.fetch(base + path, {
        method,
        headers: { Cookie: cookie, Origin: base },
        ...(data === undefined ? {} : { data }),
      });
      const b = await r.json();
      assert.ok(r.ok(), `${method} ${path}: ${JSON.stringify(b)}`);
      return b.data;
    }
    await page
      .getByRole("link", { name: "Music & Audio", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Manage music categories", exact: true })
      .click();
    await page.getByLabel("New category name").fill("Catholic Hymns");
    await page
      .getByRole("button", { name: "Create category", exact: true })
      .click();
    await page.getByText("Category created", { exact: true }).waitFor();
    const categories = await api("/api/music/categories"),
      category = categories[0];
    assert.ok(category.id);
    const duplicate = await page.request.post(base + "/api/music/categories", {
      headers: { Cookie: cookie, Origin: base },
      data: { name: "catholic hymns" },
    });
    assert.equal(duplicate.status(), 409);
    const other = await api("/api/music/categories", "POST", {
      name: "Instrumental Music",
    });
    pass(
      "real admin login, sidebar and dynamic category creation with duplicate protection",
    );
    await page.goto(base + "/admin/music");
    await page.getByRole("link", { name: "Add music", exact: true }).click();
    await page
      .getByLabel("Song title", { exact: true })
      .fill("Synthetic music fixture");
    await page
      .getByLabel("Artist, choir or composer", { exact: true })
      .fill("Test composer");
    await page
      .getByRole("combobox", { name: /^Music category/ })
      .selectOption(category.id);
    await page
      .getByLabel("Short description", { exact: true })
      .fill("A generated test tone, not a copyrighted recording.");
    await page.getByLabel("Release year (optional)").fill("2026");
    const wave = recording();
    const uploadResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/music/audio") && r.request().method() === "POST",
    );
    await page.getByLabel(/^Upload audio/).setInputFiles({
      name: "synthetic.wav",
      mimeType: "audio/wav",
      buffer: wave,
    });
    const upload = await uploadResponse;
    assert.equal(upload.status(), 201);
    const audio = await upload.json();
    await page
      .getByText("Upload ready. Save the music item to apply your changes.")
      .waitFor();
    const preview = page.locator("audio");
    await preview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const a = document.querySelector("audio");
      return Boolean(a && a.duration === 10);
    });
    await preview.evaluate((a) => (a as HTMLAudioElement).play());
    await delay(100);
    assert.equal(
      await preview.evaluate((a) => (a as HTMLAudioElement).paused),
      false,
    );
    await preview.evaluate((a) => {
      const p = a as HTMLAudioElement;
      p.currentTime = 3;
      p.volume = 0.5;
      p.pause();
    });
    assert.equal(
      await preview.evaluate((a) => (a as HTMLAudioElement).volume),
      0.5,
    );
    assert.equal((await fetch(base + audio.url)).status, 404);
    assert.equal(
      (await fetch(base + audio.url, { method: "HEAD" })).status,
      404,
    );
    const coverResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/product-images") &&
        r.request().method() === "POST",
    );
    await page.getByLabel(/^Upload cover image/).setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: readFileSync("public/Images/bell-alarm/digital-school-bell.png"),
    });
    assert.equal((await coverResponse).status(), 201);
    await page
      .getByText("Upload ready. Save the music item to apply your changes.")
      .waitFor();
    await page
      .getByRole("button", { name: "Save as Draft", exact: true })
      .click();
    await page.waitForURL("**/admin/music?saved=1").catch(async (error) => {
      console.error(
        "Draft save feedback:",
        await page.locator("form").innerText(),
      );
      console.error("Server:", log);
      console.error(
        "Stored music count:",
        await db.collection("musiccontents").countDocuments(),
      );
      throw error;
    });
    const adminRows = await api("/api/music?admin=1");
    let item = adminRows.rows[0];
    assert.ok(item.id);
    const id = item.id,
      originalAudioId = audio.id,
      originalCover = item.coverImageUrl;
    const stored = await db
      .collection("musicAudio.files")
      .findOne({ _id: new Types.ObjectId(audio.id) });
    assert.equal(stored?.length, wave.length);
    assert.equal(stored?.metadata.contentType, "audio/wav");
    assert.equal(
      await db
        .collection("musicAudio.chunks")
        .countDocuments({ files_id: new Types.ObjectId(audio.id) }),
      1,
    );
    assert.equal(
      (await (await fetch(base + "/api/music")).json()).data.total,
      0,
    );
    assert.equal((await fetch(base + `/api/music/${id}`)).status, 404);
    assert.equal((await fetch(base + audio.url + "?download=1")).status, 404);
    // Next.js loading boundaries may stream a 200 before notFound() resolves.
    // Assert the private metadata is absent, alongside the strict API 404 above.
    const draftPage = await (await fetch(base + `/music/${item.slug}`)).text();
    assert.ok(!draftPage.includes("Synthetic music fixture"));
    assert.ok(!draftPage.includes(audio.url));
    pass(
      "persistent GridFS upload, authenticated native preview, cover upload and draft privacy",
    );
    const invalid = await page.request.post(base + "/api/music/audio", {
      headers: { Cookie: cookie, Origin: base, "Content-Type": "audio/mpeg" },
      data: Buffer.from("<html>not audio</html>"),
    });
    assert.equal(invalid.status(), 400);
    const oversized = await page.request.post(base + "/api/music/audio", {
      headers: { Cookie: cookie, Origin: base, "Content-Type": "audio/wav" },
      data: Buffer.alloc(1024 * 1024 + 1),
    });
    assert.equal(oversized.status(), 413);
    const cross = await page.request.post(base + "/api/music/audio", {
      headers: {
        Cookie: cookie,
        Origin: "https://evil.example",
        "Content-Type": "audio/wav",
      },
      data: wave,
    });
    assert.equal(cross.status(), 403);
    const crossMutation = await page.request.put(base + `/api/music/${id}`, {
      headers: { Cookie: cookie, Origin: "https://evil.example" },
      data: { title: "Do not change" },
    });
    assert.equal(crossMutation.status(), 403);
    assert.equal(await db.collection("musicAudio.files").countDocuments(), 1);
    assert.equal(await db.collection("musicAudio.chunks").countDocuments(), 1);
    pass(
      "invalid bytes, configured size limit, cross-origin mutations/uploads and failed-upload cleanup",
    );
    await page
      .getByRole("link", { name: "Edit / preview", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Song title", { exact: true }).inputValue(),
      "Synthetic music fixture",
    );
    await page
      .getByRole("button", { name: "Publish music", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Confirm ownership" })
      .waitFor();
    assert.equal((await api(`/api/music/${id}`)).status, "draft");
    await page
      .getByRole("combobox", { name: /^Rights basis/ })
      .selectOption("client-owned");
    await page.getByLabel(/^I confirm that Image Grant Technology/).check();
    await page.getByLabel("Rights owner (optional)").fill("Test composer");
    await page
      .getByLabel("Licence or permission information (optional)")
      .fill("Self-generated test tone; test only.");
    await page.getByLabel("Featured music", { exact: true }).check();
    await page.getByLabel(/^Allow public downloads/).check();
    await page
      .getByRole("button", { name: "Publish music", exact: true })
      .click();
    await page.waitForURL("**/admin/music?saved=1");
    const publicItem = (await (await fetch(base + `/api/music/${id}`)).json())
      .data;
    assert.equal(publicItem.status, "published");
    for (const key of [
      "rightsOwner",
      "licenceInformation",
      "rightsNotes",
      "createdBy",
      "updatedBy",
      "permissionToDistribute",
    ])
      assert.ok(!(key in publicItem), key);
    assert.equal(publicItem.downloadUrl, audio.url + "?download=1");
    const attachment = await fetch(base + publicItem.downloadUrl);
    assert.equal(attachment.status, 200);
    assert.match(
      attachment.headers.get("content-disposition") || "",
      /^attachment; filename=/,
    );
    assert.deepEqual(Buffer.from(await attachment.arrayBuffer()), wave);
    await db
      .collection("musiccontents")
      .updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { permissionToDistribute: false } },
      );
    assert.equal((await fetch(base + publicItem.downloadUrl)).status, 404);
    assert.equal((await fetch(base + audio.url)).status, 200);
    await db
      .collection("musiccontents")
      .updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { permissionToDistribute: true } },
      );
    pass(
      "Published audio downloads return exact stored bytes as an attachment; drafts and revoked download permission are protected",
    );
    let range = await fetch(base + audio.url, {
      headers: { Range: "bytes=44-83" },
    });
    assert.equal(range.status, 206);
    assert.equal(
      range.headers.get("content-range"),
      `bytes 44-83/${wave.length}`,
    );
    assert.deepEqual(
      Buffer.from(await range.arrayBuffer()),
      wave.subarray(44, 84),
    );
    const head = await fetch(base + audio.url, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), String(wave.length));
    assert.equal(head.headers.get("content-disposition"), "inline");
    assert.ok(head.headers.get("cache-control")?.includes("no-store"));
    range = await fetch(base + audio.url, { headers: { Range: "bytes=-16" } });
    assert.deepEqual(
      Buffer.from(await range.arrayBuffer()),
      wave.subarray(-16),
    );
    assert.equal(
      (
        await fetch(base + audio.url, {
          headers: { Range: `bytes=${wave.length}-` },
        })
      ).status,
      416,
    );
    pass(
      "rights-gated publication, public privacy and correct full/head/ranged streaming responses",
    );
    const listener = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const publicPage = await listener.newPage();
    publicPage.on("pageerror", (e) => errors.push(e.message));
    await publicPage.goto(base + "/music");
    await publicPage
      .getByRole("heading", { name: "Featured music", exact: true })
      .waitFor();
    assert.equal(await publicPage.locator("audio").count(), 2);
    const players = publicPage.locator("audio");
    await players.first().evaluate((a) => (a as HTMLAudioElement).play());
    await players.last().evaluate((a) => (a as HTMLAudioElement).play());
    assert.equal(
      await players.first().evaluate((a) => (a as HTMLAudioElement).paused),
      true,
    );
    assert.equal(
      await players.last().evaluate((a) => (a as HTMLAudioElement).paused),
      false,
    );
    assert.equal(await players.last().getAttribute("controlslist"), null);
    const downloadEvent = publicPage.waitForEvent("download");
    await publicPage
      .getByRole("link", {
        name: "Download Synthetic music fixture",
        exact: true,
      })
      .first()
      .click();
    const downloaded = await downloadEvent;
    assert.deepEqual(readFileSync((await downloaded.path())!), wave);
    for (const width of [390, 1440]) {
      await publicPage.setViewportSize({ width, height: 900 });
      await publicPage.goto(base + "/music");
      assert.ok(
        await publicPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await publicPage.locator("audio").first().scrollIntoViewIfNeeded();
      await publicPage
        .locator("audio")
        .first()
        .evaluate((a) => (a as HTMLAudioElement).play());
      assert.equal(
        await publicPage
          .locator("audio")
          .first()
          .evaluate((a) => (a as HTMLAudioElement).paused),
        false,
      );
      await publicPage.screenshot({
        path: `/private/tmp/music-public-${width}.png`,
      });
    }
    await publicPage
      .getByRole("textbox", { name: "Song title or artist" })
      .fill("Test composer");
    await publicPage
      .getByRole("combobox", { name: "Music category", exact: false })
      .selectOption(category.id);
    await publicPage
      .getByRole("button", { name: "Search music", exact: true })
      .click();
    await publicPage.waitForURL(/q=Test/);
    assert.equal(
      await publicPage
        .getByRole("link", { name: "Synthetic music fixture", exact: true })
        .count(),
      1,
    );
    await publicPage
      .getByRole("textbox", { name: "Song title or artist" })
      .fill("No such recording");
    await publicPage
      .getByRole("button", { name: "Search music", exact: true })
      .click();
    await publicPage.getByText(/No music matches your search/).waitFor();
    assert.ok(
      (await (await fetch(base + "/music")).text()).includes(
        "Synthetic music fixture",
      ),
    );
    pass(
      "public desktop/mobile playback, one active track, public download controls, search, category filtering and featured music page",
    );
    await page.goto(base + `/admin/music/${id}/edit`);
    await page
      .getByLabel("Song title", { exact: true })
      .fill("Updated synthetic music");
    await page
      .getByLabel("Artist, choir or composer", { exact: true })
      .fill("Updated test choir");
    await page
      .getByRole("combobox", { name: /^Music category/ })
      .selectOption(other.id);
    await page.getByLabel("Release year (optional)").fill("2025");
    const replaceResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/music/audio") && r.request().method() === "POST",
    );
    await page.getByLabel(/^Upload audio/).setInputFiles({
      name: "replacement.wav",
      mimeType: "audio/wav",
      buffer: recording(440),
    });
    const replacement = await (await replaceResponse).json();
    await page
      .getByText("Upload ready. Save the music item to apply your changes.")
      .waitFor();
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.waitForURL("**/admin/music?saved=1");
    item = await api(`/api/music/${id}`);
    assert.equal(item.title, "Updated synthetic music");
    assert.equal(item.categoryId, other.id);
    assert.equal(item.coverImageUrl, originalCover);
    assert.equal(item.audioAssetId, replacement.id);
    assert.equal(item.rightsConfirmed, true);
    assert.equal(item.releaseYear, 2025);
    assert.equal((await fetch(base + audio.url)).status, 404);
    assert.equal(
      (
        await page.request.get(base + audio.url, {
          headers: { Cookie: cookie },
        })
      ).status(),
      200,
    );
    assert.equal(await db.collection("musicAudio.files").countDocuments(), 2);
    await api(`/api/music/categories/${other.id}`, "PUT", {
      name: "Custom instrumental category",
      isActive: false,
    });
    await api(`/api/music/${id}`, "PUT", { sortOrder: 1 });
    assert.equal((await api(`/api/music/${id}`)).categoryId, other.id);
    assert.ok(
      (await (await fetch(base + "/music")).text()).includes(
        "Updated synthetic music",
      ),
    );
    pass(
      "editing/replacing audio preserves cover, rights, historical assets and deactivated category associations",
    );
    await page.goto(base + "/admin/music");
    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await page.getByRole("button", { name: "Publish", exact: true }).waitFor();
    assert.equal(
      (await (await fetch(base + "/api/music")).json()).data.total,
      0,
    );
    assert.equal((await fetch(base + replacement.url)).status, 404);
    assert.equal(
      (await fetch(base + replacement.url + "?download=1")).status,
      404,
    );
    const unpublishedPage = await (
      await fetch(base + `/music/${item.slug}`)
    ).text();
    assert.ok(!unpublishedPage.includes("Updated synthetic music"));
    assert.ok(!unpublishedPage.includes(replacement.url));
    assert.ok(
      !(await (await fetch(base + "/music")).text()).includes(
        "Updated synthetic music",
      ),
    );
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    assert.equal((await api(`/api/music/${id}`)).status, "draft");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await page.getByText(/archived ·/).waitFor();
    item = await api(`/api/music/${id}`);
    assert.equal(item.status, "archived");
    assert.equal(item.audioAssetId, replacement.id);
    assert.equal(await db.collection("musicAudio.files").countDocuments(), 2);
    assert.ok(
      await db
        .collection("musicAudio.files")
        .findOne({ _id: new Types.ObjectId(originalAudioId) }),
    );
    pass(
      "unpublish/confirmed archive revoke public playback and retain records and all audio assets",
    );
    const raw = await db
      .collection("musiccontents")
      .findOne({ _id: new Types.ObjectId(id) });
    assert.ok(raw);
    const { _id, ...fixture } = raw;
    void _id;
    await db.collection("musiccontents").insertMany(
      Array.from({ length: 25 }, (_, i) => ({
        ...fixture,
        title: `Pagination fixture ${i}`,
        slug: `pagination-fixture-${i}`,
      })),
    );
    const first = await api("/api/music?admin=1"),
      second = await api("/api/music?admin=1&page=2");
    assert.equal(first.rows.length, 24);
    assert.equal(second.rows.length, 2);
    assert.equal(first.total, 26);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/admin/music");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({ path: `/private/tmp/music-admin-${width}.png` });
    }
    await page.goto(base + "/admin/products");
    await page.getByRole("heading", { name: "LED products" }).waitFor();
    await page.goto(base + "/gallery");
    await page.getByRole("heading", { name: "Gallery", exact: true }).waitFor();
    assert.deepEqual(
      await db.collection("products").findOne({ _id: productId }),
      productBefore,
    );
    assert.deepEqual(errors, []);
    await listener.close();
    pass(
      "server-side pagination, responsive admin, product/gallery regression and no runtime errors",
    );
    console.log(`Music integration: ${checks} checks passed.`);
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
