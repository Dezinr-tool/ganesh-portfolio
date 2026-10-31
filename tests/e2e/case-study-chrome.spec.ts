import { expect, test } from "@playwright/test";

const CASE_STUDIES = ["cove-lane", "totoko", "progent"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
});

for (const slug of CASE_STUDIES) {
  test(`/work/${slug} has no back link and no skip link @mobile`, async ({ page }) => {
    await page.goto(`/work/${slug}`, { waitUntil: "load" });
    await expect(page.locator("main.case-study")).toBeVisible();

    await expect(page.getByRole("link", { name: /^back$/i })).toHaveCount(0);
    await expect(page.locator(".case-study__back")).toHaveCount(0);

    // Not just hidden by the screen: no one can tab onto it either.
    await expect(page.getByRole("link", { name: /skip to content/i })).toHaveCount(0);
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    expect(focused).not.toMatch(/skip to content|back/i);
  });
}

test("the home page keeps its skip link @mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await expect(page.getByRole("link", { name: /skip to content/i })).toHaveCount(1);
});

test("a case study is still reachable from, and back to, the home page @mobile", async ({ page }) => {
  await page.goto("/work/cove-lane", { waitUntil: "load" });
  await page.getByRole("button", { name: /menu/i }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "works" }).click();
  await expect(page).toHaveURL(/\/#works$/);
});
