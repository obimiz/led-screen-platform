// Read-only check against a running application and its configured database.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import { initialOrganisationNames } from "../src/lib/constants/organisations";

async function main() {
  const base = process.env.ORGANISATIONS_TEST_URL || "http://127.0.0.1:3136";
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await chromium.launch({
    headless: true,
    ...(existsSync(chrome) ? { executablePath: chrome } : {}),
  });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [375, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base);
      const section = page.locator(".organisation-section");
      await section.waitFor();
      await page.waitForFunction(() => {
        const images = [
          ...document.querySelectorAll<HTMLImageElement>(
            ".organisation-card img",
          ),
        ];
        return (
          images.length === 20 &&
          images.every((img) => img.complete && img.naturalWidth > 0)
        );
      });
      assert.equal(await section.locator(".organisation-row").count(), 1);
      assert.deepEqual(
        await section
          .locator(".organisation-group:not([aria-hidden]) .organisation-name")
          .allTextContents(),
        [...initialOrganisationNames],
      );
      const geometry = await section
        .locator(".organisation-card")
        .evaluateAll((cards) =>
          cards.map((card) => {
            const box = card.getBoundingClientRect();
            const img = card.querySelector("img")!;
            const logo = img.getBoundingClientRect();
            const name = card.querySelector(".organisation-name")!;
            const nameBox = name.getBoundingClientRect();
            return {
              name: name.textContent,
              top: box.top,
              width: Math.round(box.width),
              height: Math.round(box.height),
              contained:
                logo.left >= box.left &&
                logo.right <= box.right &&
                logo.top >= box.top &&
                logo.bottom <= box.bottom,
              nameContained:
                nameBox.bottom <= box.bottom &&
                nameBox.left >= box.left &&
                nameBox.right <= box.right,
              fit: getComputedStyle(img).objectFit,
              weight: Number(getComputedStyle(name).fontWeight),
            };
          }),
        );
      assert.equal(new Set(geometry.map((card) => card.top)).size, 1);
      assert.ok(
        geometry.every(
          (card) =>
            card.contained &&
            card.nameContained &&
            card.fit === "contain" &&
            card.weight >= 700 &&
            card.width <= 230 &&
            card.height <= 166,
        ),
        JSON.stringify({ width, geometry }),
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.mouse.move(0, 0);
      const track = section.locator(".organisation-track");
      assert.equal(
        await track.evaluate((el) => getComputedStyle(el).animationPlayState),
        "running",
      );
      const first = await track.evaluate(
        (el) => getComputedStyle(el).transform,
      );
      await page.waitForTimeout(200);
      assert.notEqual(
        await track.evaluate((el) => getComputedStyle(el).transform),
        first,
      );
      // At the loop boundary, copy two occupies exactly copy one's starting position.
      const seam = await track.evaluate((el) => {
        const animation = el.getAnimations()[0];
        const duration = Number(animation.effect!.getTiming().duration);
        animation.pause();
        animation.currentTime = 0;
        const groups = el.querySelectorAll(".organisation-group");
        const start = groups[0].getBoundingClientRect().left;
        animation.currentTime = duration - 0.01;
        const end = groups[1].getBoundingClientRect().left;
        animation.play();
        return Math.abs(start - end);
      });
      assert.ok(seam < 1, `Seamless loop at ${width}px`);
      await section.screenshot({
        path: `/private/tmp/organisations-verified-${width}.png`,
      });
      console.log(
        `PASS ${width}px: ten loaded logos, one moving row, seamless loop, contained cards, bold names`,
      );
    }
    await page.getByLabel("Pause scrolling").check();
    assert.equal(
      await page
        .locator(".organisation-track")
        .evaluate((el) => getComputedStyle(el).animationPlayState),
      "paused",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page
        .locator(".organisation-track")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    assert.equal(await page.locator(".organisation-group:visible").count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      "PASS pause control, reduced motion and no uncaught browser errors",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
