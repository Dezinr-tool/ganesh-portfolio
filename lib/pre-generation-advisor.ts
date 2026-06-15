import type { UnifiedContext } from "@/lib/context-loader";
import { loadUnifiedContext } from "@/lib/context-loader";
import { extractBrandName, normalizeAnswer } from "@/lib/moodboard/question-flow";
import { extractClientName as extractIaClient } from "@/lib/ia/question-flow";
import type {
  ConfirmationQuestion,
  Observation,
  PreConfirmation,
  ProposedItem,
} from "@/lib/pre-generation-types";

export type PreGenerationParams = {
  tool: "moodboard" | "design_audit" | "ia" | "wireframe";
  context?: UnifiedContext;
  sessionAnswers: Record<string, unknown>;
  projectType?: string;
  inputType?: string;
  clientName?: string;
};

function textBlob(answers: Record<string, unknown>): string {
  return Object.values(answers)
    .map((v) => normalizeAnswer(v))
    .join(" ")
    .toLowerCase();
}

function isRedesign(answers: Record<string, unknown>): boolean {
  const q4 = normalizeAnswer(answers.q4).toLowerCase();
  return q4.includes("redesign") || q4.includes("refresh");
}

function isMobileProject(projectType?: string, answers?: Record<string, unknown>): boolean {
  const pt = (projectType ?? normalizeAnswer(answers?.q3) ?? "").toLowerCase();
  return pt.includes("app") || pt.includes("mobile") || pt.includes("ios") || pt.includes("android");
}

function isEcommerce(blob: string, answers: Record<string, unknown>): boolean {
  const industry = normalizeAnswer(answers.q5).toLowerCase();
  return (
    blob.includes("ecommerce") ||
    blob.includes("e-commerce") ||
    blob.includes("d2c") ||
    blob.includes("checkout") ||
    industry.includes("retail") ||
    industry.includes("commerce")
  );
}

function mentionsAccessibility(blob: string, answers: Record<string, unknown>): boolean {
  const concerns = normalizeAnswer(answers.specificConcerns ?? answers.q18).toLowerCase();
  return (
    blob.includes("accessibility") ||
    blob.includes("wcag") ||
    blob.includes("a11y") ||
    concerns.includes("accessibility") ||
    concerns.includes("contrast")
  );
}

function mentionsMultiplePersonas(answers: Record<string, unknown>): boolean {
  const personas = normalizeAnswer(answers.q7);
  return personas.includes(",") || personas.split(/\band\b/i).length > 2;
}

function relevanceScore(text: string, blob: string, projectType: string): number {
  const lower = text.toLowerCase();
  let score = 0.3;
  const keywords = lower.split(/\W+/).filter((w) => w.length > 4);
  let hits = 0;
  for (const kw of keywords.slice(0, 12)) {
    if (blob.includes(kw)) hits++;
  }
  score += Math.min(0.4, hits * 0.08);
  if (projectType && lower.includes(projectType.toLowerCase().slice(0, 6))) score += 0.15;
  if (lower.includes("premium") || lower.includes("mobile") || lower.includes("user")) score += 0.1;
  return Math.min(1, score);
}

function buildFrameworkProposals(
  params: PreGenerationParams,
  blob: string,
): ProposedItem[] {
  const items: ProposedItem[] = [];
  const { tool, sessionAnswers, projectType } = params;
  const pt = (projectType ?? normalizeAnswer(sessionAnswers.q3) ?? "").toLowerCase();
  const redesign = isRedesign(sessionAnswers);

  if (tool === "moodboard") {
    if (!redesign && (pt.includes("app") || pt.includes("website") || pt.includes("brand"))) {
      items.push({
        key: "jobs-to-be-done",
        name: "Jobs-to-Be-Done",
        reason:
          "I'll use JTBD to understand what users hire this product to do before suggesting directions.",
        confidence: "high",
        apply_by_default: true,
      });
    }
    if (redesign) {
      items.push({
        key: "double-diamond",
        name: "Double Diamond Framework",
        reason:
          "Since this is a redesign, I'll separate problem understanding from solution exploration.",
        confidence: "high",
        apply_by_default: true,
      });
    } else {
      items.push({
        key: "atomic-design",
        name: "Atomic Design",
        reason: "Component-level thinking will keep visual directions scalable for your design system.",
        confidence: "medium",
        apply_by_default: true,
      });
    }
    if (mentionsMultiplePersonas(sessionAnswers)) {
      items.push({
        key: "service-design",
        name: "Service Design",
        reason: "Multiple personas suggest mapping touchpoints across the full service experience.",
        confidence: "medium",
        apply_by_default: false,
      });
    }
  }

  if (tool === "design_audit") {
    items.push({
      key: "double-diamond",
      name: "Double Diamond Framework",
      reason: "I'll frame findings around problem clarity vs. solution quality.",
      confidence: "high",
      apply_by_default: true,
    });
    items.push({
      key: "ux-research-methods",
      name: "UX Research Methods",
      reason: "Audit scoring follows established evaluative research methodology.",
      confidence: "high",
      apply_by_default: true,
    });
    if (pt.includes("app") || pt.includes("website") || blob.includes("service")) {
      items.push({
        key: "service-design",
        name: "Service Design",
        reason: "Cross-touchpoint consistency matters for this product type.",
        confidence: "medium",
        apply_by_default: false,
      });
    }
  }

  if (tool === "ia") {
    items.push({
      key: "card-sorting",
      name: "Card Sorting Methodology",
      reason: "I'll structure navigation labels using card sorting principles for mental model alignment.",
      confidence: "high",
      apply_by_default: true,
    });
    items.push({
      key: "tree-testing",
      name: "Tree Testing Principles",
      reason: "Hierarchy depth and findability will follow tree testing best practices.",
      confidence: "high",
      apply_by_default: true,
    });
    items.push({
      key: "double-diamond",
      name: "Double Diamond Framework",
      reason: "Problem understanding before structural recommendations.",
      confidence: "medium",
      apply_by_default: true,
    });
  }

  if (tool === "wireframe") {
    items.push({
      key: "atomic-design",
      name: "Atomic Design",
      reason: "Wireframes will use consistent component hierarchy from atoms to layouts.",
      confidence: "high",
      apply_by_default: true,
    });
  }

  return items;
}

function buildRuleProposals(params: PreGenerationParams, blob: string): ProposedItem[] {
  const { tool, sessionAnswers, projectType, inputType } = params;
  const items: ProposedItem[] = [];
  const mobile =
    isMobileProject(projectType, sessionAnswers) ||
    inputType === "mobile" ||
    blob.includes("mobile app");

  if (mobile) {
    items.push({
      key: "mobile-ux",
      name: "iOS HIG + Material Design 3",
      reason: "Mobile patterns from Apple and Google will ground touch targets, nav, and typography.",
      confidence: "high",
      apply_by_default: true,
    });
  }

  if (tool === "design_audit") {
    items.push({
      key: "heuristics",
      name: "Nielsen Usability Heuristics",
      reason: "Core heuristic evaluation framework for scoring each dimension.",
      confidence: "high",
      apply_by_default: true,
    });
    items.push({
      key: "accessibility",
      name: "WCAG 2.1 AA Accessibility",
      reason: "Industry-standard accessibility baseline for contrast, focus, and semantics.",
      confidence: "high",
      apply_by_default: true,
    });
    items.push({
      key: "web-ux",
      name: "Web UX Consistency Patterns",
      reason: "Consistency and layout patterns inform hierarchy and component audit.",
      confidence: "medium",
      apply_by_default: true,
    });
  }

  if (tool === "moodboard") {
    items.push({
      key: "emerging-trends",
      name: "Emerging Visual Trends",
      reason: "Current design trends will keep directions contemporary, not dated.",
      confidence: "medium",
      apply_by_default: true,
    });
  }

  if (isEcommerce(blob, sessionAnswers)) {
    items.push({
      key: "conversion-ux",
      name: "Baymard Checkout Research",
      reason: "Baymard findings on friction and trust will inform conversion-focused UI choices.",
      confidence: "high",
      apply_by_default: true,
    });
  }

  if (mentionsAccessibility(blob, sessionAnswers)) {
    items.push({
      key: "accessibility",
      name: "WCAG 2.1 AA Accessibility",
      reason: "You mentioned accessibility — I'll treat WCAG AA as a baseline requirement.",
      confidence: "high",
      apply_by_default: true,
    });
  }

  if (tool === "ia") {
    items.push({
      key: "heuristics",
      name: "Nielsen Heuristics (Findability & Recognition)",
      reason: "IA will prioritize recognition over recall and clear information scent.",
      confidence: "high",
      apply_by_default: true,
    });
    if (mobile) {
      items.push({
        key: "mobile-ux",
        name: "Mobile Navigation Patterns",
        reason: "Mobile IA requires platform-specific navigation conventions.",
        confidence: "high",
        apply_by_default: true,
      });
    }
  }

  if (tool === "wireframe") {
    items.push({
      key: "shadcn",
      name: "Shadcn UI Component System",
      reason: "Wireframes use only Shadcn UI components for production-ready output.",
      confidence: "high",
      apply_by_default: true,
    });
  }

  return items;
}

function buildObservations(
  context: UnifiedContext,
  blob: string,
  projectType: string,
): Observation[] {
  const observations: Observation[] = [];

  for (const m of context.ea_meetings) {
    const score = relevanceScore(m.insight, blob, projectType);
    if (score < 0.7) continue;
    const lower = m.insight.toLowerCase();
    let question = `Should I factor this into the output: "${m.insight.slice(0, 120)}"?`;
    if (lower.includes("40+") || lower.includes("older") || lower.includes("age")) {
      question =
        "Should I apply larger typography and higher contrast accessibility standards for a 40+ audience?";
    } else if (lower.includes("premium")) {
      question =
        "Should I rule out playful or overly colorful directions to preserve a premium feel?";
    }
    observations.push({
      source: "meeting",
      observation: m.insight,
      relevance: `Relevant to this ${projectType || "project"} (${Math.round(score * 100)}% match).`,
      question,
      relevance_score: score,
    });
  }

  for (const mem of context.ea_memories) {
    const score = relevanceScore(mem.content, blob, projectType);
    if (score < 0.7) continue;
    observations.push({
      source: "ea_memory",
      observation: mem.content,
      relevance: "Noted in EA memory for this client.",
      question: `Apply this preference? "${mem.content.slice(0, 100)}"`,
      relevance_score: score,
    });
  }

  for (const audit of context.previous_audits) {
    const top = audit.critical_issues.slice(0, 2).join("; ");
    if (!top) continue;
    observations.push({
      source: "previous_audit",
      observation: `Previous audit score ${audit.overall_score}/10. Issues: ${top}`,
      relevance: "Prior audit findings may still apply.",
      question:
        audit.critical_issues.some((i) => i.toLowerCase().includes("contrast"))
          ? "Your last audit flagged low contrast. Should WCAG AA compliance be a hard requirement this time?"
          : "Should I prioritize fixing issues flagged in your previous audit?",
      relevance_score: 0.85,
    });
  }

  for (const dir of context.previous_moodboards.slice(0, 2)) {
    observations.push({
      source: "previous_moodboard",
      observation: `Direction "${dir.direction_name}": ${dir.tagline}`,
      relevance: "Prior moodboard direction for this client.",
      question: `Should I build on the "${dir.direction_name}" direction, or explore something completely new?`,
      relevance_score: 0.75,
    });
  }

  return observations.slice(0, 3);
}

function buildConfirmationQuestions(
  params: PreGenerationParams,
  frameworks: ProposedItem[],
  rules: ProposedItem[],
  observations: Observation[],
): ConfirmationQuestion[] {
  const questions: ConfirmationQuestion[] = [];
  const mobile = isMobileProject(params.projectType, params.sessionAnswers);

  if (mobile && params.tool === "moodboard") {
    questions.push({
      key: "platform_conventions",
      type: "preference",
      question: "Should I follow platform conventions?",
      options: ["iOS HIG", "Material Design 3", "Custom approach"],
      default_answer: "Custom approach",
      is_optional: false,
    });
  }

  if (
    rules.some((r) => r.key === "accessibility") &&
    params.tool === "design_audit"
  ) {
    questions.push({
      key: "accessibility_level",
      type: "rule",
      question: "Accessibility level for this audit?",
      options: ["WCAG AA (standard)", "WCAG AAA (strict)", "Basic only"],
      default_answer: "WCAG AA (standard)",
      is_optional: false,
    });
  }

  if (params.tool === "wireframe") {
    questions.push({
      key: "moodboard_direction",
      type: "preference",
      question: "Should I follow the moodboard visual direction?",
      options: ["Yes", "No — keep it neutral"],
      default_answer: "Yes",
      is_optional: false,
    });
  }

  const ambiguousFw = frameworks.filter((f) => f.confidence === "medium" && !f.apply_by_default);
  if (ambiguousFw.length > 0 && questions.length < 4) {
    questions.push({
      key: "framework_service_design",
      type: "framework",
      question: `Apply ${ambiguousFw[0]!.name}?`,
      options: ["Yes, include it", "No, skip"],
      default_answer: "Yes, include it",
      is_optional: true,
    });
  }

  return questions.slice(0, 2);
}

function shouldSkipConfirmation(
  observations: Observation[],
  questions: ConfirmationQuestion[],
  frameworks: ProposedItem[],
): boolean {
  const hasNonDefault = frameworks.some((f) => !f.apply_by_default && f.confidence !== "high");
  if (observations.length === 0 && questions.length === 0 && !hasNonDefault) {
    return true;
  }
  return false;
}

export async function generatePreConfirmation(
  params: PreGenerationParams,
): Promise<PreConfirmation> {
  const clientName =
    params.clientName?.trim() ||
    (params.tool === "ia" || params.tool === "wireframe"
      ? extractIaClient(params.sessionAnswers)
      : extractBrandName(params.sessionAnswers)) ||
    undefined;
  const projectType =
    params.projectType ?? normalizeAnswer(params.sessionAnswers.q3) ?? "";

  const context =
    params.context ??
    (await loadUnifiedContext({
      tool: params.tool,
      client_name: clientName,
      project_type: projectType,
      input_type: params.inputType,
    }));

  const blob = textBlob(params.sessionAnswers);

  const proposed_frameworks = buildFrameworkProposals(params, blob);
  const proposed_rules = buildRuleProposals(params, blob);
  const meeting_observations = buildObservations(context, blob, projectType);
  const confirmation_questions = buildConfirmationQuestions(
    params,
    proposed_frameworks,
    proposed_rules,
    meeting_observations,
  );

  const skip_confirmation = shouldSkipConfirmation(
    meeting_observations,
    confirmation_questions,
    proposed_frameworks,
  );

  return {
    proposed_frameworks,
    proposed_rules,
    meeting_observations,
    confirmation_questions: skip_confirmation ? [] : confirmation_questions.slice(0, 4),
    skip_confirmation,
  };
}

export function formatUserConfirmationsForPrompt(
  confirmations: import("@/lib/pre-generation-types").UserPreConfirmation,
): string {
  const lines: string[] = ["=== USER PRE-GENERATION CONFIRMATIONS ==="];

  if (confirmations.confirmed_frameworks.length) {
    lines.push(`User CONFIRMED frameworks: ${confirmations.confirmed_frameworks.join(", ")}`);
  }
  if (confirmations.rejected_frameworks.length) {
    lines.push(`User REJECTED frameworks: ${confirmations.rejected_frameworks.join(", ")}`);
  }
  if (confirmations.confirmed_rules.length) {
    lines.push(`User CONFIRMED rules: ${confirmations.confirmed_rules.join(", ")}`);
  }
  if (confirmations.rejected_rules.length) {
    lines.push(`User REJECTED rules: ${confirmations.rejected_rules.join(", ")}`);
  }
  for (const o of confirmations.observation_answers) {
    lines.push(`Observation "${o.observation.slice(0, 80)}…" → ${o.answer}`);
  }
  for (const q of confirmations.question_answers) {
    lines.push(`Q: ${q.question} → ${q.answer}`);
  }
  lines.push("=== END CONFIRMATIONS ===");
  return lines.join("\n");
}

export { buildUserPreConfirmationFromUI } from "@/lib/pre-generation-ui";
