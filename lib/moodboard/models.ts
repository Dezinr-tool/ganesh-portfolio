import type { MoodboardModelId } from "./types";

export type ModelConfig = {
  id: MoodboardModelId;
  label: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  recommended?: boolean;
  estimatedSeconds: number;
};

export const MOODBOARD_MODELS: ModelConfig[] = [
  {
    id: "claude-haiku",
    label: "Claude Haiku (fast)",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    estimatedSeconds: 15,
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet (recommended)",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    recommended: true,
    estimatedSeconds: 45,
  },
  {
    id: "claude-nano",
    label: "Claude Nano",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    estimatedSeconds: 10,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    model: "gpt-4o",
    estimatedSeconds: 30,
  },
  {
    id: "gemini-pro",
    label: "Gemini Pro",
    provider: "google",
    model: "gemini-1.5-pro",
    estimatedSeconds: 35,
  },
];

export function getModelConfig(id: MoodboardModelId): ModelConfig {
  return (
    MOODBOARD_MODELS.find((m) => m.id === id) ??
    MOODBOARD_MODELS.find((m) => m.recommended)!
  );
}
