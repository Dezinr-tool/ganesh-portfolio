import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
});

test("sample case study shows a placeholder in every slot @mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/work/sample", { waitUntil: "load" });
  expect(response?.status()).toBe(200);

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1500);

  // 1 hero video + 7 gallery images + 3 backgrounds (main, dsgn 4, dsgn 7).
  await expect(page.locator(".case-study__hero-video")).toHaveCount(1);
  for (let n = 1; n <= 7; n += 1) {
    const slot = page.locator(`[data-label="/ dsgn ${n}"]`);
    await expect(slot).toHaveCount(1);
    const loaded = await slot
      .locator("img")
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(loaded, `dsgn ${n} placeholder loaded`).toBe(true);
  }
  // The DSGN 4 side panel is hidden on phones by design, so only check backgrounds that are shown.
  const backgrounds = await page
    .locator(".case-study__bg-main img, .case-study__dsgn4-bg img, .case-study__dsgn7-bg img")
    .evaluateAll((imgs) =>
      imgs
        .filter((img) => (img as HTMLImageElement).offsetParent !== null)
        .map((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0),
    );
  expect(backgrounds.length).toBeGreaterThanOrEqual(2);
  expect(backgrounds.every(Boolean)).toBe(true);
  expect(errors).toEqual([]);
});

test("sample case study is not linked from the works list", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  expect(await page.locator('a[href="/work/sample"]').count()).toBe(0);
});
