import { expect, test, type Page } from "@playwright/test";

const SLUGS = ["snabbit", "verbaflo"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
});

/** Scroll down the page in steps so lazy images and videos load. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
}

for (const slug of SLUGS) {
  test.describe(`/work/${slug}`, () => {
    test("renders with its title, sections and live-site link @mobile", async ({ page }) => {
      const response = await page.goto(`/work/${slug}`, { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await expect(page.locator(".case-study__title").filter({ visible: true }).first()).toBeVisible();
      expect(await page.locator(".case-study__description .case-study__meta-col").count()).toBeGreaterThan(0);
      await expect(page.locator(".case-study__services")).toBeVisible();
    });

    test("does not name the agency or show a testimonial @mobile", async ({ page }) => {
      await page.goto(`/work/${slug}`, { waitUntil: "load" });
      const text = await page.locator("main").innerText();
      expect(text).not.toMatch(/brucira/i);
      expect(text).not.toMatch(/testimonial|founder & ceo|ceo$/im);
    });

    test("every image loads and every video plays @mobile", async ({ page }) => {
      await page.goto(`/work/${slug}`, { waitUntil: "load" });
      await scrollThrough(page);
      await page.waitForTimeout(1500);

      const loadedImages = () =>
        page.evaluate(() => {
          const all = [...document.querySelectorAll<HTMLImageElement>("main img")].filter((img) => img.getBoundingClientRect().width > 8);
          return { count: all.length, broken: all.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.currentSrc || img.src) };
        });
      // The first request for each large image is resized on demand, so give it time.
      await expect.poll(async () => (await loadedImages()).broken, { timeout: 30_000 }).toEqual([]);
      expect((await loadedImages()).count).toBeGreaterThan(2);

      const videos = page.locator("main video");
      const count = await videos.count();
      expect(count).toBeGreaterThan(1);
      for (let index = 0; index < count; index += 1) {
        const video = videos.nth(index);
        await video.scrollIntoViewIfNeeded();
        await expect
          .poll(() => video.evaluate((el: HTMLVideoElement) => ({ ready: el.readyState >= 2, width: el.videoWidth > 0, playing: !el.paused })), { timeout: 30_000 })
          .toEqual({ ready: true, width: true, playing: true });
      }
    });

    test("fills every gallery slot @mobile", async ({ page }) => {
      await page.goto(`/work/${slug}`, { waitUntil: "load" });
      for (let index = 1; index <= 7; index += 1) {
        const slot = page.locator(`[data-label="/ dsgn ${index}"]`);
        await expect(slot, `slot ${index}`).toHaveCount(1);
        await expect(slot.locator("img, video"), `slot ${index} media`).toHaveCount(1);
      }
    });

    test("does not scroll sideways on a phone @mobile", async ({ page, isMobile }) => {
      test.skip(!isMobile, "phone only");
      await page.goto(`/work/${slug}`, { waitUntil: "load" });
      await scrollThrough(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  });
}
