// Read-only checks against a running application. Does not submit forms or change records.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import { officialContact } from "../src/lib/constants/contact";
import { createWhatsAppUrl } from "../src/lib/utils/contact";
async function main() {
  const base = process.env.PUBLIC_UI_TEST_URL || "http://localhost:3000";
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await chromium.launch({
    headless: true,
    ...(existsSync(chrome) ? { executablePath: chrome } : {}),
  });
  let checks = 0;
  const pass = (label: string) => console.log(`PASS ${++checks}: ${label}`);
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const float = () =>
      page.getByRole("link", { name: "Chat with us on WhatsApp", exact: true });
    const auditButtons = async () => {
      const buttons = await page
        .locator('.public-site :is(a,button,[role="button"]).bg-primary')
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => n.getBoundingClientRect().width > 0)
            .map((n) => ({
              text: n.textContent,
              color: getComputedStyle(n).color,
              background: getComputedStyle(n).backgroundColor,
              icons: Array.from(n.querySelectorAll("svg")).map(
                (i) => getComputedStyle(i).color,
              ),
            })),
        );
      assert.ok(buttons.length);
      for (const b of buttons) {
        assert.equal(b.color, "rgb(255, 255, 255)", JSON.stringify(b));
        assert.ok(
          b.icons.every((c) => c === "rgb(255, 255, 255)"),
          JSON.stringify(b),
        );
      }
    };
    await page.goto(base + "/led-screens?page=1");
    await page.locator("h1").waitFor();
    const card = page
      .locator("main article")
      .filter({ has: page.locator("img") })
      .first();
    const productHref = await card.locator("h2 a").getAttribute("href");
    assert.ok(productHref);
    for (const route of [
      "/",
      "/led-screens?page=1",
      productHref,
      "/gallery",
      "/services",
      "/contact",
      "/led-accessories",
      "/electronic-bell-alarm",
      "/led-installation",
      "/led-maintenance",
      "/rent-led-screen",
    ]) {
      await page.goto(base + route);
      await page.locator("h1").first().waitFor();
      assert.equal(await float().count(), 1);
      assert.equal(
        await float().getAttribute("href"),
        createWhatsAppUrl(
          officialContact.number,
          officialContact.enquiryMessage,
        ),
      );
      assert.equal(await float().getAttribute("target"), "_blank");
      assert.ok((await float().getAttribute("rel"))?.includes("noopener"));
      const initial = await page.locator("[data-public-header]").boundingBox();
      assert.ok(initial);
      const heading = await page.locator("h1").first().boundingBox();
      assert.ok(heading && heading.y >= initial.y + initial.height);
      await page.evaluate(() => window.scrollTo(0, 600));
      assert.equal(
        Math.round(
          (await page.locator("[data-public-header]").boundingBox())!.y,
        ),
        0,
      );
      await auditButtons();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      );
    }
    pass(
      "sticky public header, one correct WhatsApp button, white red-button text/icons and preserved pages",
    );
    await page.goto(base + "/services");
    const more = () => page.getByRole("button", { name: "More", exact: false });
    await more().click();
    assert.equal(await more().getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Tab");
    assert.equal(
      await page
        .locator("#public-more-navigation a")
        .first()
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.keyboard.press("Escape");
    assert.equal(await more().getAttribute("aria-expanded"), "false");
    assert.equal(
      await more().evaluate((e) => e === document.activeElement),
      true,
    );
    await more().click();
    await page.mouse.click(4, 4);
    assert.equal(await more().getAttribute("aria-expanded"), "false");
    await more().click();
    await page
      .locator("#public-more-navigation")
      .getByRole("link", { name: "Gallery", exact: true })
      .click();
    assert.equal(await page.locator("#public-more-navigation").count(), 0);
    await page.waitForURL("**/gallery");
    await more().click();
    await page.evaluate(() => {
      history.pushState(null, "", "?navigation-test=1");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    assert.equal(await page.locator("#public-more-navigation").count(), 0);
    pass(
      "desktop selection, outside click, Escape, keyboard focus and query navigation close dropdown",
    );
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/contact");
      await page.locator("h1").waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `width ${width}`,
      );
      const header = page.locator("[data-public-header]");
      assert.equal(Math.round((await header.boundingBox())!.y), 0);
      const toggle = page.getByRole("button", {
        name: "Open navigation",
        exact: true,
      });
      if (await toggle.isVisible()) {
        await toggle.click();
        const nav = page.getByRole("navigation", { name: "Mobile navigation" });
        assert.ok(await nav.isVisible());
        const box = await nav.boundingBox();
        assert.ok(box && box.y + box.height <= 901);
        await page.keyboard.press("Escape");
        assert.equal(await nav.count(), 0);
        assert.equal(
          await toggle.evaluate((e) => e === document.activeElement),
          true,
        );
        await toggle.click();
        await page.mouse.click(4, 4);
        assert.equal(await nav.count(), 0);
        await toggle.click();
        await nav.getByRole("link", { name: "Gallery", exact: true }).click();
        assert.equal(await nav.count(), 0);
        await page.waitForURL("**/gallery");
        await page
          .getByRole("button", { name: "Open navigation", exact: true })
          .click();
        await page.setViewportSize({ width: 1440, height: 900 });
        assert.equal(
          await page
            .getByRole("navigation", { name: "Mobile navigation" })
            .count(),
          0,
        );
      }
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/contact");
      for (const scope of [page.locator("main"), page.locator("footer")]) {
        const call = scope.locator('a[href="tel:+2348039308982"]');
        const wa = scope.locator('a[href="https://wa.me/2348039308982"]');
        assert.equal(await call.count(), 1);
        assert.equal(await wa.count(), 1);
        assert.ok(
          (await call.innerText()).includes(officialContact.displayNumber),
        );
        assert.ok(
          (await wa.innerText()).includes(officialContact.displayNumber),
        );
        assert.equal(await call.locator("svg").count(), 1);
        assert.equal(await wa.locator("svg").count(), 1);
      }
      const floating = await float().boundingBox();
      assert.ok(
        floating &&
          floating.x >= 16 &&
          width - floating.x - floating.width >= 15 &&
          900 - floating.y - floating.height >= 15,
      );
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      assert.equal(Math.round((await header.boundingBox())!.y), 0);
      await page.screenshot({
        path: `/private/tmp/public-ui-contact-${width}.png`,
      });
    }
    pass(
      "desktop/tablet/mobile menus, official contact links/icons, safe floating placement and footer space",
    );
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(base + "/contact");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await float().evaluate((e) => getComputedStyle(e).transitionProperty),
      "none",
    );
    const submit = page.getByRole("button", { name: /Send enquiry/i });
    await submit.scrollIntoViewIfNeeded();
    const buttonBox = await submit.boundingBox();
    const floatingBox = await float().boundingBox();
    assert.ok(buttonBox && floatingBox);
    assert.ok(
      buttonBox.x + buttonBox.width <= floatingBox.x ||
        buttonBox.x >= floatingBox.x + floatingBox.width ||
        buttonBox.y + buttonBox.height <= floatingBox.y ||
        buttonBox.y >= floatingBox.y + floatingBox.height,
      "WhatsApp does not cover contact submit",
    );
    await page.goto(base + "/admin/login");
    assert.equal(await page.locator("[data-whatsapp-floating]").count(), 0);
    assert.equal(await page.locator("[data-public-header]").count(), 0);
    assert.deepEqual(errors, []);
    pass(
      "reduced motion, unobstructed contact submit, admin isolation and no browser runtime errors",
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
