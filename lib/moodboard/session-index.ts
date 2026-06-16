import type { MoodboardSession } from "./db-types";

export type SessionIndexEntry = {
  sessionId: string;
  brandName: string | null;
  status: string;
  updatedAt: string;
};

const INDEX_KEY = "moodboard-session-index";

export function loadSessionIndex(): SessionIndexEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionIndexEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessionIndex(entries: SessionIndexEntry[]): void {
  if (typeof window === "undefined") return;
  const sorted = [...entries].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  localStorage.setItem(INDEX_KEY, JSON.stringify(sorted.slice(0, 50)));
}

export function upsertSessionIndex(entry: SessionIndexEntry): void {
  const existing = loadSessionIndex();
  const next = [entry, ...existing.filter((e) => e.sessionId !== entry.sessionId)];
  saveSessionIndex(next);
}

export function registerSession(session: MoodboardSession): void {
  upsertSessionIndex({
    sessionId: session.session_id,
    brandName: session.brand_name,
    status: session.status,
    updatedAt: session.updated_at,
  });
}

export function switchToSession(sessionId: string): void {
  localStorage.setItem("moodboard-session-id", sessionId);
  window.location.reload();
}

export function startNewSession(): void {
  const id = crypto.randomUUID();
  localStorage.setItem("moodboard-session-id", id);
  upsertSessionIndex({
    sessionId: id,
    brandName: null,
    status: "in_progress",
    updatedAt: new Date().toISOString(),
  });
  window.location.reload();
}

export function mergeSessionLists(
  local: SessionIndexEntry[],
  remote: SessionIndexEntry[],
): SessionIndexEntry[] {
  const map = new Map<string, SessionIndexEntry>();
  for (const entry of [...local, ...remote]) {
    const existing = map.get(entry.sessionId);
    if (!existing || new Date(entry.updatedAt) > new Date(existing.updatedAt)) {
      map.set(entry.sessionId, entry);
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
