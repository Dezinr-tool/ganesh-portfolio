import { expect, test, type Page } from "@playwright/test";

/** Console errors that come from missing local secrets/DB, not from page code. */
const ENV_NOISE = [/Failed to load resource/i, /status of 5\d\d/i, /adsbygoogle/i, /googlesyndication/i];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!ENV_NOISE.some((re) => re.test(text))) errors.push(`console: ${text}`);
  });
  return errors;
}

// Skip the ~7s first-visit intro loader (covered in site-nav.spec.ts).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
});

const PUBLIC_PAGES: [path: string, text: RegExp][] = [
  ["/", /know what to do with it/i],
  ["/work/cove-lane", /cove/i],
  ["/ea/login", /log in|sign in/i],
  ["/ea/signup", /sign up|create/i],
  ["/ea/privacy", /privacy/i],
  ["/ea/terms", /terms/i],
  ["/voice-notes", /voice notes/i],
  ["/voice-notes/privacy", /privacy/i],
  ["/dashboard/login", /enter the password/i],
  ["/memory-vault/login", /password/i],
];

for (const [path, text] of PUBLIC_PAGES) {
  test(`public page ${path} renders without errors @mobile`, async ({ page }) => {
    const errors = trackErrors(page);
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `${path} status`).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(text);
    await page.waitForLoadState("load");
    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("public pages do not scroll horizontally on a phone @mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  for (const path of ["/", "/ea/login", "/dashboard/login", "/voice-notes"]) {
    await page.goto(path, { waitUntil: "load" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
  }
});

test("unknown case study returns 404", async ({ page }) => {
  const res = await page.goto("/work/this-does-not-exist");
  expect(res?.status()).toBe(404);
});

const DASHBOARD_GATED = [
  "/dashboard",
  "/dashboard/invoices",
  "/dashboard/agreements/new",
  "/dashboard/projects",
  "/dashboard/settings",
  "/expense-tracker",
  "/tools",
  "/design-audit",
  "/ia",
  "/knowledge-admin",
  "/moodboard",
  "/moodboard/admin",
  "/max",
  "/zoox-demo",
];

for (const path of DASHBOARD_GATED) {
  test(`gated page ${path} sends visitors to the dashboard login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard\/login\?from=/);
  });
}

for (const path of ["/ea/chat", "/ea/dashboard", "/ea/meetings", "/ea/settings"]) {
  test(`EA page ${path} sends visitors to the EA login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/ea\/login$/);
  });
}

test("memory vault sends visitors to its own login", async ({ page }) => {
  await page.goto("/memory-vault");
  await expect(page).toHaveURL(/\/memory-vault\/login\?from=/);
});

const PROTECTED_APIS = [
  "/api/invoices",
  "/api/projects",
  "/api/expense-tracker",
  "/api/clients",
  "/api/agreements",
  "/api/settings",
  "/api/dashboard/stats",
  "/api/memory-vault",
  "/api/ea/chat",
  "/api/moodboard/admin/sessions",
];

for (const path of PROTECTED_APIS) {
  test(`API ${path} returns 401 without a session`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(401);
  });
}

test("dashboard login rejects a wrong password", async ({ page }) => {
  await page.goto("/dashboard/login");
  await page.locator('input[type="password"]').fill("definitely-wrong");
  await page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first().click();
  await expect(page).toHaveURL(/\/dashboard\/login/);
  // "Invalid password." with DASHBOARD_PASSWORD set, "not configured" without it.
  await expect(page.getByRole("alert").filter({ hasText: /invalid|not configured/i })).toBeVisible();
});

