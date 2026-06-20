import type { MoodboardPresentationDirection } from "./db-types";
import type { MoodboardModelId } from "./types";

const SNAPSHOT_KEY = "moodboard-session-snapshot";

export type SessionSnapshot = {
  sessionId: string;
  answers: Record<string, unknown>;
  messages: Array<{ role: "user" | "assistant"; text: string }>;
  directions: MoodboardPresentationDirection[];
  selectedOutputSections: string[];
  modelId: MoodboardModelId | null;
  extras?: {
    websiteAnalysis?: string;
    brandResearch?: string;
    competitorResearch?: string;
    documentExtract?: string;
  };
  savedAt: string;
};

export function saveSessionSnapshot(snapshot: SessionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota */
  }
}

export function loadSessionSnapshot(sessionId: string): SessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSessionSnapshot(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SNAPSHOT_KEY);
}
