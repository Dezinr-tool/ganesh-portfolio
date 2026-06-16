import Anthropic from "@anthropic-ai/sdk";
import type { IaCompetitorAnalysis, IaModelId } from "./types";

const MODEL_MAP: Record<IaModelId, string> = {
  "claude-sonnet": "claude-sonnet-4-6",
  "claude-haiku": "claude-haiku-4-5-20251001",
  "gpt-4o": "claude-sonnet-4-6",
};

async function fileToBase64Image(file: File): Promise<{
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
  filename: string;
}> {
  const buffer = await file.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const mediaType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "gif"
        ? "image/gif"
        : ext === "webp"
          ? "image/webp"
          : "image/png";
  return { mediaType, data, filename: file.name };
}

function parseAnalysisJson(text: string): IaCompetitorAnalysis {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(json) as IaCompetitorAnalysis;
  return {
    ...parsed,
    analyzed_at: new Date().toISOString(),
  };
}

export async function analyzeCompetitorScreenshots(input: {
  files: File[];
  productContext?: string;
  differentiateFrom?: string;
  modelId?: IaModelId;
}): Promise<IaCompetitorAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const imageFiles = input.files
    .filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp)$/i.test(f.name))
    .slice(0, 10);

  if (!imageFiles.length) {
    return {
      summary: "No valid image screenshots provided.",
      screenshots: [],
      analyzed_at: new Date().toISOString(),
    };
  }

  const images = await Promise.all(imageFiles.map(fileToBase64Image));

  const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  for (const img of images) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.data,
      },
    });
  }

  contentBlocks.push({
    type: "text",
    text: `Analyze these ${images.length} competitor product screenshot(s) for information architecture.

${input.productContext ? `Product context: ${input.productContext}` : ""}
${input.differentiateFrom ? `Client wants to differentiate from: ${input.differentiateFrom}` : ""}

For EACH screenshot, analyze:
- Primary navigation structure (exact labels)
- Number of top-level nav items
- Navigation pattern used (bottom tabs, sidebar, hamburger, top nav, mega menu, etc.)
- Apparent content hierarchy
- What they do well
- What could be improved

Return JSON only:
{
  "summary": "2-3 sentence overall summary across all screenshots",
  "screenshots": [{
    "filename": "name from upload",
    "primary_nav": ["label1", "label2"],
    "top_level_count": number,
    "nav_pattern": "pattern name",
    "content_hierarchy": "brief description",
    "strengths": ["..."],
    "improvements": ["..."]
  }],
  "differentiation_notes": "how to differentiate based on these competitors"
}`,
  });

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL_MAP[input.modelId ?? "claude-sonnet"],
    max_tokens: 8000,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const text =
    response.content.find((b) => b.type === "text")?.type === "text"
      ? (response.content.find((b) => b.type === "text") as Anthropic.TextBlock).text
      : "";

  if (!text) throw new Error("Empty competitor analysis response");

  const analysis = parseAnalysisJson(text);

  // Ensure filenames match uploads
  analysis.screenshots = analysis.screenshots.map((s, i) => ({
    ...s,
    filename: s.filename || images[i]?.filename || `screenshot-${i + 1}`,
  }));

  return analysis;
}

export function formatCompetitorAnalysisMessage(
  analysis: IaCompetitorAnalysis,
  count: number,
): string {
  const highlights = analysis.screenshots
    .slice(0, 3)
    .map(
      (s) =>
        `${s.filename}: ${s.nav_pattern} with ${s.top_level_count} top-level items (${s.primary_nav.slice(0, 4).join(", ")})`,
    )
    .join("; ");

  return `I analyzed ${count} competitor screenshot${count === 1 ? "" : "s"}. Here's what I found: ${analysis.summary}${highlights ? ` Key patterns: ${highlights}.` : ""} I'll use these insights to differentiate your IA.`;
}
