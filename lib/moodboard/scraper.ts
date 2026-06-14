import Anthropic from "@anthropic-ai/sdk";
import type { WebsiteAnalysis } from "./types";

function extractMeta(html: string, property: string): string | null {
  const og = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  ).exec(html);
  if (og?.[1]) return og[1];

  const name = new RegExp(
    `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  ).exec(html);
  return name?.[1] ?? null;
}

function extractTitle(html: string): string {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match?.[1]?.trim() ?? "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function extractThemeColors(html: string): string[] {
  const colors = new Set<string>();
  const hexMatches = html.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  for (const hex of hexMatches.slice(0, 20)) {
    if (hex.length === 4 || hex.length === 7) colors.add(hex.toLowerCase());
  }
  const theme = extractMeta(html, "theme-color");
  if (theme?.startsWith("#")) colors.add(theme.toLowerCase());
  return [...colors].slice(0, 8);
}

export async function scrapeWebsite(url: string): Promise<WebsiteAnalysis> {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const res = await fetch(normalized, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MoodboardBot/1.0; +https://designbyganesh.com)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return buildFallback(normalized, `HTTP ${res.status}`);
    }

    const html = await res.text();
    const title = extractTitle(html) || extractMeta(html, "og:title") || normalized;
    const description =
      extractMeta(html, "description") ||
      extractMeta(html, "og:description") ||
      "";
    const textSample = stripHtml(html);
    const colors = extractThemeColors(html);

    const analysis = await analyzeWithAi({
      url: normalized,
      title,
      description,
      textSample,
      colors,
    });

    return { ...analysis, url: normalized, fallback: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return buildFallback(normalized, message);
  }
}

function buildFallback(url: string, reason: string): WebsiteAnalysis {
  return {
    url,
    title: url.replace(/^https?:\/\//, ""),
    description: "",
    personality: "Unable to scrape automatically — please complete the intake manually.",
    tone: "Unknown",
    colors: [],
    problems: [`Scrape unavailable: ${reason}`],
    vision: "Use the quick questions to define brand direction.",
    fallback: true,
  };
}

async function analyzeWithAi(input: {
  url: string;
  title: string;
  description: string;
  textSample: string;
  colors: string[];
}): Promise<Omit<WebsiteAnalysis, "url" | "fallback">> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      title: input.title,
      description: input.description,
      personality: "Editorial, product-led",
      tone: input.description.slice(0, 120) || "Professional",
      colors: input.colors,
      problems: ["Limited analysis — add ANTHROPIC_API_KEY for deeper scrape insights"],
      vision: "Evolve toward a clearer, more premium digital presence.",
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Analyze this website for a brand moodboard brief. Return JSON only:
{
  "title": string,
  "description": string,
  "personality": string,
  "tone": string,
  "colors": string[] (hex if possible),
  "problems": string[] (2-4 UX/brand issues),
  "vision": string (1-2 sentences on improvement direction)
}

URL: ${input.url}
Title: ${input.title}
Meta: ${input.description}
Detected colors: ${input.colors.join(", ") || "none"}
Page text sample: ${input.textSample.slice(0, 2500)}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No analysis response");
  }

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? text.text) as Partial<WebsiteAnalysis>;

  return {
    title: parsed.title ?? input.title,
    description: parsed.description ?? input.description,
    personality: parsed.personality ?? "Modern brand presence",
    tone: parsed.tone ?? "Professional",
    colors: Array.isArray(parsed.colors) ? parsed.colors : input.colors,
    problems: Array.isArray(parsed.problems) ? parsed.problems : [],
    vision: parsed.vision ?? "Refine visual hierarchy and brand storytelling.",
  };
}
