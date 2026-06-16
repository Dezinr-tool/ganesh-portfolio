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
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function statusLabel(status: string) {
  if (status === "complete") return "Completed";
  if (status === "generating") return "Generating";
  if (status === "error") return "Error";
  return "In progress";
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`moodboard-sessions-chevron moodboard-sessions-chevron--${direction}`}
    >
      {direction === "right" ? (
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10 4L6 8l4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function MoodboardSessionsSidebar({
  activeSessionId,
  theme = "light",
}: {
  activeSessionId: string;
  theme?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
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
    const onUpdate = () => {
      void refresh();
    };
    window.addEventListener("moodboard-session-index-updated", onUpdate);
    return () => window.removeEventListener("moodboard-session-index-updated", onUpdate);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const handleSessionClick = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      close();
      return;
    }
    close();
    switchToSession(sessionId);
  };

  const handleNewSession = () => {
    close();
    startNewSession();
  };

  const lightToggle = theme === "light";

  return (
    <>
      <div
        className={`moodboard-sessions-backdrop ${open ? "moodboard-sessions-backdrop--visible" : ""}`}
        onClick={close}
        aria-hidden={!open}
      />

      <aside
        className={`moodboard-sessions-panel ${open ? "moodboard-sessions-panel--open" : ""}`}
        aria-hidden={!open}
        aria-label="Sessions"
      >
        <div className="moodboard-sessions-panel-header">
          <p className="moodboard-sessions-panel-title">Sessions</p>
          <button
            type="button"
            onClick={handleNewSession}
            className="moodboard-sessions-new-btn"
          >
            + New
          </button>
        </div>

        <div className="moodboard-sessions-panel-list">
          {loading ? (
            <p className="moodboard-sessions-empty">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="moodboard-sessions-empty">No sessions yet. Start a new moodboard.</p>
          ) : (
            <ul className="moodboard-sessions-items">
              {sessions.map((session) => {
                const active = session.sessionId === activeSessionId;
                return (
                  <li key={session.sessionId}>
                    <button
                      type="button"
                      onClick={() => handleSessionClick(session.sessionId)}
                      className={`moodboard-sessions-item ${active ? "moodboard-sessions-item--active" : ""}`}
                    >
                      <p className="moodboard-sessions-item-name">
                        {session.brandName || "Untitled brand"}
                      </p>
                      <p className="moodboard-sessions-item-meta">
                        {statusLabel(session.status)} · {formatRelativeDate(session.updatedAt)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <button
        type="button"
        onClick={toggle}
        className={`moodboard-sessions-toggle ${open ? "moodboard-sessions-toggle--open" : ""} ${
          lightToggle ? "moodboard-sessions-toggle--light" : "moodboard-sessions-toggle--dark"
        }`}
        aria-label={open ? "Close sessions panel" : "Open sessions panel"}
        aria-expanded={open}
      >
        <ChevronIcon direction={open ? "left" : "right"} />
      </button>
    </>
  );
}
