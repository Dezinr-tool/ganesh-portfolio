import { expect, test } from "@playwright/test";

const routes = ["/work/cove-lane", "/work/totoko", "/work/progent", "/work/snabbit", "/work/verbaflo"];
const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1366, height: 768 },
];

for (const route of routes) {
  for (const viewport of viewports) {
    test(`${route} fits at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".case-study__title").filter({ visible: true }).first()).toBeVisible();
      await expect(page.locator(".case-study__hero-image")).toBeVisible();
      await expect(page.locator(".case-study__services")).toBeVisible();
      await expect(page.locator(".case-study__dark-zone")).toBeVisible();

      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hero: document.querySelector<HTMLElement>(".case-study__hero-image")?.getBoundingClientRect(),
        title: [...document.querySelectorAll<HTMLElement>(".case-study__title")].find((el) => getComputedStyle(el).display !== "none")?.getBoundingClientRect(),
      }));

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.hero?.width).toBeGreaterThan(0);
      expect(layout.hero?.right).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.title?.right).toBeLessThanOrEqual(layout.viewport + 1);
    });
  }
}
