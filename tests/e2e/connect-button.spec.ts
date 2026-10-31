import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
});

/** The floating contact button's own state, plus what a tap on the first nav link would hit. */
function buttonState(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(".connect-btn__root")!;
    const style = getComputedStyle(root);
    const link = [...document.querySelectorAll<HTMLElement>(".site-nav__link")].find(a => /works/i.test(a.textContent ?? ""))!;
    const box = link.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { opacity: style.opacity, pointerEvents: style.pointerEvents, tapHitsLink: link.contains(hit) };
  });
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: /menu/i }).click();
  await expect(page.getByRole("button", { name: /menu/i })).toHaveAttribute("aria-expanded", "true");
  // The panel slides in over 0.42s and the button fades out over 0.35s: measure once both have landed.
  await page.getByRole("dialog", { name: "Site navigation" }).evaluate(async (panel) => {
    await Promise.all(panel.getAnimations().map((animation) => animation.finished));
  });
  await expect
    .poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector(".connect-btn__root")!).opacity)))
    .toBeLessThan(0.01);
}

test("the contact button gets out of the way of the open menu on a case study @mobile", async ({ page }) => {
  await page.goto("/work/cove-lane", { waitUntil: "load" });
  await openMenu(page);
  const state = await buttonState(page);
  expect(Number(state.opacity)).toBeLessThan(0.01);
  expect(state.pointerEvents).toBe("none");
  expect(state.tapHitsLink, "a tap on 'works' reaches the link").toBe(true);
});

test("the contact button gets out of the way of the open menu on the home page, past the hero @mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".connect-btn__root")!).opacity)).toBe("1");
  await openMenu(page);
  const state = await buttonState(page);
  expect(Number(state.opacity)).toBeLessThan(0.01);
  expect(state.pointerEvents).toBe("none");
  expect(state.tapHitsLink, "a tap on 'works' reaches the link").toBe(true);
});

test("the contact button comes back once the menu closes @mobile", async ({ page }) => {
  await page.goto("/work/cove-lane", { waitUntil: "load" });
  await openMenu(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /menu/i })).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".connect-btn__root")!).opacity)).toBe("1");
});
