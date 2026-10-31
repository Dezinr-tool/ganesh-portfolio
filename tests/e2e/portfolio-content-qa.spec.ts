import { expect, test } from "@playwright/test";

const devices = [
  { name: "small-phone", width: 320, height: 568, touch: true },
  { name: "tablet-portrait", width: 820, height: 1180, touch: true },
  { name: "tablet-landscape", width: 1180, height: 820, touch: true },
  { name: "laptop", width: 1366, height: 768, touch: false },
  { name: "desktop", width: 1920, height: 1080, touch: false },
];

for (const device of devices) {
  test(`${device.name}: content fit, menu, services and testimonials`, async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      hasTouch: device.touch,
      isMobile: device.touch,
      baseURL,
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const menu = page.getByRole("button", { name: /menu/i });
      await menu.click({ force: true });
      if (await menu.getAttribute("aria-expanded") !== "true") {
        await page.evaluate(() => (document.querySelector(".site-nav__trigger") as HTMLButtonElement | null)?.click());
      }
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      await expect(nav).toBeVisible();
      await expect(page.getByRole("dialog", { name: "Site navigation" }).getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/in/g009/");
      const menuBounds = await page.getByRole("dialog", { name: "Site navigation" }).evaluate(async el => {
        // The panel slides in, so measure where it lands.
        await Promise.all(el.getAnimations().map(animation => animation.finished));
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: innerWidth, height: innerHeight, cssWidth: style.width, transform: style.transform, visualWidth: visualViewport?.width };
      });
      expect(menuBounds.left, "open navigation left edge").toBeGreaterThanOrEqual(-1);
      expect(menuBounds.right, `open navigation right edge: ${JSON.stringify(menuBounds)}`).toBeLessThanOrEqual(menuBounds.width + 2);
      expect(menuBounds.top, "open navigation top edge").toBeGreaterThanOrEqual(-1);
      expect(menuBounds.bottom, "open navigation bottom edge").toBeLessThanOrEqual(menuBounds.height + 1);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-expanded", "false");

      for (const selector of ["#about", "#services", "#tools", "#testimonials", "#footer"]) {
        const section = page.locator(selector);
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeInViewport();
        const clippedCopy = await section.evaluate(el => {
          const selectors = [".hero-reveal-copy", ".vs-card__body", ".tools-experience__title", ".t-card__quote", ".footer-copy"];
          return [...el.querySelectorAll<HTMLElement>(selectors.join(","))]
            .filter(node => {
              // Glyph boxes can pass a tight line-height without clipping anything.
              const glyphRoom = parseFloat(getComputedStyle(node).fontSize) * 0.4;
              return node.clientWidth > 0 && (node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + glyphRoom);
            })
            .map(node => ({ text: node.textContent, width: node.clientWidth, scrollWidth: node.scrollWidth, height: node.clientHeight, scrollHeight: node.scrollHeight }));
        });
        expect(clippedCopy, `${selector}: text must fit its own box`).toEqual([]);
        if (selector === "#about" || selector === "#testimonials") {
          await page.screenshot({ path: testInfo.outputPath(`${device.name}-${selector.slice(1)}.png`) });
        }
      }
      const testimonials = page.locator("#testimonials");
      await testimonials.scrollIntoViewIfNeeded();
      if (device.touch) {
        const clientQuote = testimonials.locator(".t-card--client-review .t-card__quote").first();
        await clientQuote.scrollIntoViewIfNeeded();
        await expect(clientQuote).toBeVisible();
        expect(await clientQuote.evaluate(el => {
          const face = el.closest(".t-card__flip-back")!;
          return getComputedStyle(face).opacity === "1" && getComputedStyle(face).transform === "none";
        })).toBe(true);
      }
      await expect(page.locator("#services")).toHaveCount(1);
      await expect(page.locator("#footer").getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", "https://www.linkedin.com/in/g009/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(errors, "uncaught browser errors").toEqual([]);
    } finally {
      await context.close();
    }
  });
}
