import type { AuditModelId } from "./types";

export type AuditModelConfig = {
  id: AuditModelId;
  label: string;
  shortLabel: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  vision: boolean;
  recommended?: boolean;
  estimatedSeconds: number;
  tag: string;
  description: string;
  tooltip: string;
};

export const AUDIT_DEFAULT_REASON =
  "Sonnet gives the best balance of deep UX reasoning and visual analysis for design audits.";

export const AUDIT_MODELS: AuditModelConfig[] = [
  {
    id: "claude-sonnet",
    label: "Claude Sonnet",
    shortLabel: "Sonnet",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    vision: true,
    recommended: true,
    estimatedSeconds: 50,
    tag: "RECOMMENDED FOR AUDIT",
    description: "Best reasoning + visual analysis",
    tooltip:
      "Best for: Deep heuristic analysis, nuanced UX feedback, WCAG compliance",
  },
  {
    id: "claude-opus",
    label: "Claude Opus",
    shortLabel: "Opus",
    provider: "anthropic",
    model: "claude-opus-4-6",
    vision: true,
    estimatedSeconds: 90,
    tag: "MOST THOROUGH",
    description: "Deepest analysis, slower",
    tooltip:
      "Best for: Complex enterprise products, maximum detail needed, time not a concern",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    shortLabel: "GPT-4o",
    provider: "openai",
    model: "gpt-4o",
    vision: true,
    estimatedSeconds: 35,
    tag: "GREAT FOR VISUALS",
    description: "Strong image understanding",
    tooltip:
      "Best for: Visual-heavy audits, screenshot analysis, UI pattern recognition",
  },
  {
    id: "gemini-pro",
    label: "Gemini Pro",
    shortLabel: "Gemini",
    provider: "google",
    model: "gemini-1.5-pro",
    vision: true,
    estimatedSeconds: 40,
    tag: "FAST + CAPABLE",
    description: "Good balance of speed and depth",
    tooltip: "Best for: Quick directional audit, good enough for early-stage products",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku",
    shortLabel: "Haiku",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    vision: true,
    estimatedSeconds: 20,
    tag: "QUICK SCAN",
    description: "Fast but less detailed audit",
    tooltip: "Best for: Quick sanity check only, not recommended for detailed audits",
  },
];

export function getAuditModel(id: AuditModelId): AuditModelConfig {
  return (
    AUDIT_MODELS.find((m) => m.id === id) ??
    AUDIT_MODELS.find((m) => m.recommended)!
  );
}

export function getAuditModelReason(id: AuditModelId): string {
  const model = getAuditModel(id);
  if (model.recommended) return AUDIT_DEFAULT_REASON;
  return model.tooltip;
}

export function isValidAuditModelId(id: string): id is AuditModelId {
  return AUDIT_MODELS.some((m) => m.id === id);
}

function tagColor(tag: string): string {
  if (tag.includes("RECOMMENDED")) return "bg-[var(--color-accent)] text-[var(--color-accent)]";
  if (tag.includes("THOROUGH")) return "bg-[var(--color-accent)] text-[var(--color-accent)]";
  if (tag.includes("VISUALS")) return "bg-[var(--color-accent)] text-[var(--color-accent)]";
  if (tag.includes("FAST")) return "bg-[var(--color-accent)] text-[var(--color-accent)]";
  return "bg-[var(--color-bg)]/50 text-[var(--color-text)]";
}

export function auditModelTagClass(tag: string): string {
  return tagColor(tag);
}
