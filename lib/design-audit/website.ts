import type { AuditImage, WebsiteInputMeta } from "./types";
import { cacheGet, cacheKey, cacheSet } from "../ai-cache";

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const pattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) && headings.length < 20) {
    const level = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (text) headings.push(`H${level}: ${text.slice(0, 120)}`);
  }
  return headings;
}

function extractMeta(html: string, name: string): string | null {
  const og = new RegExp(
    `<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  ).exec(html);
  if (og?.[1]) return og[1];
  const n = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  ).exec(html);
  return n?.[1] ?? null;
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m?.[1]?.trim() ?? "";
}

function extractNavLinks(html: string): string[] {
  const links = new Set<string>();
  const navBlock = /<nav[\s\S]*?<\/nav>/gi.exec(html)?.[0] ?? html.slice(0, 8000);
  const pattern = /<a[^>]+href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(navBlock)) && links.size < 15) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text && text.length < 40) links.add(text);
  }
  return [...links];
}

function extractCtaLabels(html: string): string[] {
  const ctas = new Set<string>();
  const patterns = [
    /<button[^>]*>([\s\S]*?)<\/button>/gi,
    /<a[^>]*class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) && ctas.size < 12) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text && text.length < 50) ctas.add(text);
    }
  }
  return [...ctas];
}

function extractCssColors(html: string): string[] {
  const colors = new Set<string>();
  const hexMatches = html.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  for (const hex of hexMatches) {
    if (hex.length === 4 || hex.length === 7) colors.add(hex.toLowerCase());
  }
  const varMatches = html.match(/--[\w-]+:\s*(#[0-9a-fA-F]{3,8})/g) ?? [];
  for (const v of varMatches) {
    const hex = v.match(/(#[0-9a-fA-F]{3,8})/)?.[1];
    if (hex) colors.add(hex.toLowerCase());
  }
  return [...colors].slice(0, 20);
}

async function captureWithPlaywright(
  url: string,
): Promise<AuditImage | null> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      });
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const buffer = await page.screenshot({ fullPage: true, type: "png" });
      return {
        base64: buffer.toString("base64"),
        mediaType: "image/png",
        label: "Website screenshot",
      };
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}

export async function fetchWebsiteAuditInput(url: string): Promise<{
  meta: WebsiteInputMeta;
  image: AuditImage | null;
}> {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  const key = cacheKey("audit-website", normalized);
  const cached = cacheGet<{ meta: WebsiteInputMeta; image: AuditImage | null }>(key);
  if (cached) return cached;

  const res = await fetch(normalized, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; DesignAuditBot/1.0; +https://designbyganesh.com)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });

  const html = res.ok ? await res.text() : "";
  const title = extractTitle(html) || normalized;
  const description =
    extractMeta(html, "description") || extractMeta(html, "og:description") || "";
  const headings = extractHeadings(html);
  const navLinks = extractNavLinks(html);
  const ctaLabels = extractCtaLabels(html);
  const cssColors = extractCssColors(html);

  let image = await captureWithPlaywright(normalized);

  if (!image) {
    const ogImage = extractMeta(html, "og:image");
    if (ogImage) {
      try {
        const imgRes = await fetch(ogImage, { signal: AbortSignal.timeout(10000) });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          image = {
            base64: buffer.toString("base64"),
            mediaType: "image/png",
            label: "OG preview (Playwright unavailable)",
          };
        }
      } catch {
        // ignore
      }
    }
  }

  const output = {
    meta: {
      url: normalized,
      title,
      description,
      headings,
      navLinks,
      ctaLabels,
      cssColors,
      screenshotFallback: !image || image.label?.includes("OG preview"),
    },
    image,
  };
  cacheSet(key, output, 15 * 60 * 1000);
  return output;
}
