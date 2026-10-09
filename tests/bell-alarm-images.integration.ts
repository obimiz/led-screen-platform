// Isolated shape fixtures only; never reads or writes application MongoDB data.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { chromium, type Browser } from "@playwright/test";

async function main() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  let server: ChildProcess | undefined;
  let browser: Browser | undefined;
  const base = "http://127.0.0.1:3132";
  try {
    await mongoose.connect(mongo.getUri("bell_image_test"));
    const shapes = {
      wide: [1200, 400],
      tall: [400, 1200],
      square: [600, 600],
      small: [64, 64],
    };
    await mongoose.connection.db!.collection("products").insertMany(
      [...Object.keys(shapes), "broken", "empty"].map((shape) => ({
        name: `Test ${shape} system`,
        slug: `test-${shape}`,
        productType: "bell-alarm-system",
        category: new Types.ObjectId(),
        status: "published",
        featured: false,
        shortDescription: "Isolated product image sizing fixture.",
        description: "Test equipment description.",
        priceType: "fixed",
        price: 123,
        currency: "NGN",
        stockStatus: "in-stock",
        featuredImageUrl: shape === "empty" ? "" : `/test-bell-${shape}.svg`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "-p",
        "3132",
        "-H",
        "127.0.0.1",
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          MONGODB_URI: mongo.getUri("bell_image_test"),
          NEXT_PUBLIC_APP_URL: base,
        },
        stdio: "ignore",
      },
    );
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
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/test-bell-*.svg", (route) => {
      const shape = route.request().url().split("test-bell-")[1].split(".")[0];
      const size = shapes[shape as keyof typeof shapes];
      return size
        ? route.fulfill({
            contentType: "image/svg+xml",
            body: `<svg xmlns="http://www.w3.org/2000/svg" width="${size[0]}" height="${size[1]}"><rect x="1" y="1" width="${size[0] - 2}" height="${size[1] - 2}" fill="none" stroke="purple" stroke-width="2"/><text x="10" y="30">TEST</text></svg>`,
          })
        : route.fulfill({ status: 404, body: "Not found" });
    });
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + "/electronic-bell-alarm/products");
      const frames = page.locator("[data-bell-product-image]");
      assert.equal(await frames.count(), 6);
      for (const frame of await frames.all())
        await frame.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          document.querySelectorAll("[data-bell-product-image] img").length ===
            4 &&
          [
            ...document.querySelectorAll<HTMLImageElement>(
              "[data-bell-product-image] img",
            ),
          ].every((image) => image.complete && image.naturalWidth > 0),
      );
      assert.equal(
        await page.getByText("Image coming soon", { exact: true }).count(),
        2,
      );
      const measurements = await frames.evaluateAll((elements) =>
        elements.map((frame) => {
          const bounds = frame.getBoundingClientRect(),
            card = frame.parentElement!.getBoundingClientRect();
          const image = frame.querySelector("img");
          const rect = image?.getBoundingClientRect();
          return {
            height: bounds.height,
            cardHeight: Math.round(card.height),
            image:
              image && rect
                ? {
                    width: rect.width,
                    height: rect.height,
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    fit: getComputedStyle(image).objectFit,
                    position: getComputedStyle(image).objectPosition,
                    contained:
                      rect.left >= bounds.left &&
                      rect.right <= bounds.right &&
                      rect.top >= bounds.top &&
                      rect.bottom <= bounds.bottom,
                    breathingRoom:
                      rect.width <= bounds.width * 0.86 + 1 &&
                      rect.height <= bounds.height * 0.86 + 1,
                    centered:
                      Math.abs(
                        rect.left + rect.right - (bounds.left + bounds.right),
                      ) < 1 &&
                      Math.abs(
                        rect.top + rect.bottom - (bounds.top + bounds.bottom),
                      ) < 1,
                  }
                : null,
          };
        }),
      );
      assert.equal(new Set(measurements.map((m) => m.cardHeight)).size, 1);
      for (const measure of measurements) {
        assert.equal(measure.height, 240);
        if (measure.image) {
          const i = measure.image;
          assert.equal(i.fit, "contain");
          assert.equal(i.position, "50% 50%");
          assert.ok(i.contained && i.centered && i.breathingRoom);
          assert.ok(
            i.width <= i.naturalWidth + 1 && i.height <= i.naturalHeight + 1,
          );
        }
      }
      assert.equal(await page.getByText("NGN 123", { exact: true }).count(), 6);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: `/private/tmp/bell-fixtures-${width}.png`,
        fullPage: true,
      });
      console.log(
        `PASS: ${width}px grid, contain/center, equal card heights, no upscaling, price, fallback, no overflow`,
      );
      for (const shape of [...Object.keys(shapes), "broken", "empty"]) {
        await page.goto(base + `/electronic-bell-alarm/products/test-${shape}`);
        assert.equal(await frames.count(), 1);
        await frames.scrollIntoViewIfNeeded();
        if (["broken", "empty"].includes(shape))
          await page.getByText("Image coming soon", { exact: true }).waitFor();
        else
          await page.waitForFunction(
            () =>
              document.querySelector<HTMLImageElement>(
                "[data-bell-product-image] img",
              )?.naturalWidth,
          );
        assert.equal(
          await frames.evaluate((el) => el.getBoundingClientRect().height),
          240,
        );
        assert.ok(
          await page
            .getByRole("main")
            .getByRole("link", { name: "Request Quote", exact: true })
            .isVisible(),
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
      console.log(
        `PASS: ${width}px detail pages preserve enquiry links and bounded images/fallback`,
      );
    }
    assert.deepEqual(errors, []);
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
