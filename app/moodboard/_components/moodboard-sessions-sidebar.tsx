"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadSessionIndex,
  mergeSessionLists,
  startNewSession,
  switchToSession,
  type SessionIndexEntry,
} from "@/lib/moodboard/session-index";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function statusLabel(status: string) {
  if (status === "complete") return "Complete";
  if (status === "generating") return "Generating";
  if (status === "error") return "Error";
  return "In progress";
}

export function MoodboardSessionsSidebar({
  activeSessionId,
  theme = "light",
}: {
  activeSessionId: string;
  theme?: "light" | "dark";
}) {
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const local = loadSessionIndex();
    let merged = local;

    try {
      const res = await fetch("/api/moodboard/admin/sessions");
      if (res.ok) {
        const data = (await res.json()) as {
          sessions?: Array<{
            session: {
              session_id: string;
              brand_name: string | null;
              status: string;
              updated_at: string;
            };
          }>;
        };
        const remote: SessionIndexEntry[] = (data.sessions ?? []).map((s) => ({
          sessionId: s.session.session_id,
          brandName: s.session.brand_name,
          status: s.session.status,
          updatedAt: s.session.updated_at,
        }));
        merged = mergeSessionLists(local, remote);
      }
    } catch {
      /* use local only */
    }

    setSessions(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dark = theme === "dark";

  return (
    <aside
      className={`moodboard-sessions-sidebar hidden w-[260px] shrink-0 flex-col border-r lg:flex ${
        dark
          ? "border-white/10 bg-[#0a0a0a]"
          : "border-[#e8e8e8] bg-[#f5f5f5]"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${
          dark ? "border-white/10" : "border-[#e8e8e8]"
        }`}
      >
        <p
          className={`text-xs font-medium uppercase tracking-wide ${
            dark ? "text-zinc-500" : "text-[#888]"
          }`}
        >
          Sessions
        </p>
        <button
          type="button"
          onClick={startNewSession}
          className={`rounded-md px-2 py-1 text-xs font-medium transition ${
            dark
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-[#1a1a1a] text-white hover:bg-[#333]"
          }`}
        >
          + New
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2">
        {loading ? (
          <p className={`px-2 py-3 text-xs ${dark ? "text-zinc-600" : "text-[#aaa]"}`}>
            Loading…
          </p>
        ) : sessions.length === 0 ? (
          <p className={`px-2 py-3 text-xs ${dark ? "text-zinc-600" : "text-[#aaa]"}`}>
            No sessions yet. Start a new moodboard.
          </p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => {
              const active = session.sessionId === activeSessionId;
              return (
                <li key={session.sessionId}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!active) switchToSession(session.sessionId);
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                      active
                        ? dark
                          ? "bg-white/10"
                          : "bg-white shadow-sm"
                        : dark
                          ? "hover:bg-white/5"
                          : "hover:bg-white/60"
                    }`}
                  >
                    <p
                      className={`truncate text-sm font-medium ${
                        dark ? "text-zinc-100" : "text-[#1a1a1a]"
                      }`}
                    >
                      {session.brandName || "Untitled brand"}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] ${
                          dark ? "text-zinc-500" : "text-[#999]"
                        }`}
                      >
                        {statusLabel(session.status)}
                      </span>
                      <span
                        className={`text-[10px] ${
                          dark ? "text-zinc-600" : "text-[#bbb]"
                        }`}
                      >
                        {formatRelativeDate(session.updatedAt)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
