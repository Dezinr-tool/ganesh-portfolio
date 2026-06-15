import Anthropic from "@anthropic-ai/sdk";
import { cacheGet, cacheKey, cacheSet, hashString } from "../ai-cache";
import { loadAndFormatContext } from "../context-loader";
import { getAuditModel } from "./models";
import { DESIGN_AUDIT_SYSTEM_PROMPT } from "./system-prompt";
import type {
  AuditContext,
  AuditDimensionKey,
  AuditImage,
  AuditModelId,
  DesignAuditResult,
  DimensionStatus,
  EffortEstimate,
} from "./types";

type AuditInputMeta = Record<string, unknown>;

function compactMetadata(metadata: AuditInputMeta): string {
  const slim: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    slim[k] = v;
  }
  return JSON.stringify(slim);
}

function buildUserPrompt(
  context: AuditContext,
  inputMode: string,
  metadata: AuditInputMeta,
): string {
  return [
    `Mode: ${inputMode}`,
    `Product: ${context.productDescription}`,
    `User: ${context.targetUser}`,
    `Goal: ${context.primaryGoal}`,
    context.specificConcerns ? `Concerns: ${context.specificConcerns}` : null,
    context.eaPrefillSummary ? `EA: ${context.eaPrefillSummary.slice(0, 800)}` : null,
    metadata && Object.keys(metadata).length
      ? `Meta: ${compactMetadata(metadata)}`
      : null,
    "Audit all 10 dimensions. Cite specific visible elements.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAuditCacheKey(input: {
  modelId: string;
  context: AuditContext;
  inputMode: string;
  metadata: AuditInputMeta;
  images: AuditImage[];
}): string {
  const imageSig = input.images
    .map((img) => `${img.mediaType}:${img.base64.slice(0, 120)}:${img.base64.length}`)
    .join("|");
  return cacheKey(
    "audit",
    input.modelId,
    input.inputMode,
    input.context.productDescription,
    input.context.targetUser,
    input.context.primaryGoal,
    input.context.specificConcerns ?? "",
    compactMetadata(input.metadata),
    hashString(imageSig),
  );
}

function normalizeEffort(value?: string): EffortEstimate {
  if (value === "quick" || value === "medium" || value === "significant") {
    return value;
  }
  return "medium";
}

function normalizeStatus(score: number, status?: string): DimensionStatus {
  if (status === "good" || status === "needs_work" || status === "critical") {
    return status;
  }
  if (score >= 8) return "good";
  if (score >= 5) return "needs_work";
  return "critical";
}

function parseAuditResult(raw: string): DesignAuditResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in audit response");

  const parsed = JSON.parse(jsonMatch[0]) as Partial<DesignAuditResult>;
  const dimensions = parsed.dimensions ?? ({} as DesignAuditResult["dimensions"]);

  const keys: AuditDimensionKey[] = [
    "visual_hierarchy",
    "typography",
    "color_system",
    "spacing_layout",
    "information_architecture",
    "ux_patterns",
    "accessibility",
    "industry_standards",
    "consistency",
    "mobile_responsiveness",
  ];

  for (const key of keys) {
    const dim = dimensions[key] ?? {
      score: 5,
      status: "needs_work",
      working: [],
      issues: ["Insufficient data for full analysis"],
      fixes: ["Provide higher-resolution screenshot or Figma frame"],
    };
    dimensions[key] = {
      score: Math.min(10, Math.max(1, Number(dim.score) || 5)),
      status: normalizeStatus(Number(dim.score) || 5, dim.status),
      working: Array.isArray(dim.working) ? dim.working.map(String) : [],
      issues: Array.isArray(dim.issues) ? dim.issues.map(String) : [],
      fixes: Array.isArray(dim.fixes) ? dim.fixes.map(String) : [],
      effort_estimate: normalizeEffort(
        (dim as { effort_estimate?: string }).effort_estimate,
      ),
    };
  }

  return {
    overall_score: Math.min(
      10,
      Math.max(1, Number(parsed.overall_score) || 5),
    ),
    summary: String(parsed.summary ?? "Audit complete."),
    priority_issues: {
      critical: parsed.priority_issues?.critical?.map(String) ?? [],
      important: parsed.priority_issues?.important?.map(String) ?? [],
      nice_to_have: parsed.priority_issues?.nice_to_have?.map(String) ?? [],
    },
    annotated_issues: parsed.annotated_issues?.map(String) ?? [],
    dimensions,
  };
}

async function callAnthropicVision(
  model: string,
  system: string,
  userPrompt: string,
  images: AuditImage[],
  onDelta?: (chunk: string) => void,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [
    ...images.map(
      (img) =>
        ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: img.mediaType,
            data: img.base64,
          },
        }) satisfies Anthropic.ImageBlockParam,
    ),
    { type: "text", text: userPrompt },
  ];

  if (!onDelta) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Empty response");
    return block.text;
  }

  const stream = anthropic.messages.stream({
    model,
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content }],
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

async function callOpenAIVision(
  model: string,
  system: string,
  userPrompt: string,
  images: AuditImage[],
): Promise<string> {
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
        { role: "system", content: system },
        {
          role: "user",
          content: [
            ...images.map((img) => ({
              type: "image_url",
              image_url: {
                url: `data:${img.mediaType};base64,${img.base64}`,
              },
            })),
            { type: "text", text: userPrompt },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI failed");
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGeminiVision(
  model: string,
  system: string,
  userPrompt: string,
  images: AuditImage[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const parts = [
    { text: `${system}\n\n${userPrompt}` },
    ...images.map((img) => ({
      inline_data: {
        mime_type: img.mediaType,
        data: img.base64,
      },
    })),
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(data.error?.message ?? "Gemini failed");
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function runDesignAudit(input: {
  modelId: AuditModelId;
  context: AuditContext;
  inputMode: string;
  metadata: AuditInputMeta;
  images: AuditImage[];
  onDelta?: (chunk: string) => void;
  skipCache?: boolean;
  clientName?: string;
  projectName?: string;
  userConfirmations?: import("@/lib/pre-generation-types").UserPreConfirmation;
}): Promise<DesignAuditResult> {
  if (input.images.length === 0) {
    throw new Error(
      "At least one image is required for visual audit. Upload a screenshot or connect Figma.",
    );
  }

  const cacheKeyStr = buildAuditCacheKey(input);
  if (!input.skipCache) {
    const cached = cacheGet<DesignAuditResult>(cacheKeyStr);
    if (cached) return cached;
  }

  const config = getAuditModel(input.modelId);
  const userPrompt = buildUserPrompt(
    input.context,
    input.inputMode,
    input.metadata,
  );

  const knowledgeContext = await loadAndFormatContext({
    tool: "design_audit",
    client_name: input.clientName ?? input.context.eaClientName,
    project_name: input.projectName,
    input_type: input.inputMode,
    userConfirmations: input.userConfirmations,
  });
  const systemPrompt = knowledgeContext.block
    ? `${knowledgeContext.block}\n\n${DESIGN_AUDIT_SYSTEM_PROMPT}`
    : DESIGN_AUDIT_SYSTEM_PROMPT;

  let text: string;
  try {
    if (config.provider === "anthropic") {
      text = await callAnthropicVision(
        config.model,
        systemPrompt,
        userPrompt,
        input.images,
        input.onDelta,
      );
    } else if (config.provider === "openai") {
      text = await callOpenAIVision(
        config.model,
        systemPrompt,
        userPrompt,
        input.images,
      );
    } else {
      text = await callGeminiVision(
        config.model,
        systemPrompt,
        userPrompt,
        input.images,
      );
    }
  } catch (primaryErr) {
    if (input.modelId !== "claude-sonnet") {
      text = await callAnthropicVision(
        "claude-sonnet-4-6",
        systemPrompt,
        userPrompt,
        input.images,
        input.onDelta,
      );
    } else {
      throw primaryErr;
    }
  }

  const result = parseAuditResult(text);
  cacheSet(cacheKeyStr, result);
  return result;
}
