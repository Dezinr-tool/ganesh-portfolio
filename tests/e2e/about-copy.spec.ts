import { expect, test, type Page } from "@playwright/test";

/** Lines the second fold's paragraph wraps to, and its font size in px. */
function measureCopy(page: Page) {
  return page.locator("#about .hero-reveal-copy").evaluate((el) => {
    const tops = [...el.querySelectorAll(".hero-reveal-copy__word")].map((word) =>
      Math.round(word.getBoundingClientRect().top),
    );
    return { lines: new Set(tops).size, words: tops.length, fontSize: parseFloat(getComputedStyle(el).fontSize) };
  });
}

const MAX_LINES: [width: number, height: number, lines: number][] = [
  [390, 844, 11],
  [768, 1024, 8],
  [1280, 720, 6],
  [1440, 900, 7],
  [1920, 1080, 7],
];

for (const [width, height, maxLines] of MAX_LINES) {
  test(`second fold paragraph stays within ${maxLines} lines at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
    await page.goto("/", { waitUntil: "load" });
    await expect(page.locator("#about .hero-reveal-copy__word").first()).toBeAttached();

    const { lines, fontSize } = await measureCopy(page);
    expect(lines).toBeLessThanOrEqual(maxLines);
    expect(fontSize, "still comfortable to read").toBeGreaterThanOrEqual(20);
  });
}
