import { sql } from "@/lib/db";
import {
  getClientProfile,
  getFrameworksForClient,
  getIntelligenceForClient,
  type ClientProfile,
  type ToolIntelligence,
} from "@/lib/unified-db";
import { getKnowledgeContentByFiles } from "@/lib/knowledge/db";
import { estimateTokens } from "@/lib/context-formatter";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";
import { formatUserConfirmationsForPrompt } from "@/lib/pre-generation-advisor";

export type ContextTool = "moodboard" | "design_audit" | "ea_chat" | "ia" | "wireframe";

export type UnifiedContextParams = {
  tool: ContextTool;
  client_name?: string;
  project_name?: string;
  project_type?: string;
  input_type?: string;
  user_message?: string;
  userConfirmations?: UserPreConfirmation;
  has_competitor_screenshots?: boolean;
  session_answers?: Record<string, unknown>;
};

export type EaMeetingIntelligence = {
  category: string;
  insight: string;
  confidence: number;
  source_type?: string;
  created_at?: string;
};

export type EaMemoryItem = {
  category: string;
  content: string;
  importance?: number;
  source?: string;
};

export type PreviousMoodboardDirection = {
  direction_name: string;
  tagline: string;
  session_id?: string;
  color_palette?: unknown;
  created_at?: string;
};

export type PreviousAuditSummary = {
  overall_score: number;
  critical_issues: string[];
  session_id?: string;
  created_at?: string;
};

export type FrameworkRecord = {
  framework_type: string;
  title: string;
  content: Record<string, unknown>;
  source?: string | null;
};

export type UnifiedContext = {
  ux_rules: string[];
  frameworks: string[];
  ia_knowledge: string[];
  client_profile: ClientProfile | null;
  client_intelligence: ToolIntelligence[];
  ea_meetings: EaMeetingIntelligence[];
  previous_moodboards: PreviousMoodboardDirection[];
  previous_audits: PreviousAuditSummary[];
  visual_frameworks: FrameworkRecord[];
  ux_frameworks: FrameworkRecord[];
  ea_memories: EaMemoryItem[];
  _meta?: {
    token_estimate: number;
    compressed: boolean;
  };
};

const MAX_CONTEXT_TOKENS = 8000;

function uniqueFiles(files: string[]): string[] {
  return [...new Set(files)];
}

export function selectUxRuleFiles(params: UnifiedContextParams): string[] {
  const { tool, project_type, input_type, user_message } = params;
  const msg = (user_message ?? "").toLowerCase();
  const inputType = (input_type ?? "").toLowerCase();
  const projectType = (project_type ?? "").toLowerCase();

  if (tool === "design_audit") {
    const files = ["heuristics.md", "accessibility.md", "web-ux.md", "emerging-trends.md"];
    if (inputType.includes("mobile") || inputType === "app") {
      files.push("mobile-ux.md");
    } else if (inputType.includes("web") || inputType === "website") {
      files.push("web-ux.md");
    } else if (inputType.includes("screenshot") || inputType.includes("figma")) {
      files.push("web-ux.md", "mobile-ux.md");
    }
    return uniqueFiles(files);
  }

  if (tool === "moodboard") {
    const files = ["emerging-trends.md", "voice-ai-ux.md"];
    if (projectType.includes("app") || projectType === "mobile") {
      files.push("mobile-ux.md");
    } else if (projectType.includes("website") || projectType === "web") {
      files.push("web-ux.md");
    }
    if (projectType.includes("conversion") || projectType.includes("campaign")) {
      files.push("conversion-ux.md");
    }
    return uniqueFiles(files);
  }

  if (tool === "ia") {
    return uniqueFiles(["heuristics.md", "web-ux.md", "mobile-ux.md", "accessibility.md"]);
  }

  if (tool === "wireframe") {
    return uniqueFiles(["heuristics.md", "web-ux.md", "mobile-ux.md", "accessibility.md"]);
  }

  // ea_chat — keyword driven
  const files: string[] = [];
  if (/\b(mobile|ios|android|app)\b/i.test(msg)) files.push("mobile-ux.md");
  if (/\b(data|chart|dashboard|viz|visualization)\b/i.test(msg)) {
    files.push("data-viz-ux.md");
  }
  if (/\b(access|wcag|a11y|accessibility)\b/i.test(msg)) {
    files.push("accessibility.md");
  }
  if (
    /\b(ux|ui|usability|heuristic|wireframe|figma|prototype)\b/i.test(msg)
  ) {
    files.push("heuristics.md", "web-ux.md");
  }
  if (files.length === 0 && msg.length > 0) {
    files.push("heuristics.md");
  }
  return uniqueFiles(files);
}

export function selectFrameworkFiles(params: UnifiedContextParams): string[] {
  const { tool, project_type, input_type } = params;
  const projectType = (project_type ?? "").toLowerCase();
  const inputType = (input_type ?? "").toLowerCase();

  if (tool === "moodboard") {
    return uniqueFiles(["jobs-to-be-done.md", "atomic-design.md"]);
  }

  if (tool === "design_audit") {
    const files = ["double-diamond.md", "ux-research-methods.md"];
    if (
      inputType.includes("web") ||
      inputType.includes("mobile") ||
      inputType.includes("app") ||
      projectType.includes("app") ||
      projectType.includes("website")
    ) {
      files.push("service-design.md");
    }
    return uniqueFiles(files);
  }

  if (tool === "ia") {
    return uniqueFiles(["double-diamond.md", "ux-research-methods.md", "service-design.md"]);
  }

  if (tool === "wireframe") {
    return uniqueFiles(["atomic-design.md", "service-design.md"]);
  }

  if (/\b(jtbd|jobs to be done|persona)\b/i.test(params.user_message ?? "")) {
    return ["jobs-to-be-done.md"];
  }
  if (/\b(sprint|workshop)\b/i.test(params.user_message ?? "")) {
    return ["design-sprint.md"];
  }
  return [];
}

export type IaContextOptions = {
  has_competitor_screenshots?: boolean;
  industry?: string;
  is_mobile?: boolean;
  is_complex?: boolean;
};

export function selectIaSkillFiles(
  params: UnifiedContextParams,
  options: IaContextOptions = {},
): string[] {
  const files = [
    "ia-principles.md",
    "navigation-patterns.md",
    "content-strategy.md",
    "ux-controversies.md",
    "ia-patterns-by-industry.md",
  ];

  if (options.has_competitor_screenshots) {
    files.push("competitor-analysis.md");
  }

  const projectType = (params.project_type ?? "").toLowerCase();
  const isMobile =
    options.is_mobile ??
    (projectType.includes("mobile") || projectType.includes("app"));
  const isComplex =
    options.is_complex ??
    /\b(complex|30|50|very complex)\b/i.test(
      JSON.stringify(params.user_message ?? params.project_type ?? ""),
    );

  if (isMobile) {
    // navigation-patterns.md already loaded; mobile sections are within it
  }

  if (isComplex) {
    // progressive disclosure + hub-and-spoke covered in ia-principles.md
  }

  return uniqueFiles(files);
}

async function loadKnowledgeFileContents(fileNames: string[]): Promise<string[]> {
  if (!fileNames.length) return [];
  const rows = await getKnowledgeContentByFiles(fileNames);
  const byName = new Map(rows.map((r) => [r.file_name, r.content]));
  return fileNames
    .map((name) => byName.get(name))
    .filter((c): c is string => Boolean(c?.trim()));
}

async function fetchEaIntelligenceForClient(
  clientName: string,
  limit = 20,
): Promise<EaMeetingIntelligence[]> {
  const pattern = `%${clientName}%`;
  const result = await sql`
    SELECT category, insight, confidence, source_type, created_at
    FROM ea_intelligence
    WHERE client_name ILIKE ${pattern}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => ({
    category: String((row as Record<string, unknown>).category ?? "general"),
    insight: String((row as Record<string, unknown>).insight ?? ""),
    confidence: Number((row as Record<string, unknown>).confidence ?? 0.8),
    source_type: (row as Record<string, unknown>).source_type
      ? String((row as Record<string, unknown>).source_type)
      : undefined,
    created_at: (row as Record<string, unknown>).created_at
      ? String((row as Record<string, unknown>).created_at)
      : undefined,
  }));
}

async function fetchEaMemoriesForClient(
  clientName: string,
  limit = 15,
): Promise<EaMemoryItem[]> {
  const pattern = `%${clientName}%`;
  const result = await sql`
    SELECT category, content, importance, source
    FROM ea_memories
    WHERE client_name ILIKE ${pattern}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => ({
    category: String((row as Record<string, unknown>).category ?? "context"),
    content: String((row as Record<string, unknown>).content ?? ""),
    importance: Number((row as Record<string, unknown>).importance ?? 5),
    source: (row as Record<string, unknown>).source
      ? String((row as Record<string, unknown>).source)
      : undefined,
  }));
}

async function fetchPreviousMoodboards(
  clientName: string,
  limit = 3,
): Promise<PreviousMoodboardDirection[]> {
  const pattern = `%${clientName}%`;
  const result = await sql`
    SELECT d.direction_name, d.tagline, d.color_palette, d.session_id, d.created_at
    FROM moodboard_directions d
    JOIN moodboard_sessions s ON s.session_id = d.session_id
    WHERE s.client_name ILIKE ${pattern}
       OR s.brand_name ILIKE ${pattern}
    ORDER BY d.created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => ({
    direction_name: String((row as Record<string, unknown>).direction_name ?? "Untitled"),
    tagline: String((row as Record<string, unknown>).tagline ?? ""),
    color_palette: (row as Record<string, unknown>).color_palette,
    session_id: (row as Record<string, unknown>).session_id
      ? String((row as Record<string, unknown>).session_id)
      : undefined,
    created_at: (row as Record<string, unknown>).created_at
      ? String((row as Record<string, unknown>).created_at)
      : undefined,
  }));
}

async function fetchPreviousAudits(
  clientName: string,
  limit = 3,
): Promise<PreviousAuditSummary[]> {
  const pattern = `%${clientName}%`;
  const result = await sql`
    SELECT r.overall_score, r.critical_issues, r.session_id, r.created_at
    FROM design_audit_reports r
    JOIN design_audit_sessions s ON s.session_id = r.session_id
    WHERE s.client_name ILIKE ${pattern}
    ORDER BY r.created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => {
    const critical = (row as Record<string, unknown>).critical_issues;
    let issues: string[] = [];
    if (Array.isArray(critical)) issues = critical.map(String);
    else if (typeof critical === "string") {
      try {
        issues = JSON.parse(critical);
      } catch {
        issues = [];
      }
    }
    return {
      overall_score: Number((row as Record<string, unknown>).overall_score ?? 0),
      critical_issues: issues,
      session_id: (row as Record<string, unknown>).session_id
        ? String((row as Record<string, unknown>).session_id)
        : undefined,
      created_at: (row as Record<string, unknown>).created_at
        ? String((row as Record<string, unknown>).created_at)
        : undefined,
    };
  });
}

function compressContext(
  context: UnifiedContext,
  formattedPreview: string,
): UnifiedContext {
  if (estimateTokens(formattedPreview) <= MAX_CONTEXT_TOKENS) {
    return { ...context, _meta: { token_estimate: estimateTokens(formattedPreview), compressed: false } };
  }

  const compressed: UnifiedContext = {
    ...context,
    client_profile: context.client_profile,
    ea_meetings: context.ea_meetings.slice(0, 3),
    client_intelligence: context.client_intelligence
      .filter((i) => i.importance >= 6)
      .slice(0, 10),
    ea_memories: context.ea_memories.slice(0, 8),
    previous_moodboards: context.previous_moodboards.slice(0, 3),
    previous_audits: context.previous_audits.slice(0, 3),
    visual_frameworks: context.visual_frameworks.slice(0, 3),
    ux_frameworks: context.ux_frameworks.slice(0, 3),
    ux_rules: context.ux_rules.map((r) => r.slice(0, 500)),
    ia_knowledge: context.ia_knowledge.map((r) => r.slice(0, 500)),
    frameworks: context.frameworks.map((f) => f.slice(0, 300)),
  };

  return compressed;
}

export async function loadUnifiedContext(
  params: UnifiedContextParams,
  iaOptions: IaContextOptions = {},
): Promise<UnifiedContext> {
  const uxFileNames = selectUxRuleFiles(params);
  const frameworkFileNames = selectFrameworkFiles(params);
  const iaFileNames =
    params.tool === "ia" ? selectIaSkillFiles(params, iaOptions) : [];

  const [ux_rules, frameworks, ia_knowledge] = await Promise.all([
    loadKnowledgeFileContents(uxFileNames),
    loadKnowledgeFileContents(frameworkFileNames),
    loadKnowledgeFileContents(iaFileNames),
  ]);

  const empty: UnifiedContext = {
    ux_rules,
    frameworks,
    ia_knowledge,
    client_profile: null,
    client_intelligence: [],
    ea_meetings: [],
    previous_moodboards: [],
    previous_audits: [],
    visual_frameworks: [],
    ux_frameworks: [],
    ea_memories: [],
  };

  if (!params.client_name?.trim()) {
    return { ...empty, _meta: { token_estimate: 0, compressed: false } };
  }

  const clientName = params.client_name.trim();

  const [
    client_profile,
    client_intelligence,
    ea_meetings,
    ea_memories,
    previous_moodboards,
    previous_audits,
    savedFrameworks,
  ] = await Promise.all([
    getClientProfile(clientName),
    getIntelligenceForClient(clientName, 30),
    fetchEaIntelligenceForClient(clientName, 15),
    fetchEaMemoriesForClient(clientName, 15),
    fetchPreviousMoodboards(clientName, 3),
    fetchPreviousAudits(clientName, 3),
    getFrameworksForClient(clientName),
  ]);

  const full: UnifiedContext = {
    ux_rules,
    frameworks,
    ia_knowledge,
    client_profile,
    client_intelligence,
    ea_meetings,
    ea_memories,
    previous_moodboards,
    previous_audits,
    visual_frameworks: savedFrameworks.visual.map((v) => ({
      framework_type: v.framework_type,
      title: v.title,
      content: v.content,
      source: v.source,
    })),
    ux_frameworks: savedFrameworks.ux.map((u) => ({
      framework_type: u.framework_type,
      title: u.title,
      content: u.content,
      source: u.source,
    })),
  };

  return full;
}

/** Compress after formatting — call from integration layer. */
export function compressUnifiedContextForTokens(
  context: UnifiedContext,
  formatted: string,
): UnifiedContext {
  const compressed = compressContext(context, formatted);
  compressed._meta = {
    token_estimate: estimateTokens(formatted),
    compressed: estimateTokens(formatted) > MAX_CONTEXT_TOKENS,
  };
  return compressed;
}

const CLIENT_PATTERNS = [
  /\b(?:for|with|about|client)\s+([A-Z][A-Za-z0-9&.\- ]{2,40})\b/,
  /\b([A-Z][A-Za-z0-9&.\- ]{2,30})\s+(?:project|brand|website|app)\b/,
];

export function extractClientFromMessage(message: string): string | undefined {
  for (const pattern of CLIENT_PATTERNS) {
    const match = message.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length > 2) return candidate;
  }
  return undefined;
}

export async function loadAndFormatContext(
  params: UnifiedContextParams,
): Promise<{ context: UnifiedContext; block: string; tokenEstimate: number }> {
  const { formatContextForAI } = await import("@/lib/context-formatter");

  const answers = params.session_answers ?? {};
  const q8 = String(answers.q8 ?? "");
  const q2 = String(answers.q2 ?? "");
  const q7a = answers.q7a;
  const hasScreenshotUpload =
    q7a &&
    typeof q7a === "object" &&
    "files" in q7a &&
    Array.isArray((q7a as { files: unknown[] }).files) &&
    (q7a as { files: unknown[] }).files.length > 0;

  const iaOptions: IaContextOptions =
    params.tool === "ia"
      ? {
          has_competitor_screenshots:
            params.has_competitor_screenshots ?? Boolean(hasScreenshotUpload),
          is_mobile: /mobile/i.test(q2),
          is_complex: /complex|30|50/i.test(q8),
        }
      : {};

  let context = await loadUnifiedContext(params, iaOptions);
  let block = formatContextForAI(context);

  if (params.userConfirmations) {
    block = `${formatUserConfirmationsForPrompt(params.userConfirmations)}\n\n${block}`;
  }

  if (estimateTokens(block) > MAX_CONTEXT_TOKENS) {
    context = compressUnifiedContextForTokens(context, block);
    block = formatContextForAI(context);
    if (params.userConfirmations) {
      block = `${formatUserConfirmationsForPrompt(params.userConfirmations)}\n\n${block}`;
    }
  }

  return {
    context,
    block,
    tokenEstimate: estimateTokens(block),
  };
}
