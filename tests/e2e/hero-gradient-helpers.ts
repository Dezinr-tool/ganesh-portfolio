import type { Page } from "@playwright/test";

/**
 * Reads the gradient canvas as a small grid of RGBA cells. The drawing buffer is only readable
 * after the page's own frame callback, so this queues behind it: a timeout lands between frames,
 * after the page has already asked for its next one.
 */
export function sampleGradient(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const read = () => {
          const canvas = document.querySelector<HTMLCanvasElement>("#hero canvas");
          const out = document.createElement("canvas");
          out.width = 32;
          out.height = 18;
          const ctx = out.getContext("2d");
          if (!canvas || !ctx) return resolve([]);
          ctx.drawImage(canvas, 0, 0, 32, 18);
          resolve([...ctx.getImageData(0, 0, 32, 18).data]);
        };
        setTimeout(() => requestAnimationFrame(read));
      }),
  );
}

export function usesSoftwareGl(page: Page) {
  return page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return !info || /swiftshader|software|llvmpipe/i.test(String(gl?.getParameter(info.UNMASKED_RENDERER_WEBGL)));
  });
}

export function difference(a: number[], b: number[]) {
  return a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0);
}
