"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadSessionIndex,
  mergeSessionLists,
  startNewSession,
  switchToSession,
  type SessionIndexEntry,
} from "@/lib/moodboard/session-index";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusDot(status: string) {
  if (status === "complete") return "bg-emerald-500";
  if (status === "generating") return "bg-amber-400 animate-pulse";
  if (status === "error") return "bg-red-400";
  return "bg-[var(--color-text)]/30";
}

export function MoodboardSessionsBar({
  activeSessionId,
  theme = "light",
}: {
  activeSessionId: string;
  theme?: "light" | "dark";
}) {
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const light = theme === "light";

  const refresh = useCallback(async () => {
    const local = loadSessionIndex();
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
        setSessions(mergeSessionLists(local, remote));
        return;
      }
    } catch {
      /* local only */
    }
    setSessions(local);
  }, []);

  useEffect(() => {
    void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener("moodboard-session-index-updated", onUpdate);
    return () => window.removeEventListener("moodboard-session-index-updated", onUpdate);
  }, [refresh, activeSessionId]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-session="${activeSessionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSessionId, sessions.length]);

  return (
    <div
      className={`moodboard-sessions-bar ${
        light ? "moodboard-sessions-bar--light" : "moodboard-sessions-bar--dark"
      }`}
      role="navigation"
      aria-label="Moodboard sessions"
    >
      <button
        type="button"
        onClick={() => startNewSession()}
        className="moodboard-sessions-bar-new"
        title="Start new session"
      >
        <span className="moodboard-sessions-bar-new-icon" aria-hidden>
          +
        </span>
        <span className="hidden sm:inline">New</span>
      </button>

      <div ref={scrollRef} className="moodboard-sessions-bar-scroll">
        {sessions.length === 0 ? (
          <span className="moodboard-sessions-bar-empty">No sessions yet</span>
        ) : (
          sessions.map((session) => {
            const active = session.sessionId === activeSessionId;
            const label = session.brandName || "Untitled";
            return (
              <button
                key={session.sessionId}
                type="button"
                data-session={session.sessionId}
                onClick={() => {
                  if (!active) switchToSession(session.sessionId);
                }}
                className={`moodboard-sessions-bar-pill ${
                  active ? "moodboard-sessions-bar-pill--active" : ""
                }`}
                title={`${label} · ${session.status}`}
              >
                <span
                  className={`moodboard-sessions-bar-dot ${statusDot(session.status)}`}
                  aria-hidden
                />
                <span className="moodboard-sessions-bar-pill-label">{label}</span>
                <span className="moodboard-sessions-bar-pill-time">
                  {formatRelativeDate(session.updatedAt)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
