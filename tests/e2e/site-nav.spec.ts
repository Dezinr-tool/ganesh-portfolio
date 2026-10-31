import { expect, test } from "@playwright/test";

test("first-visit intro loader finishes and reveals the nav", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator("html")).not.toHaveClass(/page-loader-active/, { timeout: 12_000 });
  await expect(page.locator(".site-nav__trigger")).toBeVisible();
});

test.describe("site navigation", () => {
  // Skip the ~7s first-visit intro so each test starts on an interactive page.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
  });

  test("menu button's accessible name includes its visible text", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();
  });

  test("closed menu panel is not reachable by keyboard", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const { total, focusable } = await page.evaluate(() => {
      const els = [...document.querySelectorAll<HTMLElement>(".site-nav__panel a, .site-nav__panel button")];
      const reachable = els.filter((el) => {
        el.focus();
        return document.activeElement === el;
      });
      return { total: els.length, focusable: reachable.length };
    });
    expect(total).toBeGreaterThan(0);
    expect(focusable).toBe(0);
  });

  test("opening the menu exposes the nav links and Escape closes it", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.getByRole("button", { name: /menu/i }).click();
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.getByRole("link", { name: "works" })).toBeVisible();
    const dialog = page.getByRole("dialog", { name: "Site navigation" });
    await expect(dialog.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("rel", /noopener/);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /menu/i })).toHaveAttribute("aria-expanded", "false");
  });

  test("nav links work from a page that has no home sections", async ({ page }) => {
    await page.goto("/work/cove-lane", { waitUntil: "load" });
    await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "works" }).click();
    await expect(page).toHaveURL(/\/#works$/);
  });
});
