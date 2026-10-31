import { expect, test } from "@playwright/test";
import { difference, sampleGradient } from "./hero-gradient-helpers";

test.describe("hero gradient", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
    await page.goto("/", { waitUntil: "load" });
    await expect(page.locator("#hero canvas")).toBeVisible();
    await page.waitForFunction(() => document.querySelector("#hero canvas")?.getAttribute("data-flow-ready") === "true");
  });

  test("spans the reference's colours, from hot orange to cool plum on near-black @mobile", async ({ page }) => {
    const pixels = await sampleGradient(page);
    const cells = Array.from({ length: pixels.length / 4 }, (_, index) => ({
      r: pixels[index * 4],
      g: pixels[index * 4 + 1],
      b: pixels[index * 4 + 2],
    }));
    expect(cells.some(({ r, g }) => r > 180 && g > 60), "orange highlight").toBe(true);
    expect(cells.some(({ r, g }) => r > 200 && g < 50), "pure red").toBe(true);
    expect(cells.some(({ g, b }) => b > g + 4), "cool plum or purple").toBe(true);
    expect(cells.some(({ r, g, b }) => Math.max(r, g, b) < 24), "near-black base").toBe(true);
  });

  test("keeps drifting with no cursor at all", async ({ page }) => {
    const first = await sampleGradient(page);
    await page.waitForTimeout(3000);
    expect(difference(first, await sampleGradient(page))).toBeGreaterThan(0);
  });

  test("stops drawing once the hero is covered", async ({ page, isMobile }) => {
    test.skip(isMobile, "the phone hero scrolls away instead of staying pinned");
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await expect(page.locator("#hero canvas")).toHaveAttribute("data-flow-active", "false");
  });
});
