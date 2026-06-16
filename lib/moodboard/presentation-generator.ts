import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { cacheGet, cacheKey, cacheSet, hashString } from "../ai-cache";
import { getModelConfig } from "./models";
import { buildBriefFromAnswers, extractBrandName } from "./question-flow";
import type {
  MoodboardPresentationDirection,
  MoodboardColorSwatch,
  MoodboardReferenceCard,
} from "./db-types";
import type { MoodboardModelId } from "./types";
import { enrichDirectionImages } from "./unsplash";
import { loadAndFormatContext } from "../context-loader";
import {
  OUTPUT_SECTIONS,
  SECTION_GENERATION_SPEC,
} from "./output-sections";
import {
  buildIntentSummary,
  buildIntentSystemPrompt,
  formatIntentForPrompt,
  type IntentSummary,
} from "./build-intent-summary";
import {
  buildQualityRetryPrompt,
  validateDirectionQuality,
} from "./direction-quality";
import { normalizeCardDirection } from "./direction-json";

function buildSectionSpec(selectedSections: string[]): string {
  const sections = selectedSections.length
    ? selectedSections
    : OUTPUT_SECTIONS.map((s) => s.key);

  return sections
    .map((key) => {
      const spec = SECTION_GENERATION_SPEC[key];
      if (!spec) return null;
      return `- ${spec.jsonKey}: ${spec.description}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildSystemPrompt(selectedSections: string[]): string {
  const sectionLines = buildSectionSpec(selectedSections);

  return `You are a senior brand strategist and visual designer at a premium design agency.
Generate exactly 3 contrasting moodboard directions as JSON.

Each direction MUST always include:
- directionName (bold evocative name)
- tagline (1 sentence)
- moodKeywords (5-7 adjectives)

Generate ONLY these selected sections (omit all others entirely):
${sectionLines}

Directions must be genuinely distinct in personality, palette, and emotional register.
Use real Google Font names for typography. Use valid hex colors.
Return ONLY valid JSON: { "directions": [ ... exactly 3 ... ] }`;
}

function normalizeHex(hex: string): string {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    return `#${cleaned.split("").map((c) => c + c).join("")}`;
  }
  return `#${cleaned.padStart(6, "0").slice(0, 6)}`;
}

function mapRefs(arr: unknown): MoodboardReferenceCard[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => {
    const ref = r as Record<string, string>;
    return {
      url: String(ref.url ?? ""),
      caption: String(ref.caption ?? ref.description ?? "Reference"),
    };
  });
}

function normalizeColorPalette(raw: unknown): MoodboardColorSwatch[] {
  const paletteRaw = Array.isArray(raw) ? raw : [];
  const roles = ["Primary", "Secondary", "Accent", "Background", "Text"] as const;
  const colorPalette: MoodboardColorSwatch[] = paletteRaw.slice(0, 5).map((c, i) => {
    const color = c as Record<string, string>;
    return {
      hex: normalizeHex(String(color.hex ?? "1a1a1a")),
      name: String(color.name ?? `Color ${i + 1}`),
      role: (color.role as MoodboardColorSwatch["role"]) ?? roles[i],
    };
  });
  while (colorPalette.length < 5) {
    colorPalette.push({
      hex: "#1a1a1a",
      name: `Neutral ${colorPalette.length + 1}`,
      role: roles[colorPalette.length],
    });
  }
  return colorPalette;
}

function normalizeDirection(
  raw: Record<string, unknown>,
  index: number,
  selectedSections: string[],
): MoodboardPresentationDirection {
  if (raw.name || raw.colors || raw.concept || raw.colorPalette || raw.color_palette) {
    const dir = normalizeCardDirection(raw, index);
    dir.directionIndex = Number(raw.index ?? raw.directionIndex ?? index + 1);
    dir.selectedSections = selectedSections;
    ensureReferenceCounts(dir, selectedSections);
    return dir;
  }

  const dir: MoodboardPresentationDirection = {
    id: randomUUID(),
    directionName: String(raw.directionName ?? raw.direction_name ?? raw.name ?? `Direction ${index + 1}`),
    directionIndex: index + 1,
    tagline: String(raw.tagline ?? ""),
    selectedSections,
    moodKeywords: Array.isArray(raw.moodKeywords ?? raw.mood_keywords)
      ? ((raw.moodKeywords ?? raw.mood_keywords) as unknown[]).map(String)
      : [],
  };

  if (selectedSections.includes("persona")) {
    const persona = (raw.persona ?? {}) as Record<string, unknown>;
    dir.persona = {
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
    };
  }

  if (selectedSections.includes("ui_references")) {
    const ui = (raw.uiSection ?? raw.ui_section ?? {}) as Record<string, unknown>;
    dir.uiSection = {
      title: String(ui.title ?? dir.directionName),
      description: String(ui.description ?? ""),
      principles: Array.isArray(ui.principles) ? ui.principles.map(String) : [],
      references: mapRefs(ui.references).slice(0, 8),
    };
  }

  if (selectedSections.includes("illustration_style")) {
    const ill = (raw.illustrations ?? {}) as Record<string, unknown>;
    dir.illustrations = {
      styleDescription: String(ill.styleDescription ?? ill.style_description ?? ""),
      references: mapRefs(ill.references).slice(0, 7),
    };
  }

  if (selectedSections.includes("typography")) {
    const typography = (raw.typography ?? {}) as Record<string, unknown>;
    const heading = (typography.heading ?? {}) as Record<string, string>;
    const body = (typography.body ?? {}) as Record<string, string>;
    dir.typography = {
      heading: {
        font: String(heading.font ?? "Syne"),
        rationale: String(heading.rationale ?? ""),
      },
      body: {
        font: String(body.font ?? "DM Sans"),
        rationale: String(body.rationale ?? ""),
      },
      references: mapRefs(typography.references).slice(0, 6),
    };
  }

  if (selectedSections.includes("color_palette")) {
    dir.colorPalette = normalizeColorPalette(raw.colorPalette ?? raw.color_palette);
  }

  if (selectedSections.includes("icon_library")) {
    const icon = (raw.iconography ?? {}) as Record<string, unknown>;
    dir.iconography = {
      style: String(icon.style ?? "Outlined"),
      strokeWeight: String(icon.strokeWeight ?? icon.stroke_weight ?? "Medium"),
      cornerStyle: String(icon.cornerStyle ?? icon.corner_style ?? "Rounded"),
      references: mapRefs(icon.references).slice(0, 8),
    };
  }

  if (selectedSections.includes("micro_interactions")) {
    const micro = (raw.microInteractions ?? raw.micro_interactions ?? {}) as Record<string, unknown>;
    dir.microInteractions = {
      description: String(micro.description ?? ""),
      patterns: Array.isArray(micro.patterns) ? micro.patterns.map(String) : [],
    };
  }

  if (selectedSections.includes("component_style")) {
    const comp = (raw.componentStyle ?? raw.component_style ?? {}) as Record<string, unknown>;
    dir.componentStyle = {
      description: String(comp.description ?? ""),
      principles: Array.isArray(comp.principles) ? comp.principles.map(String) : [],
      references: mapRefs(comp.references).slice(0, 6),
    };
  }

  if (selectedSections.includes("photography_style")) {
    const photo = (raw.photography ?? {}) as Record<string, unknown>;
    dir.photography = {
      styleDescription: String(photo.styleDescription ?? photo.style_description ?? ""),
      treatment: String(photo.treatment ?? ""),
      dos: Array.isArray(photo.dos) ? photo.dos.map(String) : [],
      avoid: Array.isArray(photo.avoid) ? photo.avoid.map(String) : [],
      references: mapRefs(photo.references).slice(0, 6),
    };
  }

  if (selectedSections.includes("product_images")) {
    const prod = (raw.productImages ?? raw.product_images ?? {}) as Record<string, unknown>;
    dir.productImages = {
      styleDescription: String(prod.styleDescription ?? prod.style_description ?? ""),
      staging: String(prod.staging ?? ""),
      references: mapRefs(prod.references).slice(0, 6),
    };
  }

  if (selectedSections.includes("video_motion")) {
    const video = (raw.videoMotion ?? raw.video_motion ?? {}) as Record<string, unknown>;
    dir.videoMotion = {
      styleDescription: String(video.styleDescription ?? video.style_description ?? ""),
      principles: Array.isArray(video.principles) ? video.principles.map(String) : [],
      references: mapRefs(video.references).slice(0, 5),
    };
  }

  if (selectedSections.includes("brand_voice")) {
    const voice = (raw.brandVoice ?? raw.brand_voice ?? {}) as Record<string, unknown>;
    dir.brandVoice = {
      toneDescription: String(voice.toneDescription ?? voice.tone_description ?? ""),
      adjectives: Array.isArray(voice.adjectives) ? voice.adjectives.map(String) : [],
      examplePhrases: Array.isArray(voice.examplePhrases ?? voice.example_phrases)
        ? ((voice.examplePhrases ?? voice.example_phrases) as unknown[]).map(String)
        : [],
      writingPrinciples: Array.isArray(voice.writingPrinciples ?? voice.writing_principles)
        ? ((voice.writingPrinciples ?? voice.writing_principles) as unknown[]).map(String)
        : [],
    };
  }

  if (selectedSections.includes("competitor_references")) {
    const comp = (raw.competitorReferences ?? raw.competitor_references ?? {}) as Record<string, unknown>;
    dir.competitorReferences = {
      description: String(comp.description ?? ""),
      whatToLearn: Array.isArray(comp.whatToLearn ?? comp.what_to_learn)
        ? ((comp.whatToLearn ?? comp.what_to_learn) as unknown[]).map(String)
        : [],
      whatToAvoid: Array.isArray(comp.whatToAvoid ?? comp.what_to_avoid)
        ? ((comp.whatToAvoid ?? comp.what_to_avoid) as unknown[]).map(String)
        : [],
      references: mapRefs(comp.references).slice(0, 6),
    };
  }

  if (selectedSections.includes("dos_donts")) {
    const dd = (raw.dosDonts ?? raw.dos_donts ?? {}) as Record<string, unknown>;
    dir.dosDonts = {
      dos: Array.isArray(dd.dos) ? dd.dos.map(String) : [],
      donts: Array.isArray(dd.donts) ? dd.donts.map(String) : [],
    };
  }

  return dir;
}

function ensureReferenceCounts(
  dir: MoodboardPresentationDirection,
  selectedSections: string[],
): void {
  const fill = (refs: MoodboardReferenceCard[], count: number, prefix: string) => {
    while (refs.length < count) {
      refs.push({ url: "", caption: `${prefix} reference ${refs.length + 1}` });
    }
  };

  if (selectedSections.includes("ui_references") && dir.uiSection) {
    fill(dir.uiSection.references, 6, "UI");
  }
  if (selectedSections.includes("illustration_style") && dir.illustrations) {
    fill(dir.illustrations.references, 6, "Illustration");
  }
  if (selectedSections.includes("typography") && dir.typography) {
    fill(dir.typography.references, 4, "Typography");
  }
  if (selectedSections.includes("icon_library") && dir.iconography) {
    fill(dir.iconography.references, 6, "Icon");
  }
  if (selectedSections.includes("component_style") && dir.componentStyle) {
    fill(dir.componentStyle.references, 4, "Component");
  }
  if (selectedSections.includes("photography_style") && dir.photography) {
    fill(dir.photography.references, 4, "Photo");
  }
  if (selectedSections.includes("product_images") && dir.productImages) {
    fill(dir.productImages.references, 4, "Product");
  }
  if (selectedSections.includes("video_motion") && dir.videoMotion) {
    fill(dir.videoMotion.references, 4, "Video");
  }
  if (selectedSections.includes("competitor_references") && dir.competitorReferences) {
    fill(dir.competitorReferences.references, 4, "Competitor");
  }
}

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  onDelta?: (chunk: string) => void,
  maxTokens = 8192,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });

  if (!onDelta) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty Anthropic response");
    return block.text;
  }

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
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

function parseSingleDirection(
  text: string,
  index: number,
  selectedSections: string[],
): MoodboardPresentationDirection {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in model response");

  const parsed = JSON.parse(jsonMatch[0]) as {
    direction?: unknown;
    directions?: unknown[];
  };

  const raw =
    parsed.direction ??
    (Array.isArray(parsed.directions) ? parsed.directions[0] : null);

  if (!raw) throw new Error("Invalid direction in response");

  const dir = normalizeDirection(raw as Record<string, unknown>, index, selectedSections);
  ensureReferenceCounts(dir, selectedSections);
  return dir;
}

function buildSingleDirectionUserPrompt(
  intent: IntentSummary,
  selectedSections: string[],
  directionIndex: number,
  existingDirections: MoodboardPresentationDirection[],
  retryNote?: string,
): string {
  const intentBlock = formatIntentForPrompt(intent);
  const sectionLines = buildSectionSpec(selectedSections);
  const existingSummary =
    existingDirections.length > 0
      ? `\nAlready generated (must be distinctly different):\n${existingDirections
          .map(
            (d) =>
              `- Direction ${d.directionIndex}: "${d.directionName}" — ${d.tagline}`,
          )
          .join("\n")}`
      : "";

  return `${intentBlock}

Generate direction ${directionIndex} of 3 for this brand.

Include ONLY these sections:
${sectionLines}

Each direction must feel DISTINCTLY different from the others in personality, palette, and emotional register.
${existingSummary}
${retryNote ? `\n${retryNote}` : ""}

Return JSON only — use the exact direction schema from the system prompt.`;
}

async function generateSingleIntentDirection(input: {
  intent: IntentSummary;
  directionIndex: number;
  selectedSections: string[];
  existingDirections: MoodboardPresentationDirection[];
  model: string;
  onDelta?: (chunk: string) => void;
}): Promise<MoodboardPresentationDirection> {
  const systemPrompt = buildIntentSystemPrompt();
  let retryNote: string | undefined;
  let lastDirection: MoodboardPresentationDirection | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const userPrompt = buildSingleDirectionUserPrompt(
      input.intent,
      input.selectedSections,
      input.directionIndex,
      input.existingDirections,
      retryNote,
    );

    const text = await callAnthropic(
      input.model,
      systemPrompt,
      userPrompt,
      input.onDelta,
      2800,
    );

    const dir = parseSingleDirection(
      text,
      input.directionIndex - 1,
      input.selectedSections,
    );
    dir.directionIndex = input.directionIndex;

    const quality = validateDirectionQuality(
      input.intent,
      dir,
      input.existingDirections,
    );

    if (quality.ok || attempt === 1) {
      lastDirection = dir;
      break;
    }

    retryNote = buildQualityRetryPrompt(quality.reasons);
    lastDirection = dir;
  }

  if (!lastDirection) throw new Error("Failed to generate direction");

  const keywords = [
    input.intent.brand_name,
    ...(input.intent.emotional_signals ?? []),
    ...(lastDirection.moodKeywords ?? []),
  ].filter(Boolean);

  await enrichDirectionImages(lastDirection, keywords, input.selectedSections);
  return lastDirection;
}

export async function generatePresentationDirectionsSequential(input: {
  answers: Record<string, unknown>;
  modelId?: MoodboardModelId;
  selectedOutputSections: string[];
  clientName?: string;
  projectName?: string;
  projectType?: string;
  userConfirmations?: import("@/lib/pre-generation-types").UserPreConfirmation;
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  };
  onDelta?: (chunk: string) => void;
  onDirection?: (direction: MoodboardPresentationDirection, index: number) => void | Promise<void>;
  onStatus?: (message: string) => void;
}): Promise<MoodboardPresentationDirection[]> {
  const selectedSections = input.selectedOutputSections.length
    ? input.selectedOutputSections
    : OUTPUT_SECTIONS.map((s) => s.key);

  const intent = buildIntentSummary(input.answers, input.extras);
  const generationModelId: MoodboardModelId = "claude-sonnet";
  const config = getModelConfig(generationModelId);

  const cacheHash = hashString(
    formatIntentForPrompt(intent) + selectedSections.join(",") + intent.brand_name,
  );
  const key = cacheKey("moodboard-intent", generationModelId, cacheHash);
  const cached = cacheGet<MoodboardPresentationDirection[]>(key);
  if (cached?.length === 3) {
    for (const dir of cached) {
      await input.onDirection?.(dir, dir.directionIndex);
    }
    return cached;
  }

  const directions: MoodboardPresentationDirection[] = [];

  for (let i = 1; i <= 3; i++) {
    input.onStatus?.(`Generating direction ${i} of 3…`);
    const dir = await generateSingleIntentDirection({
      intent,
      directionIndex: i,
      selectedSections,
      existingDirections: directions,
      model: config.model,
      onDelta: input.onDelta,
    });
    directions.push(dir);
    await input.onDirection?.(dir, i);
  }

  cacheSet(key, directions);
  return directions;
}

function parseDirections(
  text: string,
  selectedSections: string[],
): MoodboardPresentationDirection[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in model response");

  const parsed = JSON.parse(jsonMatch[0]) as { directions?: unknown[] };
  if (!Array.isArray(parsed.directions) || parsed.directions.length === 0) {
    throw new Error("Invalid directions array");
  }

  const directions = parsed.directions.slice(0, 3).map((d, i) => {
    const dir = normalizeDirection(d as Record<string, unknown>, i, selectedSections);
    ensureReferenceCounts(dir, selectedSections);
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
  selectedOutputSections: string[];
  clientName?: string;
  projectName?: string;
  projectType?: string;
  userConfirmations?: import("@/lib/pre-generation-types").UserPreConfirmation;
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  };
  onDelta?: (chunk: string) => void;
  onDirection?: (direction: MoodboardPresentationDirection, index: number) => void | Promise<void>;
  onStatus?: (message: string) => void;
}): Promise<MoodboardPresentationDirection[]> {
  return generatePresentationDirectionsSequential(input);
}

export async function refinePresentationDirection(input: {
  answers: Record<string, unknown>;
  modelId: MoodboardModelId;
  direction: MoodboardPresentationDirection;
  refineNote: string;
  selectedOutputSections: string[];
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  };
}): Promise<MoodboardPresentationDirection> {
  const selectedSections =
    input.selectedOutputSections.length > 0
      ? input.selectedOutputSections
      : (input.direction.selectedSections ?? OUTPUT_SECTIONS.map((s) => s.key));

  const brief = buildBriefFromAnswers(input.answers, input.extras);
  const config = getModelConfig(input.modelId);
  const systemPrompt = buildSystemPrompt(selectedSections);

  const userPrompt = `${brief}

Regenerate ONLY this direction with refinements:
${JSON.stringify(input.direction, null, 2)}

Refinement request: ${input.refineNote}

Return JSON with exactly 1 direction in the directions array.`;

  const text = await callAnthropic(config.model, systemPrompt, userPrompt);
  const directions = parseDirections(text, selectedSections);
  const refined = { ...directions[0], id: input.direction.id };
  await enrichDirectionImages(refined, [input.direction.directionName], selectedSections);
  return refined;
}
