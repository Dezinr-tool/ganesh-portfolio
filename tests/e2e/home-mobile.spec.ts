import { expect, test } from "@playwright/test";

test.describe("home page on a phone @mobile", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone layout only");
    await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
    await page.goto("/", { waitUntil: "load" });
  });

  test("the hero is not covered by the footer's dark overlay", async ({ page }) => {
    await expect(page.getByText(/know what to do with it/i).first()).toBeVisible();
    // What is actually painted in the middle of the first screen must not be the footer overlay.
    const covering = await page.evaluate(() => {
      const overlay = document.querySelector(".footer-circle-reveal");
      if (!overlay || getComputedStyle(overlay).display === "none") return false;
      const r = overlay.getBoundingClientRect();
      return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2;
    });
    expect(covering).toBe(false);
  });

  test("the footer content is visible once you reach it", async ({ page }) => {
    const footer = page.locator("#footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByText(/All Right Reserved/i)).toBeVisible();
  });
});
