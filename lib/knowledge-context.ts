import {
  getKnowledgeContentByFiles,
  getKnowledgeByFileName,
} from "@/lib/knowledge/db";

const DESIGN_AUDIT_FILES = [
  "heuristics.md",
  "accessibility.md",
  "web-ux.md",
  "mobile-ux.md",
  "conversion-ux.md",
];

const MOODBOARD_FILES = [
  "emerging-trends.md",
  "double-diamond.md",
  "atomic-design.md",
  "lean-ux.md",
];

const EA_UX_KEYWORDS =
  /\b(ux|ui|usability|heuristic|accessibility|wcag|a11y|wireframe|persona|journey|conversion|onboarding|design system|figma|prototype|research|usability test|double diamond|design sprint|jtbd|jobs to be done)\b/i;

const EA_UX_FILES = [
  "heuristics.md",
  "ux-research-methods.md",
  "web-ux.md",
  "accessibility.md",
];

function combineMarkdown(
  entries: Awaited<ReturnType<typeof getKnowledgeContentByFiles>>,
): string {
  if (!entries.length) return "";
  return entries
    .map(
      (entry) =>
        `# ${entry.title}\n\n<!-- source: ${entry.file_name} v${entry.version} -->\n\n${entry.content}`,
    )
    .join("\n\n---\n\n");
}

async function loadFromDbOrFallback(fileNames: string[]): Promise<string> {
  const rows = await getKnowledgeContentByFiles(fileNames);
  if (rows.length) return combineMarkdown(rows);

  const chunks: string[] = [];
  for (const fileName of fileNames) {
    const row = await getKnowledgeByFileName(fileName);
    if (row?.content) {
      chunks.push(`# ${row.title}\n\n${row.content}`);
    }
  }
  return chunks.join("\n\n---\n\n");
}

export async function getRelevantKnowledge(
  tool: string,
  context?: string,
): Promise<string> {
  const ctx = context?.toLowerCase() ?? "";
  const isMobile =
    ctx.includes("mobile") ||
    ctx.includes("ios") ||
    ctx.includes("android") ||
    ctx.includes("app");

  switch (tool) {
    case "design_audit": {
      const files = isMobile
        ? ["heuristics.md", "accessibility.md", "mobile-ux.md", "conversion-ux.md"]
        : DESIGN_AUDIT_FILES;
      const knowledge = await loadFromDbOrFallback(files);
      if (!knowledge) return "";
      return `## UX & Design Knowledge Base (Design Audit Reference)\n\nApply these industry standards when scoring and recommending fixes:\n\n${knowledge}`;
    }

    case "moodboard": {
      const knowledge = await loadFromDbOrFallback(MOODBOARD_FILES);
      if (!knowledge) return "";
      return `## Design Framework Reference (Moodboard)\n\nUse these frameworks to inform direction rationale and strategic choices:\n\n${knowledge}`;
    }

    case "ea_chat": {
      if (!context || !EA_UX_KEYWORDS.test(context)) return "";
      const knowledge = await loadFromDbOrFallback(EA_UX_FILES);
      if (!knowledge) return "";
      return `## UX Knowledge Reference\n\nGround UX-related answers in these standards:\n\n${knowledge.slice(0, 6000)}`;
    }

    case "ux_framework":
      return loadFromDbOrFallback([
        "ux-research-methods.md",
        "lean-ux.md",
        "double-diamond.md",
        "service-design.md",
      ]).then((k) =>
        k ? `## UX Framework Knowledge\n\n${k}` : "",
      );

    case "visual_framework":
      return loadFromDbOrFallback([
        "atomic-design.md",
        "emerging-trends.md",
        "data-viz-ux.md",
      ]).then((k) =>
        k ? `## Visual Framework Knowledge\n\n${k}` : "",
      );

    default:
      return "";
  }
}

export function isUxRelatedQuery(message: string): boolean {
  return EA_UX_KEYWORDS.test(message);
}
