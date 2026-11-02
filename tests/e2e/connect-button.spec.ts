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

test.describe("the email option", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  async function openPanel(page: Page) {
    await page.goto("/work/cove-lane", { waitUntil: "load" });
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".connect-btn__root")!).opacity)).toBe("1");
    await page.locator(".connect-btn__pill").click();
    await expect(page.locator(".connect-btn__panel")).toHaveClass(/is-open/);
  }

  test("still points at a mailto link @mobile", async ({ page }) => {
    await openPanel(page);
    await expect(page.locator('.connect-btn__option[href^="mailto:"]')).toHaveAttribute("href", "mailto:hello@designbyganesh.com");
  });

  test("copies the address and says so, in case no mail app opens @mobile", async ({ page }) => {
    await openPanel(page);
    // Keep the test off the network: on desktop the click opens Gmail in a new tab.
    await page.context().route("https://mail.google.com/**", (route) => route.abort());
    await page.locator('.connect-btn__option[href^="mailto:"]').click();

    await expect(page.locator(".connect-btn__panel")).toHaveClass(/is-open/);
    await expect(page.locator('.connect-btn__option[href^="mailto:"]')).toContainText(/copied/i);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("hello@designbyganesh.com");

    // The panel closes itself after a moment.
    await expect(page.locator(".connect-btn__panel")).not.toHaveClass(/is-open/, { timeout: 6000 });
  });

  test("opens a Gmail compose window addressed to me on desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "phones hand mailto links to their own mail app");
    await openPanel(page);
    const requested: string[] = [];
    await page.context().route("https://mail.google.com/**", (route) => {
      requested.push(route.request().url());
      return route.abort();
    });
    await page.locator('.connect-btn__option[href^="mailto:"]').click();
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    const url = new URL(requested[0]);
    expect(url.origin + url.pathname).toBe("https://mail.google.com/mail/");
    expect(url.searchParams.get("view")).toBe("cm");
    expect(url.searchParams.get("to")).toBe("hello@designbyganesh.com");
    // The page behind stays where it was.
    expect(page.url()).toContain("/work/cove-lane");
  });

  test("leaves mailto to the phone's own mail app @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "desktop opens Gmail instead");
    await openPanel(page);
    let opened = false;
    page.on("popup", () => { opened = true; });
    await page.locator('.connect-btn__option[href^="mailto:"]').click();
    await page.waitForTimeout(600);
    expect(opened).toBe(false);
  });
});
