import { expect, test, type Page } from "@playwright/test";

const skipLoader = () => sessionStorage.setItem("portfolio-loaded", "1");

const headline = (page: Page) => page.locator("[data-hero-headline]");

function sheenVar(page: Page, name: "--sheen-x" | "--sheen-y") {
  return headline(page).evaluate((el, prop) => parseFloat((el as HTMLElement).style.getPropertyValue(prop)), name);
}

/** Horizontal centre of the teal text pixels in the headline, as a share of its width. */
async function tealCentre(page: Page) {
  const png = await headline(page).screenshot({ type: "png" });
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, image.width, image.height);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 170 && data[i + 1] > 180 && data[i + 2] > 180) {
        sum += ((i / 4) % image.width) / image.width;
        count += 1;
      }
    }
    return count ? { centre: sum / count, count } : null;
  }, png.toString("base64"));
}

test.describe("hero headline sheen", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(skipLoader);
    await page.goto("/", { waitUntil: "load" });
    await expect(headline(page)).toBeVisible();
  });

  test("the headline is painted with a teal gradient @mobile", async ({ page }) => {
    const style = await headline(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { clip: s.webkitBackgroundClip, fill: s.webkitTextFillColor, image: s.backgroundImage, color: s.color };
    });
    expect(style.clip).toBe("text");
    expect(style.fill).toBe("rgba(0, 0, 0, 0)");
    expect(style.image).toContain("radial-gradient");
    // Falls back to readable text wherever text clipping is unavailable.
    expect(style.color).toBe("rgb(240, 240, 240)");
  });

  test("the teal follows the cursor across the headline", async ({ page, isMobile }) => {
    test.skip(isMobile, "needs a cursor");
    const box = (await headline(page).boundingBox())!;
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.15, y);
    await expect.poll(() => sheenVar(page, "--sheen-x")).toBeLessThan(20);
    const left = await tealCentre(page);

    await page.mouse.move(box.x + box.width * 0.85, y);
    await expect.poll(() => sheenVar(page, "--sheen-x")).toBeGreaterThan(80);
    const right = await tealCentre(page);

    expect(left, "teal text near the cursor").not.toBeNull();
    expect(right, "teal text near the cursor").not.toBeNull();
    expect(right!.centre).toBeGreaterThan(left!.centre + 0.3);
  });

  test("it drifts on its own until a cursor arrives @mobile", async ({ page }) => {
    const first = await sheenVar(page, "--sheen-x");
    await expect.poll(() => sheenVar(page, "--sheen-x")).not.toBe(first);
  });

  test("it stops once the hero is covered", async ({ page, isMobile }) => {
    test.skip(isMobile, "the phone hero scrolls away instead of staying pinned");
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await page.waitForTimeout(500);
    const first = await sheenVar(page, "--sheen-x");
    expect(first).toBeGreaterThanOrEqual(0);
    await page.waitForTimeout(1000);
    expect(await sheenVar(page, "--sheen-x")).toBe(first);
  });
});

test.describe("hero headline sheen with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the headline stays plain, readable text", async ({ page }) => {
    await page.addInitScript(skipLoader);
    await page.goto("/", { waitUntil: "load" });
    const style = await headline(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { fill: s.webkitTextFillColor, image: s.backgroundImage };
    });
    expect(style.fill).toBe("rgb(240, 240, 240)");
    expect(style.image).toBe("none");
  });
});
