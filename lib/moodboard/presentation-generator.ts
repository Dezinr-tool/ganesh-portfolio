import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { cacheGet, cacheKey, cacheSet, hashString } from "../ai-cache";
import { getModelConfig } from "./models";
import { buildBriefFromAnswers } from "./question-flow";
import type { MoodboardPresentationDirection, MoodboardColorSwatch } from "./db-types";
import type { MoodboardModelId } from "./types";
import { enrichDirectionImages } from "./unsplash";

const PRESENTATION_SYSTEM_PROMPT = `You are a senior brand strategist and visual designer at a premium design agency.
Generate exactly 3 contrasting moodboard directions as JSON.

Each direction MUST include ALL sections:
1. Cover: directionName (bold evocative name), tagline (1 sentence)
2. Persona: name, age, occupation, cityTier, description (2-3 sentences), financials, painPoints (4-5 bullets), brandStrategy (2-3 lines), toneOfVoice (adjectives), toneExample (sample phrase)
3. UI section: title (= directionName), description paragraph, principles (3-4 bullets), references (6-8 items with caption — use descriptive captions, url can be empty string)
4. Illustrations: styleDescription paragraph, references (6-7 items)
5. Typography: heading {font, rationale}, body {font, rationale}, references (4-6 items showing type in use)
6. colorPalette: exactly 5 colors with hex, name, role (Primary|Secondary|Accent|Background|Text)
7. moodKeywords: 5-7 adjectives

Directions must be genuinely distinct in personality, palette, and emotional register.
Use real Google Font names for typography. Use valid hex colors.
Return ONLY valid JSON: { "directions": [ ... exactly 3 ... ] }`;

function normalizeHex(hex: string): string {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    return `#${cleaned.split("").map((c) => c + c).join("")}`;
  }
  return `#${cleaned.padStart(6, "0").slice(0, 6)}`;
}

function normalizeDirection(
  raw: Record<string, unknown>,
  index: number,
): MoodboardPresentationDirection {
  const persona = (raw.persona ?? {}) as Record<string, unknown>;
  const uiSection = (raw.uiSection ?? raw.ui_section ?? {}) as Record<string, unknown>;
  const illustrations = (raw.illustrations ?? {}) as Record<string, unknown>;
  const typography = (raw.typography ?? {}) as Record<string, unknown>;
  const heading = (typography.heading ?? {}) as Record<string, string>;
  const body = (typography.body ?? {}) as Record<string, string>;

  const paletteRaw = Array.isArray(raw.colorPalette ?? raw.color_palette)
    ? (raw.colorPalette ?? raw.color_palette) as Record<string, string>[]
    : [];

  const roles = ["Primary", "Secondary", "Accent", "Background", "Text"] as const;
  const colorPalette: MoodboardColorSwatch[] = paletteRaw.slice(0, 5).map((c, i) => ({
    hex: normalizeHex(String(c.hex ?? "1a1a1a")),
    name: String(c.name ?? `Color ${i + 1}`),
    role: (c.role as MoodboardColorSwatch["role"]) ?? roles[i],
  }));

  while (colorPalette.length < 5) {
    colorPalette.push({
      hex: "#1a1a1a",
      name: `Neutral ${colorPalette.length + 1}`,
      role: roles[colorPalette.length],
    });
  }

  const mapRefs = (arr: unknown) =>
    Array.isArray(arr)
      ? arr.map((r) => {
          const ref = r as Record<string, string>;
          return {
            url: String(ref.url ?? ""),
            caption: String(ref.caption ?? ref.description ?? "Reference"),
          };
        })
      : [];

  return {
    id: randomUUID(),
    directionName: String(raw.directionName ?? raw.direction_name ?? raw.name ?? `Direction ${index + 1}`),
    directionIndex: index + 1,
    tagline: String(raw.tagline ?? ""),
    persona: {
      name: String(persona.name ?? "Primary User"),
      age: String(persona.age ?? "28-35"),
      occupation: String(persona.occupation ?? "Professional"),
      cityTier: String(persona.cityTier ?? persona.city_tier ?? "Tier 1 metro"),
      description: String(persona.description ?? ""),
      financials: String(persona.financials ?? ""),
      painPoints: Array.isArray(persona.painPoints ?? persona.pain_points)
        ? ((persona.painPoints ?? persona.pain_points) as unknown[]).map(String)
        : [],
      brandStrategy: String(persona.brandStrategy ?? persona.brand_strategy ?? ""),
      toneOfVoice: String(persona.toneOfVoice ?? persona.tone_of_voice ?? ""),
      toneExample: String(persona.toneExample ?? persona.tone_example ?? ""),
    },
    uiSection: {
      title: String(uiSection.title ?? raw.directionName ?? raw.name ?? ""),
      description: String(uiSection.description ?? ""),
      principles: Array.isArray(uiSection.principles)
        ? uiSection.principles.map(String)
        : [],
      references: mapRefs(uiSection.references).slice(0, 8),
    },
    illustrations: {
      styleDescription: String(
        illustrations.styleDescription ?? illustrations.style_description ?? "",
      ),
      references: mapRefs(illustrations.references).slice(0, 7),
    },
    typography: {
      heading: {
        font: String(heading.font ?? "Syne"),
        rationale: String(heading.rationale ?? ""),
      },
      body: {
        font: String(body.font ?? "DM Sans"),
        rationale: String(body.rationale ?? ""),
      },
      references: mapRefs(typography.references).slice(0, 6),
    },
    colorPalette,
    moodKeywords: Array.isArray(raw.moodKeywords ?? raw.mood_keywords)
      ? ((raw.moodKeywords ?? raw.mood_keywords) as unknown[]).map(String)
      : [],
  };
}

function ensureReferenceCounts(dir: MoodboardPresentationDirection): void {
  const fillRefs = (
    refs: { url: string; caption: string }[],
    count: number,
    prefix: string,
  ) => {
    while (refs.length < count) {
      refs.push({ url: "", caption: `${prefix} reference ${refs.length + 1}` });
    }
  };
  fillRefs(dir.uiSection.references, 6, "UI");
  fillRefs(dir.illustrations.references, 6, "Illustration");
  fillRefs(dir.typography.references, 4, "Typography");
}

async function callAnthropic(
  model: string,
  userPrompt: string,
  onDelta?: (chunk: string) => void,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });

  if (!onDelta) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: PRESENTATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty Anthropic response");
    return block.text;
  }

  const stream = anthropic.messages.stream({
    model,
    max_tokens: 8192,
    system: PRESENTATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let text = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      text += event.delta.text;
      onDelta(event.delta.text);
    }
  }
  return text;
}

function parseDirections(text: string): MoodboardPresentationDirection[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in model response");

  const parsed = JSON.parse(jsonMatch[0]) as { directions?: unknown[] };
  if (!Array.isArray(parsed.directions) || parsed.directions.length === 0) {
    throw new Error("Invalid directions array");
  }

  const directions = parsed.directions.slice(0, 3).map((d, i) => {
    const dir = normalizeDirection(d as Record<string, unknown>, i);
    ensureReferenceCounts(dir);
    return dir;
  });

  if (directions.length !== 3) {
    throw new Error(`Expected 3 directions, got ${directions.length}`);
  }

  return directions;
}

export async function generatePresentationDirections(input: {
  answers: Record<string, unknown>;
  modelId: MoodboardModelId;
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  };
  onDelta?: (chunk: string) => void;
}): Promise<MoodboardPresentationDirection[]> {
  const brief = buildBriefFromAnswers(input.answers, input.extras);
  const config = getModelConfig(input.modelId);
  const key = cacheKey("moodboard-pres", input.modelId, hashString(brief));
  const cached = cacheGet<MoodboardPresentationDirection[]>(key);
  if (cached) return cached;

  const userPrompt = `Create 3 moodboard directions for this brand brief:\n\n${brief}`;

  let text: string;
  try {
    text = await callAnthropic(config.model, userPrompt, input.onDelta);
  } catch (primaryErr) {
    if (input.modelId !== "claude-sonnet") {
      text = await callAnthropic("claude-sonnet-4-6", userPrompt, input.onDelta);
    } else {
      throw primaryErr;
    }
  }

  const directions = parseDirections(text);

  const keywords = [
    String(input.answers.q1 ?? ""),
    String(input.answers.q5 ?? ""),
    ...(Array.isArray(input.answers.q14)
      ? (input.answers.q14 as string[])
      : [String(input.answers.q14 ?? "")]),
  ].filter(Boolean);

  for (const dir of directions) {
    await enrichDirectionImages(dir, keywords);
  }

  cacheSet(key, directions);
  return directions;
}

export async function refinePresentationDirection(input: {
  answers: Record<string, unknown>;
  modelId: MoodboardModelId;
  direction: MoodboardPresentationDirection;
  refineNote: string;
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  };
}): Promise<MoodboardPresentationDirection> {
  const brief = buildBriefFromAnswers(input.answers, input.extras);
  const config = getModelConfig(input.modelId);

  const userPrompt = `${brief}

Regenerate ONLY this direction with refinements:
${JSON.stringify(input.direction, null, 2)}

Refinement request: ${input.refineNote}

Return JSON with exactly 1 direction in the directions array.`;

  const text = await callAnthropic(config.model, userPrompt);
  const directions = parseDirections(text);
  const refined = { ...directions[0], id: input.direction.id };
  await enrichDirectionImages(refined, [input.direction.directionName]);
  return refined;
}
