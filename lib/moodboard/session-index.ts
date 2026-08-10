import { setClientSessionId } from "@/lib/client-storage";
import type { MoodboardSession } from "./db-types";
import { clearSessionSnapshot } from "./session-snapshot";

export const MOODBOARD_SESSION_STORAGE_KEY = "moodboard-session-id";

export type SessionIndexEntry = {
  sessionId: string;
  brandName: string | null;
  status: string;
  updatedAt: string;
  pinned?: boolean;
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
  window.dispatchEvent(new Event("moodboard-session-index-updated"));
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

/** New session id in localStorage + cleared snapshot; does not reload the page. */
export function createFreshSessionId(): string {
  const id = crypto.randomUUID();
  setClientSessionId(MOODBOARD_SESSION_STORAGE_KEY, id);
  clearSessionSnapshot();
  upsertSessionIndex({
    sessionId: id,
    brandName: null,
    status: "in_progress",
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export function startNewSession(): void {
  createFreshSessionId();
  window.location.reload();
}

export function mergeSessionLists(
  local: SessionIndexEntry[],
  remote: SessionIndexEntry[],
): SessionIndexEntry[] {
  const pinned = new Map(local.map((e) => [e.sessionId, e.pinned]));
  const map = new Map<string, SessionIndexEntry>();
  for (const entry of [...local, ...remote]) {
    const existing = map.get(entry.sessionId);
    if (!existing || new Date(entry.updatedAt) > new Date(existing.updatedAt)) {
      map.set(entry.sessionId, entry);
    }
  }
  for (const [sessionId, isPinned] of pinned) {
    const entry = map.get(sessionId);
    if (entry) entry.pinned = isPinned;
  }
  return [...map.values()].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/** Rename a session's brand title, locally and best-effort on the backend. */
export async function renameSessionInIndex(
  sessionId: string,
  brandName: string,
): Promise<void> {
  const trimmed = brandName.trim();
  if (!trimmed) return;

  const entries = loadSessionIndex();
  const entry = entries.find((e) => e.sessionId === sessionId);
  upsertSessionIndex({
    sessionId,
    brandName: trimmed,
    status: entry?.status ?? "in_progress",
    updatedAt: new Date().toISOString(),
    pinned: entry?.pinned,
  });

  try {
    await fetch("/api/moodboard/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, brand_name: trimmed }),
    });
  } catch {
    /* local rename still applied */
  }
}

export function toggleSessionPinned(sessionId: string): void {
  const entries = loadSessionIndex();
  const entry = entries.find((e) => e.sessionId === sessionId);
  if (!entry) return;
  saveSessionIndex(
    entries.map((e) =>
      e.sessionId === sessionId ? { ...e, pinned: !e.pinned } : e,
    ),
  );
}

/** Remove a session from the sidebar and delete it on the backend. */
export async function deleteSessionEverywhere(sessionId: string): Promise<void> {
  const entries = loadSessionIndex();
  saveSessionIndex(entries.filter((e) => e.sessionId !== sessionId));

  try {
    await fetch("/api/moodboard/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    /* local removal still applied */
  }
}
