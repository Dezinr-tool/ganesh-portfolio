/**
 * QA: hero fluid canvas mounts and pixels change after pointer move.
 * Run: npx tsx scripts/qa-hero-fluid.ts
 */
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const canvas = page.locator("#hero canvas");
  const count = await canvas.count();
  console.log("canvas count in #hero:", count);

  if (count === 0) {
    console.error("FAIL: no canvas in #hero");
    process.exit(1);
  }

  const box = await page.locator("#hero").boundingBox();
  if (!box) {
    console.error("FAIL: #hero not found");
    process.exit(1);
  }

  const sample = async (x: number, y: number) =>
    page.evaluate(
      ({ sx, sy }) => {
        const canvas = document.querySelector("#hero canvas") as HTMLCanvasElement | null;
        if (!canvas) return null;
        const ctx = canvas.getContext("webgl") ?? canvas.getContext("webgl2");
        if (!ctx) return { error: "no gl context" };
        const gl = ctx as WebGLRenderingContext;
        const px = new Uint8Array(4);
        const dpr = window.devicePixelRatio || 1;
        const cx = Math.floor(sx * dpr);
        const cy = Math.floor((canvas.height / dpr - sy) * dpr);
        gl.readPixels(cx, cy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return { r: px[0], g: px[1], b: px[2], w: canvas.width, h: canvas.height };
      },
      { sx: x, sy: y },
    );

  const before = await sample(box.width * 0.7, box.height * 0.35);
  console.log("pixel before:", before);

  for (let i = 0; i < 30; i++) {
    await page.mouse.move(box.x + box.width * (0.4 + i * 0.01), box.y + box.height * 0.35);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(500);

  const after = await sample(box.width * 0.7, box.height * 0.35);
  console.log("pixel after:", after);

  if (errors.length) {
    console.log("console messages:", errors.slice(0, 10).join("\n"));
  }

  const changed =
    before &&
    after &&
    "r" in before &&
    "r" in after &&
    (Math.abs(before.r - after.r) > 2 ||
      Math.abs(before.g - after.g) > 2 ||
      Math.abs(before.b - after.b) > 2);

  if (!changed) {
    console.error("FAIL: canvas pixels did not change after mouse move");
    process.exit(1);
  }

  console.log("PASS: hero fluid animation is rendering");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
