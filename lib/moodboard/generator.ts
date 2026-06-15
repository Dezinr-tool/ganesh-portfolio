import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { cacheGet, cacheKey, cacheSet, hashString } from "../ai-cache";
import { getModelConfig } from "./models";
import { MOODBOARD_SYSTEM_PROMPT } from "./system-prompt";
import type {
  MoodboardBrief,
  MoodboardDirection,
  MoodboardModelId,
  MoodboardTab,
} from "./types";

function buildUserPrompt(
  brief: MoodboardBrief,
  tab: MoodboardTab,
  refineNote?: string,
  existingDirection?: MoodboardDirection,
): string {
  const parts: string[] = [`Moodboard type: ${tab}`];

  if (brief.eaPrefillSummary) {
    parts.push(`EA intelligence context:\n${brief.eaPrefillSummary}`);
  }
  if (brief.brandName) parts.push(`Brand name: ${brief.brandName}`);
  if (brief.industry) parts.push(`Industry: ${brief.industry}`);
  if (brief.audience) parts.push(`Target audience: ${brief.audience}`);
  if (brief.feeling) parts.push(`Brand feeling (adjectives): ${brief.feeling}`);
  if (brief.colorDirection) parts.push(`Color direction: ${brief.colorDirection}`);
  if (brief.admiredBrands) parts.push(`Admired brands/sites: ${brief.admiredBrands}`);
  if (brief.values) parts.push(`Brand values: ${brief.values}`);
  if (brief.stylePreference) parts.push(`Style preference: ${brief.stylePreference}`);
  if (brief.campaignGoal) parts.push(`Campaign goal: ${brief.campaignGoal}`);
  if (brief.platform) parts.push(`Platform: ${brief.platform}`);
  if (brief.questionnaireText) {
    parts.push(`Questionnaire:\n${brief.questionnaireText.slice(0, 2000)}`);
  }
  if (brief.referenceNotes) parts.push(`Reference notes: ${brief.referenceNotes}`);
  if (brief.referenceImageCount) {
    parts.push(`User uploaded ${brief.referenceImageCount} reference image(s).`);
  }
  if (brief.problemStatement) {
    parts.push(`Refresh motivation / problems: ${brief.problemStatement}`);
  }
  if (brief.avoid) parts.push(`Avoid: ${brief.avoid}`);
  if (brief.feelChips?.length) parts.push(`Feel directions: ${brief.feelChips.join(", ")}`);
  if (brief.businessDescription) parts.push(`Business: ${brief.businessDescription}`);
  if (brief.logoMarkType) parts.push(`Logo mark type: ${brief.logoMarkType}`);
  if (brief.logoStyle) parts.push(`Logo style: ${brief.logoStyle}`);
  if (brief.campaignPlatforms?.length) {
    parts.push(`Campaign platforms: ${brief.campaignPlatforms.join(", ")}`);
  }
  if (brief.websiteAnalysis) {
    parts.push(
      `Existing website analysis (${brief.websiteAnalysis.url}):
Title: ${brief.websiteAnalysis.title}
Personality: ${brief.websiteAnalysis.personality}
Tone: ${brief.websiteAnalysis.tone}
Colors: ${brief.websiteAnalysis.colors.join(", ")}
Problems: ${brief.websiteAnalysis.problems.join("; ")}
Vision: ${brief.websiteAnalysis.vision}`,
    );
  }

  if (refineNote && existingDirection) {
    parts.push(
      `Regenerate ONLY this direction with refinements.
Name: ${existingDirection.name}
Concept: ${existingDirection.concept}
Colors: ${existingDirection.colors.map((c) => c.hex).join(", ")}
Typography: ${existingDirection.typography.heading} / ${existingDirection.typography.body}
Mood: ${existingDirection.mood.join(", ")}
Refinement: ${refineNote}
Return JSON with exactly 1 direction in the directions array.`,
    );
  }

  return parts.join("\n\n");
}

function normalizeDirections(raw: unknown[]): MoodboardDirection[] {
  return raw.slice(0, 3).map((item) => {
    const d = item as Record<string, unknown>;
    const colors = Array.isArray(d.colors)
      ? d.colors.slice(0, 5).map((c) => {
          const color = c as Record<string, string>;
          return {
            hex: color.hex?.startsWith("#") ? color.hex : `#${color.hex ?? "000000"}`,
            name: color.name ?? "Untitled",
          };
        })
      : [];

    while (colors.length < 5) {
      colors.push({ hex: "#1a1a1a", name: `Neutral ${colors.length + 1}` });
    }

    return {
      id: randomUUID(),
      name: String(d.name ?? "Untitled Direction"),
      concept: String(d.concept ?? ""),
      colors,
      typography: {
        heading: String((d.typography as { heading?: string })?.heading ?? "Syne"),
        body: String((d.typography as { body?: string })?.body ?? "DM Sans"),
      },
      imagery: String(d.imagery ?? ""),
      mood: Array.isArray(d.mood) ? d.mood.map(String).slice(0, 7) : [],
      visual_references: String(d.visual_references ?? ""),
    };
  });
}

function parseDirectionsJson(text: string): MoodboardDirection[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in model response");

  const parsed = JSON.parse(jsonMatch[0]) as { directions?: unknown[] };
  if (!Array.isArray(parsed.directions) || parsed.directions.length === 0) {
    throw new Error("Invalid directions array");
  }

  const directions = normalizeDirections(parsed.directions);

  if (directions.length === 1) {
    return directions;
  }

  if (directions.length !== 3) {
    throw new Error(`Expected 3 directions, got ${directions.length}`);
  }

  return directions;
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
      max_tokens: 4096,
      system: MOODBOARD_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty Anthropic response");
    return block.text;
  }

  const stream = anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system: MOODBOARD_SYSTEM_PROMPT,
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

async function callOpenAI(model: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: MOODBOARD_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? "OpenAI request failed");
  }

  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(model: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${MOODBOARD_SYSTEM_PROMPT}\n\n${userPrompt}` },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function generateMoodboardDirections(input: {
  brief: MoodboardBrief;
  tab: MoodboardTab;
  modelId: MoodboardModelId;
  onDelta?: (chunk: string) => void;
}): Promise<MoodboardDirection[]> {
  const config = getModelConfig(input.modelId);
  const userPrompt = buildUserPrompt(input.brief, input.tab);
  const key = cacheKey(
    "moodboard-gen",
    input.tab,
    input.modelId,
    hashString(userPrompt),
  );
  const cached = cacheGet<MoodboardDirection[]>(key);
  if (cached) return cached;

  let text: string;
  try {
    if (config.provider === "anthropic") {
      text = await callAnthropic(config.model, userPrompt, input.onDelta);
    } else if (config.provider === "openai") {
      text = await callOpenAI(config.model, userPrompt);
    } else {
      text = await callGemini(config.model, userPrompt);
    }
  } catch (primaryErr) {
    if (input.modelId !== "claude-sonnet") {
      text = await callAnthropic("claude-sonnet-4-6", userPrompt, input.onDelta);
    } else {
      throw primaryErr;
    }
  }

  const directions = parseDirectionsJson(text);
  cacheSet(key, directions);
  return directions;
}

export async function refineMoodboardDirection(input: {
  brief: MoodboardBrief;
  tab: MoodboardTab;
  modelId: MoodboardModelId;
  direction: MoodboardDirection;
  refineNote: string;
}): Promise<MoodboardDirection> {
  const config = getModelConfig(input.modelId);
  const userPrompt = buildUserPrompt(
    input.brief,
    input.tab,
    input.refineNote,
    input.direction,
  );

  let text: string;
  if (config.provider === "anthropic") {
    text = await callAnthropic(config.model, userPrompt);
  } else if (config.provider === "openai") {
    text = await callOpenAI(config.model, userPrompt);
  } else {
    text = await callGemini(config.model, userPrompt);
  }

  const directions = parseDirectionsJson(text);
  return { ...directions[0], id: input.direction.id };
}

export async function parseQuestionnaire(text: string): Promise<Record<string, string>> {
  const trimmed = text.trim();
  const key = cacheKey("questionnaire", hashString(trimmed));
  const cached = cacheGet<Record<string, string>>(key);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { questionnaireText: trimmed };
  }

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Extract brand moodboard signals. JSON only:
{"industry":"","audience":"","feeling":"","colorDirection":"","admiredBrands":"","brandName":"","summary":""}

${trimmed.slice(0, 3000)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return { questionnaireText: trimmed };

  const jsonMatch = block.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { questionnaireText: trimmed };

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
  cacheSet(key, parsed);
  return parsed;
}
