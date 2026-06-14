import type { AuditModelId } from "./types";

export type AuditModelConfig = {
  id: AuditModelId;
  label: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  vision: boolean;
  recommended?: boolean;
  estimatedSeconds: number;
};

export const AUDIT_MODELS: AuditModelConfig[] = [
  {
    id: "claude-haiku",
    label: "Claude Haiku (fast)",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    vision: true,
    estimatedSeconds: 20,
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet (recommended)",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    vision: true,
    recommended: true,
    estimatedSeconds: 50,
  },
  {
    id: "claude-nano",
    label: "Claude Nano",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    vision: true,
    estimatedSeconds: 15,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    model: "gpt-4o",
    vision: true,
    estimatedSeconds: 35,
  },
  {
    id: "gemini-pro",
    label: "Gemini Pro",
    provider: "google",
    model: "gemini-1.5-pro",
    vision: true,
    estimatedSeconds: 40,
  },
];

export function getAuditModel(id: AuditModelId): AuditModelConfig {
  return (
    AUDIT_MODELS.find((m) => m.id === id) ??
    AUDIT_MODELS.find((m) => m.recommended)!
  );
}
