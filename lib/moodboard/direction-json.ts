import { randomUUID } from "crypto";
import type {
  MoodboardColorSwatch,
  MoodboardPresentationDirection,
} from "./db-types";

const ROLES = ["Primary", "Secondary", "Accent", "Background", "Text"] as const;

function normalizeHex(hex: string): string {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    return `#${cleaned.split("").map((c) => c + c).join("")}`;
  }
  return `#${cleaned.padStart(6, "0").slice(0, 6)}`;
}

function normalizeRole(role: string, index: number): MoodboardColorSwatch["role"] {
  const r = role.trim();
  if (r === "Light" || r === "Surface") return "Background";
  if (ROLES.includes(r as (typeof ROLES)[number])) {
    return r as MoodboardColorSwatch["role"];
  }
  return ROLES[index] ?? "Secondary";
}

function normalizeColors(raw: unknown): MoodboardColorSwatch[] {
  const paletteRaw = Array.isArray(raw) ? raw : [];
  const colors: MoodboardColorSwatch[] = paletteRaw.slice(0, 5).map((c, i) => {
    const color = c as Record<string, string>;
    return {
      hex: normalizeHex(String(color.hex ?? "1a1a1a")),
      name: String(color.name ?? `Color ${i + 1}`),
      role: normalizeRole(String(color.role ?? ROLES[i]), i),
    };
  });
  while (colors.length < 5) {
    colors.push({
      hex: "#1a1a1a",
      name: `Neutral ${colors.length + 1}`,
      role: ROLES[colors.length],
    });
  }
  return colors;
}

export function normalizeCardDirection(
  raw: Record<string, unknown>,
  fallbackIndex: number,
): MoodboardPresentationDirection {
  const index = Number(raw.index ?? raw.directionIndex ?? raw.direction_index ?? fallbackIndex + 1);
  const name = String(raw.name ?? raw.directionName ?? raw.direction_name ?? `Direction ${index}`);
  const tagline = String(raw.tagline ?? "");
  const concept = String(raw.concept ?? "");
  const imagery = String(raw.imagery ?? raw.imagery_style ?? "");
  const illustrationStyle = String(raw.illustration_style ?? raw.illustrationStyle ?? "");

  const typographyRaw = (raw.typography ?? {}) as Record<string, unknown>;
  const headingFont =
    typeof typographyRaw.heading === "string"
      ? typographyRaw.heading
      : String((typographyRaw.heading as Record<string, string> | undefined)?.font ?? "Inter");
  const bodyFont =
    typeof typographyRaw.body === "string"
      ? typographyRaw.body
      : String((typographyRaw.body as Record<string, string> | undefined)?.font ?? "Inter");
  const typeStyle = String(typographyRaw.style ?? typographyRaw.rationale ?? "");

  const moodKeywords = Array.isArray(raw.mood_keywords ?? raw.moodKeywords)
    ? ((raw.mood_keywords ?? raw.moodKeywords) as unknown[]).map(String)
    : [];

  const dos = Array.isArray(raw.do ?? raw.dos) ? ((raw.do ?? raw.dos) as unknown[]).map(String) : [];
  const avoid = Array.isArray(raw.avoid ?? raw.donts)
    ? ((raw.avoid ?? raw.donts) as unknown[]).map(String)
    : [];

  const dir: MoodboardPresentationDirection = {
    id: randomUUID(),
    directionName: name,
    directionIndex: index,
    tagline,
    moodKeywords,
    colorPalette: normalizeColors(raw.colors ?? raw.colorPalette ?? raw.color_palette),
    uiSection: concept
      ? {
          title: name,
          description: concept,
          principles: dos,
          references: [],
        }
      : null,
    typography: {
      heading: { font: headingFont, rationale: typeStyle },
      body: { font: bodyFont, rationale: typeStyle },
      references: [],
    },
    photography: imagery
      ? { styleDescription: imagery, treatment: "", dos: [], avoid: [], references: [] }
      : null,
    illustrations: illustrationStyle
      ? { styleDescription: illustrationStyle, references: [] }
      : null,
    dosDonts: dos.length || avoid.length ? { dos, donts: avoid } : null,
  };

  return dir;
}

export function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* fall through */
    }
  }
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export function parseDirectionsFromPayload(data: unknown): MoodboardPresentationDirection[] | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const list = obj.directions ?? obj.direction;
  const arr = Array.isArray(list) ? list : list ? [list] : null;
  if (!arr?.length) return null;

  return arr.slice(0, 3).map((item, i) =>
    normalizeCardDirection(item as Record<string, unknown>, i),
  );
}

export function tryParseDirectionsFromText(text: string): MoodboardPresentationDirection[] | null {
  const parsed = extractJsonObject(text);
  if (!parsed) return null;
  return parseDirectionsFromPayload(parsed);
}

export function looksLikeMarkdownDirections(text: string): boolean {
  const t = text.trim();
  if (tryParseDirectionsFromText(t)) return false;
  return (
    /^#{1,3}\s+direction\s/i.test(t) ||
    /^---+\s*$/m.test(t) ||
    /\*\*Direction\s+\d/i.test(t) ||
    /Direction\s+\d+\s*[—–-]/i.test(t) ||
    (t.match(/Direction\s+\d/gi)?.length ?? 0) >= 2 ||
    (t.includes("COLOR PALETTE") && t.includes("---"))
  );
}
