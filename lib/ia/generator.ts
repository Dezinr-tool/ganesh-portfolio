import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { loadAndFormatContext, type IaContextOptions } from "@/lib/context-loader";
import { buildBriefFromAnswers, extractClientName, extractProductType } from "./question-flow";
import type { IaOutput, IaModelId } from "./types";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";

const MODEL_MAP: Record<IaModelId, string> = {
  "claude-sonnet": "claude-sonnet-4-6",
  "claude-haiku": "claude-haiku-4-5-20251001",
  "gpt-4o": "claude-sonnet-4-6",
};

function buildSystemPrompt(): string {
  return `You are a senior UX architect specializing in information architecture.
Generate a complete IA document as JSON matching this schema:

{
  "product_overview": {
    "product_name": string,
    "product_type": string,
    "primary_goal": string,
    "user_types": [{ "name": string, "needs": string[] }],
    "key_tasks": string[] (top 5)
  },
  "navigation_structure": {
    "primary": [{ "label": string, "purpose": string, "access_level": string, "type": "primary" }],
    "secondary": [{ "label", "purpose", "access_level", "type": "secondary" }],
    "utility": [{ "label", "purpose", "access_level", "type": "utility" }]
  },
  "sitemap": [{
    "id": string (uuid),
    "screen_name": string,
    "parent_id": string | null,
    "level": number,
    "priority": "P1"|"P2"|"P3",
    "user_access": string[],
    "primary_content": string[],
    "key_actions": string[],
    "notes": string,
    "children": [] (nested tree)
  }],
  "user_flows": [{
    "id": string,
    "flow_name": string,
    "flow_goal": string,
    "steps": [{ "step": number, "label": string, "screen": string, "type": "action"|"decision"|"error"|"success" }],
    "decision_points": string[]
  }] (exactly top 3 most important flows),
  "content_hierarchy": [{
    "screen_name": string,
    "primary": string[],
    "secondary": string[],
    "tertiary": string[],
    "key_actions": string[]
  }] (top 5 P1 screens),
  "navigation_patterns": {
    "pattern": string (e.g. bottom tab, sidebar, top nav),
    "rationale": string
  },
  "health_score": {
    "depth_score": number (1-10),
    "breadth_score": number (1-10),
    "balance_assessment": string,
    "recommendations": string[]
  },
  "ux_controversy_recommendations": [{
    "id": string (uuid),
    "title": string (e.g. "Navigation Pattern"),
    "debate": string (the controversy question),
    "research": string (evidence-based findings),
    "recommendation": string (clear choice for THIS product),
    "rationale": string (why for this specific product)
  }] (3-5 most relevant controversies for this product type)
}

Rules:
- Sitemap must reflect product complexity from intake answers
- Assign realistic screen counts based on complexity tier
- User flows must reference actual screens from sitemap
- Navigation pattern must match product type (mobile vs web)
- Include ux_controversy_recommendations with 3-5 product-specific UX debate resolutions
- Reference accepted UX principles from IA knowledge base when citing research
- Return ONLY valid JSON, no markdown`;
}

function detectIndustryPattern(answers: Record<string, unknown>): string {
  const blob = [
    answers.q1,
    answers.q2,
    answers.q6,
  ]
    .map((v) => String(v ?? ""))
    .join(" ")
    .toLowerCase();

  if (/\b(fintech|bank|finance|payment|wallet)\b/.test(blob)) return "Fintech / Banking";
  if (/\b(e-?commerce|shop|store|retail|d2c)\b/.test(blob)) return "E-commerce / D2C";
  if (/\b(saas|b2b|software|platform)\b/.test(blob)) return "SaaS / B2B Software";
  if (/\b(health|wellness|medical|patient)\b/.test(blob)) return "Healthcare / Wellness";
  if (/\b(edtech|learn|course|education|training)\b/.test(blob)) return "EdTech / Learning";
  if (/\b(social|community|forum|network)\b/.test(blob)) return "Social / Community";
  if (/\b(marketplace|two-sided|seller|buyer)\b/.test(blob)) return "Marketplace";
  if (/\b(enterprise|admin|dashboard|internal)\b/.test(blob)) return "Enterprise / Admin Dashboard";
  if (/mobile app/i.test(String(answers.q2 ?? ""))) return "Mobile App (Consumer)";
  if (/web app/i.test(String(answers.q2 ?? ""))) return "SaaS / B2B Software";
  return "General Web Product";
}

function buildIaContextOptions(answers: Record<string, unknown>): IaContextOptions {
  const q7a = answers.q7a;
  const hasScreenshotUpload =
    q7a &&
    typeof q7a === "object" &&
    "files" in q7a &&
    Array.isArray((q7a as { files: unknown[] }).files) &&
    (q7a as { files: unknown[] }).files.length > 0;

  return {
    has_competitor_screenshots: Boolean(hasScreenshotUpload),
    is_mobile: /mobile/i.test(String(answers.q2 ?? "")),
    is_complex: /complex|30|50/i.test(String(answers.q8 ?? "")),
  };
}

function assignIds(output: IaOutput): IaOutput {
  const assignNodeIds = (nodes: IaOutput["sitemap"]): IaOutput["sitemap"] =>
    nodes.map((n) => ({
      ...n,
      id: n.id || randomUUID(),
      children: n.children ? assignNodeIds(n.children) : [],
    }));

  return {
    ...output,
    sitemap: assignNodeIds(output.sitemap),
    user_flows: output.user_flows.map((f) => ({
      ...f,
      id: f.id || randomUUID(),
    })),
    ux_controversy_recommendations: (output.ux_controversy_recommendations ?? []).map(
      (c) => ({
        ...c,
        id: c.id || randomUUID(),
      }),
    ),
  };
}

function parseJson(text: string): IaOutput {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  return assignIds(JSON.parse(json) as IaOutput);
}

export async function generateIaDocument(input: {
  answers: Record<string, unknown>;
  modelId?: IaModelId;
  extras?: string;
  userConfirmations?: UserPreConfirmation;
  onStatus?: (msg: string) => void;
}): Promise<IaOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const clientName = extractClientName(input.answers);
  const productType = extractProductType(input.answers);

  input.onStatus?.("Loading intelligence context…");
  const industryPattern = detectIndustryPattern(input.answers);
  const { block: knowledgeContext } = await loadAndFormatContext({
    tool: "ia",
    client_name: clientName,
    project_type: productType,
    userConfirmations: input.userConfirmations,
    session_answers: input.answers,
    has_competitor_screenshots: buildIaContextOptions(input.answers)
      .has_competitor_screenshots,
  });

  const brief = buildBriefFromAnswers(input.answers);
  const competitorNotes = input.answers.q7b
    ? `\nDifferentiate from competitors: ${String(input.answers.q7b)}`
    : "";
  const industryNote = `\nIndustry pattern to apply: ${industryPattern}`;
  const model = MODEL_MAP[input.modelId ?? "claude-sonnet"];

  input.onStatus?.("Generating information architecture…");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16000,
    system: `${buildSystemPrompt()}\n\n${knowledgeContext}`,
    messages: [
      {
        role: "user",
        content: `Generate the complete IA document for this product:\n\n${brief}${industryNote}${competitorNotes}${input.extras ? `\n\nAdditional context:\n${input.extras}` : ""}`,
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  if (!text) throw new Error("Empty IA generation response");

  return parseJson(text);
}

export function getIndustryPatternForAnswers(
  answers: Record<string, unknown>,
): string {
  return detectIndustryPattern(answers);
}

export async function extractIaFromUpload(input: {
  text: string;
  fileName: string;
  modelId?: IaModelId;
}): Promise<{ answers: Record<string, unknown>; output: IaOutput }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL_MAP[input.modelId ?? "claude-sonnet"],
    max_tokens: 16000,
    system: `${buildSystemPrompt()}\n\nAlso return "extracted_product_name" in the JSON root for q1 answer.`,
    messages: [
      {
        role: "user",
        content: `Extract IA from this uploaded document (${input.fileName}):\n\n${input.text.slice(0, 50000)}`,
      },
    ],
  });

  const raw =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  const parsed = parseJson(raw);
  const productName = parsed.product_overview.product_name;

  return {
    answers: {
      q1: productName,
      q2: parsed.product_overview.product_type,
      q4: parsed.product_overview.user_types.map((u) => u.name).join(", "),
      q6: parsed.product_overview.key_tasks.slice(0, 3).join("; "),
      q12: parsed.product_overview.primary_goal,
      __upload_source: input.fileName,
    },
    output: parsed,
  };
}
