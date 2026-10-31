import { expect, test } from "@playwright/test";

test.describe("responsive portfolio @mobile", () => {
  for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024], [844, 390]]) {
    test(`${width}×${height}: readable story and reachable sections`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const about = page.locator("#about");
      await about.scrollIntoViewIfNeeded();
      await expect(about.locator(".hero-reveal-copy")).toHaveAttribute("aria-label", /Arena Animation/);
      if (width === 375) await page.screenshot({ path: "/tmp/portfolio-about-mobile.png" });
      const storyFits = await about.evaluate(el => {
        const section = el.getBoundingClientRect();
        const text = el.querySelector(".hero-reveal-copy")!.getBoundingClientRect();
        return text.left >= 0 && text.right <= innerWidth + 1 && text.top >= section.top && text.bottom <= section.bottom;
      });
      expect(storyFits).toBe(true);
      for (const selector of ["#services", "#works", "#tools", "#footer"]) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await expect(page.locator(selector)).toBeVisible();
      }
      // A short screen cannot fit the whole footer, so scroll to the heading itself.
      const contactHeading = page.locator(".footer-contact-heading");
      await contactHeading.scrollIntoViewIfNeeded();
      await expect(contactHeading).toBeInViewport();
      await expect.poll(() => page.locator(".footer-content").evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.95);
      const footerFits = await page.locator("#footer").evaluate(el => {
        const box = el.getBoundingClientRect();
        const copy = el.querySelector(".footer-copy")!.getBoundingClientRect();
        return copy.bottom <= box.bottom + 1;
      });
      expect(footerFits).toBe(true);
      if (width === 375) await page.screenshot({ path: "/tmp/portfolio-footer-mobile.png" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await expect(page.locator('#footer a[href="https://www.linkedin.com/in/g009/"]')).toBeVisible();
    });
  }
  test("first visit loader fills viewport, exits, and does not replay", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => {
      const samples: { width: number; height: number }[] = [];
      Object.assign(window, { loaderSamples: samples });
      new MutationObserver(() => {
        const el = document.querySelector("[data-page-loader]");
        if (el && !samples.length) {
          const box = el.getBoundingClientRect();
          samples.push({ width: box.width, height: box.height });
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loader = page.locator("[data-page-loader]");
    await expect.poll(() => page.evaluate(() => (window as unknown as { loaderSamples: unknown[] }).loaderSamples.length)).toBeGreaterThan(0);
    const samples = await page.evaluate(() => (window as unknown as { loaderSamples: { width: number; height: number }[] }).loaderSamples);
    expect(samples[0].width).toBe(375);
    expect(samples[0].height).toBe(667);
    await expect(loader).toHaveCount(0, { timeout: 8000 });
    expect(await page.evaluate(() => document.documentElement.classList.contains("page-loader-active"))).toBe(false);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(loader).toHaveCount(0);
  });
  test("reduced motion opens directly to readable content", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "load" });
    await expect(page.locator("[data-page-loader]")).toHaveCount(0);
    await page.locator("#about").scrollIntoViewIfNeeded();
    await expect(page.locator("#about .hero-reveal-copy")).toHaveAttribute("aria-label", /Arena Animation/);
    expect(errors, "server and client must render the same page").toEqual([]);
  });
});


test("desktop sections fit and contact details remain inside the footer", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#about .hero-reveal-copy")).toHaveAttribute("aria-label", /Arena Animation/);
  // The footer reveal is scroll-driven and only finishes at the end of the page, so scroll like a visitor.
  await page.mouse.move(720, 450);
  await expect(async () => {
    await page.mouse.wheel(0, 2000);
    expect(await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 2)).toBe(true);
  }).toPass({ intervals: [50], timeout: 60_000 });
  await expect.poll(() => page.locator(".footer-content").evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.95);
  expect(await page.locator("#footer").evaluate(el => el.querySelector(".footer-copy")!.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: "/tmp/portfolio-footer-desktop.png" });
});
