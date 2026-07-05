/**
 * Zero-budget visual reference gatherer — Pinterest + Dribbble HTML scrape.
 * No API keys. Falls back gracefully when platforms block fetch.
 */

export type ScrapedReference = {
  url: string;
  caption: string;
  source: "pinterest" | "dribbble" | "behance";
};

const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const FETCH_TIMEOUT_MS = 8000;

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function uniqueByUrl(items: ScrapedReference[]): ScrapedReference[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function scoreCaption(caption: string, keywords: string[]): number {
  const lower = caption.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase().trim();
    if (k.length > 2 && lower.includes(k)) score += 2;
  }
  return score;
}

function filterRelevant(items: ScrapedReference[], keywords: string[]): ScrapedReference[] {
  if (keywords.length === 0) return items;
  const scored = items
    .map((item) => ({ item, score: scoreCaption(item.caption, keywords) }))
    .sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0).map((s) => s.item);
  return relevant.length >= 2 ? relevant : items;
}

function extractPinterestImages(html: string, limit: number): ScrapedReference[] {
  const results: ScrapedReference[] = [];
  const pinimgPattern =
    /https?:\/\/i\.pinimg\.com\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp)/gi;
  const altPattern = /"description":"([^"]{8,120})"/g;

  const urls = [...html.matchAll(pinimgPattern)].map((m) =>
    m[0].replace(/\\u002F/g, "/").replace(/\\\//g, "/"),
  );
  const alts = [...html.matchAll(altPattern)].map((m) => m[1]);

  for (let i = 0; i < urls.length && results.length < limit; i++) {
    const url = urls[i];
    if (!url || url.includes("75x75") || url.includes("60x60")) continue;
    const hiRes = url.replace(/\/\d+x\//, "/736x/");
    results.push({
      url: hiRes,
      caption: alts[i] ?? "Pinterest reference",
      source: "pinterest",
    });
  }
  return results;
}

function extractDribbbleImages(html: string, limit: number): ScrapedReference[] {
  const results: ScrapedReference[] = [];
  const cdnPattern =
    /https?:\/\/cdn\.dribbble\.com\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp)/gi;
  const titlePattern = /"title":"([^"]{4,100})"/g;

  const urls = [...html.matchAll(cdnPattern)].map((m) => m[0]);
  const titles = [...html.matchAll(titlePattern)].map((m) => m[1]);

  for (let i = 0; i < urls.length && results.length < limit; i++) {
    const url = urls[i];
    if (!url || url.includes("avatar") || url.includes("team")) continue;
    results.push({
      url,
      caption: titles[i] ?? "Dribbble shot",
      source: "dribbble",
    });
  }
  return results;
}

export function buildReferenceQueryPlan(input: {
  directionName: string;
  moodKeywords: string[];
  industry?: string;
  projectType?: string;
  captions?: string[];
}): { platform: "pinterest" | "dribbble"; query: string }[] {
  const mood = input.moodKeywords.slice(0, 4).join(" ");
  const base = [input.directionName, mood, input.industry, input.projectType]
    .filter(Boolean)
    .join(" ")
    .trim();

  const uiSuffix = input.projectType?.toLowerCase().includes("app")
    ? "mobile app UI design"
    : "website UI design";

  const plans: { platform: "pinterest" | "dribbble"; query: string }[] = [
    { platform: "pinterest", query: `${base} ${uiSuffix}`.trim() },
    { platform: "pinterest", query: `${input.directionName} ${mood} design moodboard`.trim() },
    { platform: "dribbble", query: `${base} ${uiSuffix}`.trim() },
    { platform: "dribbble", query: `${input.directionName} branding`.trim() },
  ];

  if (input.captions?.length) {
    for (const cap of input.captions.slice(0, 2)) {
      plans.push({ platform: "pinterest", query: `${cap} ${mood}`.trim() });
    }
  }

  const seen = new Set<string>();
  return plans.filter((p) => {
    const key = `${p.platform}:${p.query}`;
    if (!p.query || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function scrapePinterest(query: string, limit: number): Promise<ScrapedReference[]> {
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  if (!html) return [];
  return extractPinterestImages(html, limit);
}

async function scrapeDribbble(query: string, limit: number): Promise<ScrapedReference[]> {
  const url = `https://dribbble.com/search/${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  if (!html) return [];
  return extractDribbbleImages(html, limit);
}

export async function fetchReferencesForDirection(input: {
  directionName: string;
  moodKeywords: string[];
  industry?: string;
  projectType?: string;
  captions?: string[];
  limit?: number;
}): Promise<ScrapedReference[]> {
  const limit = input.limit ?? 6;
  const keywords = [
    input.directionName,
    ...input.moodKeywords,
    input.industry ?? "",
    input.projectType ?? "",
  ].filter(Boolean);

  const plans = buildReferenceQueryPlan(input);
  const collected: ScrapedReference[] = [];

  for (const plan of plans) {
    if (collected.length >= limit) break;
    const remaining = limit - collected.length;
    const batch =
      plan.platform === "pinterest"
        ? await scrapePinterest(plan.query, remaining + 2)
        : await scrapeDribbble(plan.query, remaining + 2);
    collected.push(...batch);
  }

  return filterRelevant(uniqueByUrl(collected), keywords).slice(0, limit);
}
