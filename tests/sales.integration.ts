// Uses an ephemeral local MongoDB and a dedicated production Next server.
// It never reads .env.local or connects to the application's Atlas database.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { hash } from "bcryptjs";
import { SignJWT } from "jose";
import { chromium, type Browser } from "@playwright/test";
import { officialContact } from "../src/lib/constants/contact";
import type { Enquiry, Quotation, SalesList } from "../src/types/sales";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: process.env.SALES_TEST_MONGODB_VERSION || "7.0.14" },
  });
  let server: ChildProcess | undefined;
  let browser: Browser | undefined;
  let log = "";
  const errors: string[] = [];
  let checks = 0;
  const pass = (label: string) => {
    checks++;
    console.log(`PASS ${checks}: ${label}`);
  };
  const port = Number(process.env.SALES_TEST_PORT || 3106);
  const base = `http://127.0.0.1:${port}`;
  try {
    await mongoose.connect(mongo.getUri("module6_test"));
    const db = mongoose.connection.db!;
    const adminId = new Types.ObjectId();
    const secondAdmin = new Types.ObjectId();
    await db.collection("admins").insertMany([
      {
        _id: adminId,
        name: "Sales Test Owner",
        email: "owner@example.test",
        passwordHash: await hash("TestPassword123!", 4),
        role: "owner",
        isActive: true,
        sessionVersion: 0,
      },
      {
        _id: secondAdmin,
        name: "Sales Test Admin",
        email: "admin@example.test",
        passwordHash: "unused",
        role: "admin",
        isActive: true,
        sessionVersion: 0,
      },
    ]);
    const screenCategory = new Types.ObjectId();
    const accessoryCategory = new Types.ObjectId();
    await db.collection("productcategories").insertMany([
      {
        _id: screenCategory,
        name: "Indoor screens",
        slug: "indoor-screens",
        productType: "led-screen",
        active: true,
        sortOrder: 1,
      },
      {
        _id: accessoryCategory,
        name: "Processors",
        slug: "processors",
        productType: "led-accessory",
        active: true,
        sortOrder: 1,
      },
    ]);
    const screenId = new Types.ObjectId();
    const accessoryId = new Types.ObjectId();
    const productDefaults = {
      description: "A professional display product",
      shortDescription: "Professional display solution",
      status: "published",
      priceType: "fixed",
      currency: "NGN",
      stockStatus: "in-stock",
      quantity: 10,
      featured: true,
      createdBy: adminId,
      updatedBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
      specifications: [],
      compatibility: [],
      features: [],
      imageUrls: [],
      supportedInputs: [],
      usageApplications: [],
      pixelPitch: "P3.91",
      maintenanceType: "front",
      price: 1000,
    };
    await db.collection("products").insertMany([
      {
        ...productDefaults,
        _id: screenId,
        name: "P3.91 Test Screen",
        slug: "test-screen",
        productType: "led-screen",
        category: screenCategory,
        indoorOutdoor: "indoor",
        sku: "SCREEN-1",
      },
      {
        ...productDefaults,
        _id: accessoryId,
        name: "Test Processor",
        slug: "test-processor",
        productType: "led-accessory",
        category: accessoryCategory,
        sku: "ACCESSORY-1",
        price: 200,
      },
    ]);
    await db.collection("businesssettings").insertOne({
      singletonKey: "primary",
      businessName: "Module Six Displays",
      primaryEmail: "sales@example.test",
      primaryPhone: "+2348012345678",
      whatsappNumber: "+2348012345678",
      addressLine1: "10 Display Road",
      city: "Lagos",
      country: "Nigeria",
      updatedAt: new Date(),
    });
    const secret = randomBytes(32).toString("hex");
    const token = await new SignJWT({ sessionVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(adminId.toString())
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
        String(port),
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("module6_test"),
          AUTH_SECRET: secret,
          NEXT_PUBLIC_APP_URL: base,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", (c) => {
      log += String(c);
    });
    server.stderr?.on("data", (c) => {
      log += String(c);
    });
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (server.exitCode !== null) throw new Error(`Server exited: ${log}`);
      try {
        if ((await fetch(`${base}/api/health`)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(250);
    }
    assert.ok(ready, log);
    async function api<T>(
      path: string,
      options: {
        method?: string;
        body?: unknown;
        auth?: boolean;
        ip?: string;
        status?: number;
      } = {},
    ): Promise<T> {
      const response = await fetch(base + path, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.auth ? { cookie } : {}),
          ...(options.ip ? { "x-forwarded-for": options.ip } : {}),
        },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      });
      const result = await response.json();
      assert.equal(
        response.status,
        options.status ?? 200,
        `${path}: ${JSON.stringify(result)}`,
      );
      return result.data as T;
    }
    await api("/api/health");
    pass("health API remains available");
    for (const [path, method] of [
      ["/api/quote-requests", "GET"],
      [`/api/quote-requests/${screenId}`, "GET"],
      [`/api/quote-requests/${screenId}`, "PUT"],
      ["/api/quotations", "GET"],
      ["/api/quotations", "POST"],
      [`/api/quotations/${screenId}`, "GET"],
      [`/api/quotations/${screenId}`, "PUT"],
      [`/api/quotations/${screenId}/status`, "PATCH"],
      ["/api/sales/catalogue", "GET"],
    ])
      await api(path, { method, status: 401 });
    const protectedPage = await fetch(`${base}/admin/sales/quotations`, {
      redirect: "manual",
    });
    assert.ok([200, 307].includes(protectedPage.status));
    // Streaming App Router redirects can have a 200 response plus redirect markup.
    const redirectMarkup = await protectedPage.text();
    assert.ok(
      protectedPage.headers.get("location")?.includes("/admin/login") ||
        (redirectMarkup.includes("NEXT_REDIRECT") &&
          redirectMarkup.includes("/admin/login")),
    );
    pass("all sales APIs and admin pages require authentication");
    const leadInput = {
      customerName: "Ada Customer",
      customerEmail: "ada@example.test",
      customerPhone: "+2348098765432",
      companyName: "Ada Displays",
      productSlug: "test-screen",
      quantity: 2,
      requiredWidth: 4,
      requiredHeight: 3,
      message: "Need a church display",
      budget: 10000000,
      preferredContactMethod: "email",
    };
    await api("/api/quote-requests", {
      method: "POST",
      body: { customerName: "X", requiredWidth: -1 },
      ip: "test-invalid",
      status: 422,
    });
    pass("public API rejects invalid submissions");
    const confirmation = await api<{ referenceNumber: string }>(
      "/api/quote-requests",
      {
        method: "POST",
        body: {
          ...leadInput,
          status: "won",
          adminNotes: "forged",
          productNameSnapshot: "Forged name",
        },
        ip: "test-valid",
        status: 201,
      },
    );
    assert.match(confirmation.referenceNumber, /^QR-\d{4}-\d{5,}$/);
    assert.equal("id" in confirmation, false);
    assert.equal("adminNotes" in confirmation, false);
    let list = await api<SalesList<Enquiry>>("/api/quote-requests?search=Ada", {
      auth: true,
    });
    let lead = list.records[0];
    assert.equal(lead.productId, screenId.toString());
    assert.equal(lead.productNameSnapshot, "P3.91 Test Screen");
    assert.equal(lead.source, "product-page");
    assert.equal(lead.status, "new");
    assert.equal(lead.adminNotes, "");
    pass(
      "public submission links product, snapshots trusted fields and returns only safe confirmation",
    );
    const concurrent = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        api<{ referenceNumber: string }>("/api/quote-requests", {
          method: "POST",
          body: {
            ...leadInput,
            productSlug: "",
            customerName: `Concurrent ${i}`,
          },
          ip: `test-concurrent-${i}`,
          status: 201,
        }),
      ),
    );
    assert.equal(new Set(concurrent.map((x) => x.referenceNumber)).size, 12);
    pass("concurrent requests receive unique sequential references");
    for (let i = 0; i < 5; i++)
      await api("/api/quote-requests", {
        method: "POST",
        body: {},
        ip: "test-rate-limit",
        status: 422,
      });
    await api("/api/quote-requests", {
      method: "POST",
      body: {},
      ip: "test-rate-limit",
      status: 429,
    });
    pass("public request rate limiting");
    lead = await api<Enquiry>(`/api/quote-requests/${lead.id}`, {
      method: "PUT",
      auth: true,
      body: {
        version: lead.version,
        status: "reviewing",
        source: lead.source,
        assignedTo: secondAdmin.toString(),
        adminNotes: "Call to confirm power requirements",
      },
    });
    assert.equal(lead.status, "reviewing");
    assert.equal(lead.assignedName, "Sales Test Admin");
    assert.match(lead.adminNotes, /power/);
    list = await api<SalesList<Enquiry>>(
      `/api/quote-requests?search=Ada&status=reviewing&source=product-page&projectType=purchase&assignedTo=${secondAdmin}`,
      { auth: true },
    );
    assert.equal(list.total, 1);
    const paged = await api<SalesList<Enquiry>>(
      "/api/quote-requests?limit=2&page=2",
      { auth: true },
    );
    assert.equal(paged.records.length, 2);
    assert.equal(paged.page, 2);
    pass(
      "admin search, filters, pagination, status, assignment and private notes",
    );
    await api(`/api/quote-requests/${lead.id}`, {
      method: "PUT",
      auth: true,
      status: 409,
      body: { version: 0, status: "new", source: "website" },
    });
    pass("stale enquiry updates cannot overwrite newer work");
    const quoteInput = {
      quoteRequestId: lead.id,
      customer: {
        name: lead.customerName,
        companyName: lead.companyName,
        email: lead.customerEmail,
        phone: lead.customerPhone,
      },
      items: [
        {
          itemType: "led-screen",
          productId: screenId.toString(),
          name: "Forged product name",
          description: "forged description",
          quantity: 2,
          unit: "unit",
          unitPrice: 100000,
          discount: 0,
        },
        {
          itemType: "accessory",
          productId: accessoryId.toString(),
          name: "Test Processor",
          quantity: 1,
          unit: "unit",
          unitPrice: 20000,
        },
        {
          itemType: "service",
          name: "Installation service",
          quantity: 1,
          unit: "job",
          unitPrice: 50000,
        },
      ],
      discountType: "percentage",
      discountValue: 10,
      taxRate: 7.5,
      deliveryFee: 1000,
      installationFee: 2000,
      otherCharges: 300,
      validityDays: 30,
      notes: "Prepared for your project",
      terms: "Subject to site survey",
      total: 1,
      subtotal: 1,
    };
    let quote = await api<Quotation>("/api/quotations", {
      method: "POST",
      auth: true,
      body: quoteInput,
      status: 201,
    });
    assert.equal(quote.status, "draft");
    assert.equal(quote.quoteRequestId, lead.id);
    assert.equal(quote.items[0].name, "P3.91 Test Screen");
    assert.equal(quote.items[0].cataloguePriceSnapshot, 100000);
    assert.equal(quote.items[1].skuSnapshot, "ACCESSORY-1");
    assert.equal(quote.subtotal, 270000);
    assert.equal(quote.discountAmount, 27000);
    assert.equal(quote.taxAmount, 18225);
    assert.equal(quote.total, 264525);
    assert.match(quote.quotationNumber, /^QT-\d{4}-\d{5,}$/);
    pass(
      "quotation from enquiry: screen, accessory and service snapshots with server totals",
    );
    const manual = await api<Quotation>("/api/quotations", {
      method: "POST",
      auth: true,
      body: {
        ...quoteInput,
        quoteRequestId: "",
        discountType: "fixed",
        discountValue: 1000,
      },
      status: 201,
    });
    assert.equal(manual.quoteRequestId, "");
    assert.equal(manual.discountAmount, 1000);
    pass("manual quotations and fixed discounts");
    await db
      .collection("products")
      .updateOne(
        { _id: screenId },
        { $set: { price: 9999, name: "Renamed Screen" } },
      );
    const edit = {
      ...quote,
      validUntil: quote.validUntil.slice(0, 10),
      notes: "Updated notes",
    };
    quote = await api<Quotation>(`/api/quotations/${quote.id}`, {
      method: "PUT",
      auth: true,
      body: edit,
    });
    assert.equal(quote.items[0].name, "P3.91 Test Screen");
    assert.equal(quote.items[0].cataloguePriceSnapshot, 100000);
    assert.equal(quote.items[0].unitPrice, 100000);
    assert.equal(quote.notes, "Updated notes");
    pass(
      "draft edits preserve historical customer and catalogue pricing snapshots",
    );
    await api(`/api/quotations/${quote.id}`, {
      method: "PUT",
      auth: true,
      body: edit,
      status: 409,
    });
    pass("stale quotation edit rejected");
    const move = (q: Quotation, status: string) =>
      api<Quotation>(`/api/quotations/${q.id}/status`, {
        method: "PATCH",
        auth: true,
        body: { status, version: q.version },
      });
    quote = await move(quote, "sent");
    quote = await move(quote, "accepted");
    assert.ok(quote.acceptedAt);
    quote = await move(quote, "converted");
    assert.ok(quote.convertedToSaleAt);
    assert.equal(quote.createdBy, adminId.toString());
    await api(`/api/quotations/${quote.id}`, {
      method: "PUT",
      auth: true,
      body: { ...quote, validUntil: quote.validUntil.slice(0, 10) },
      status: 400,
    });
    pass(
      "sent → accepted → converted records audit dates and locks converted quotation",
    );
    let rejected = await move(manual, "sent");
    rejected = await move(rejected, "rejected");
    assert.ok(rejected.rejectedAt);
    rejected = await move(rejected, "draft");
    assert.ok(rejected.rejectedAt);
    pass("rejection and recovery retain audit metadata");
    rejected = await move(rejected, "sent");
    await db
      .collection("quotations")
      .updateOne(
        { _id: new Types.ObjectId(rejected.id) },
        { $set: { validUntil: new Date("2020-01-01") } },
      );
    const expired = await api<Quotation>(`/api/quotations/${rejected.id}`, {
      auth: true,
    });
    assert.equal(expired.effectiveStatus, "expired");
    const expiredList = await api<SalesList<Quotation>>(
      "/api/quotations?status=expired",
      { auth: true },
    );
    assert.equal(expiredList.total, 1);
    pass(
      "read-time expiration appears in detail and list filters without cron",
    );
    const printResponse = await fetch(
      `${base}/admin/sales/quotations/${quote.id}/print`,
      { headers: { cookie } },
    );
    const printHtml = await printResponse.text();
    assert.equal(printResponse.status, 200);
    assert.ok(printHtml.includes("Module Six Displays"));
    assert.ok(printHtml.includes("10 Display Road"));
    assert.ok(printHtml.includes(quote.quotationNumber));
    pass("print route renders live Business Settings and quotation document");
    for (const path of [
      "/",
      "/led-screens",
      "/led-screens/test-screen",
      "/led-accessories",
      "/led-accessories/test-processor",
      "/admin",
      "/admin/products",
      "/admin/accessories",
      "/admin/settings/business",
      "/admin/product-categories",
      "/admin/accessory-categories",
    ]) {
      const r = await fetch(base + path, { headers: { cookie } });
      assert.equal(r.status, 200, path);
      const html = await r.text();
      assert.ok(!html.includes('"digest":"'), `Server render error on ${path}`);
    }
    pass(
      "existing foundation, auth, settings, screen and accessory routes still render",
    );
    const chrome =
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    });
    await mkdir("test-results", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/request-quote?product=test-screen`);
    await page
      .getByLabel("Full name", { exact: false })
      .fill("Browser Customer");
    await page
      .getByLabel("Email", { exact: true })
      .fill("browser@example.test");
    await page.getByLabel("How should we contact you?").selectOption("email");
    await page
      .getByRole("button", { name: "Submit quotation request" })
      .click();
    await page.getByText("Your quotation request has been received.").waitFor();
    assert.match(
      await page.locator('[role="status"]').innerText(),
      /QR-\d{4}-\d{5}/,
    );
    const whatsappHref = await page
      .getByRole("link", { name: "Contact us on WhatsApp" })
      .getAttribute("href");
    assert.equal(
      new URL(whatsappHref || "").pathname,
      `/${officialContact.number.replace(/\D/g, "")}`,
    );
    await page.screenshot({
      path: "test-results/quote-confirmation.png",
      fullPage: true,
    });
    pass(
      "real browser public form submission, confirmation and WhatsApp contact",
    );
    await context.addCookies([
      {
        name: "led_admin_session",
        value: token,
        url: base,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto(`${base}/admin/sales/enquiries/${lead.id}`);
    assert.ok(
      await page
        .getByRole("link", { name: "Call customer", exact: true })
        .getAttribute("href"),
    );
    await page
      .getByRole("link", { name: "Create quotation", exact: true })
      .click();
    await page.getByLabel("Customer name", { exact: false }).waitFor();
    assert.equal(
      await page.getByLabel("Customer name", { exact: false }).inputValue(),
      lead.customerName,
    );
    pass("browser create-from-enquiry prefills customer details");
    await page.goto(`${base}/admin/sales/quotations/new`);
    await page
      .getByLabel("Customer name", { exact: false })
      .fill("Manual Browser Customer");
    await page.getByLabel("Email", { exact: true }).fill("manual@example.test");
    await page
      .getByLabel("Name", { exact: true })
      .fill("Custom mounting structure");
    await page.getByLabel("Unit price (NGN)", { exact: true }).fill("1500.50");
    for (const term of ["Renamed Screen", "Test Processor"]) {
      await page.getByLabel("Search catalogue", { exact: true }).fill(term);
      await page
        .getByRole("button", { name: "Find products", exact: true })
        .click();
      await page.getByRole("button", { name: "Add item", exact: true }).click();
    }
    await page
      .getByRole("button", { name: "Add service item", exact: true })
      .click();
    await page
      .getByLabel("Name", { exact: true })
      .last()
      .fill("Installation service");
    await page
      .getByLabel("Unit price (NGN)", { exact: true })
      .last()
      .fill("500");
    await page.screenshot({
      path: "test-results/quotation-editor.png",
      fullPage: true,
    });

    await page
      .getByRole("button", { name: "Save draft quotation", exact: true })
      .click();
    await page.waitForURL(/\/admin\/sales\/quotations\/[a-f0-9]{24}$/);
    const browserQuoteUrl = page.url();
    await page
      .getByRole("link", { name: "Edit quotation", exact: true })
      .click();
    await page
      .getByLabel("Customer-facing notes", { exact: true })
      .fill("Browser edit verified");
    await page
      .getByRole("button", { name: "Save draft quotation", exact: true })
      .click();
    await page.waitForURL(browserQuoteUrl);
    await page.getByText("Browser edit verified", { exact: true }).waitFor();
    pass("browser manual quotation creation and draft editing");
    await page.getByRole("button", { name: "Mark sent", exact: true }).click();
    await page.getByRole("button", { name: "Accept", exact: true }).waitFor();
    await page.getByRole("button", { name: "Accept", exact: true }).click();
    await page
      .getByRole("button", { name: "Convert to sale", exact: true })
      .waitFor();
    assert.ok(
      (await page.getByRole("link", { name: "Share on WhatsApp" }).count()) ===
        0,
    );
    pass("browser status workflow and contact actions reflect customer data");
    await page.getByRole("link", { name: "Print / save PDF" }).click();
    await page.waitForURL(/\/print$/);
    await page.locator(".quotation-print-view .quotation-document").waitFor();
    assert.equal(await page.locator(".admin-shell > aside").isVisible(), false);
    assert.equal(
      await page.locator(".admin-shell > div > header").isVisible(),
      false,
    );
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: "test-results/quotation.pdf",
      format: "A4",
      printBackground: true,
    });
    await page.screenshot({
      path: "test-results/quotation-print.png",
      fullPage: true,
    });
    pass("A4 print/PDF layout hides admin navigation");
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/request-quote`);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.screenshot({
      path: "test-results/request-quote-mobile.png",
      fullPage: true,
    });
    await page.goto(`${base}/admin/sales/quotations`);
    await page
      .getByRole("columnheader", { name: "Quotation", exact: true })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    pass("public form and admin table fit mobile viewport");
    assert.deepEqual(errors, []);
    pass("no browser JavaScript errors");
    console.log(
      `\n${checks} integration checks passed. Temporary database removed on exit.`,
    );
  } catch (error) {
    console.error(log.slice(-12000));
    console.error("Browser errors:", errors);
    const failedPage = browser?.contexts()[0]?.pages()[0];
    if (failedPage) {
      await failedPage.screenshot({
        path: "test-results/failure.png",
        fullPage: true,
      });
      console.error(
        (await failedPage.locator("body").innerText()).slice(-5000),
      );
    }
    throw error;
  } finally {
    await browser?.close();
    if (server && server.exitCode === null) {
      server.kill("SIGTERM");
      await new Promise<void>((resolve) =>
        server!.once("exit", () => resolve()),
      );
    }
    await mongoose.disconnect();
    await mongo.stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
