"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { SearchIcon } from "@/components/ui/search";
import {
  loadSessionIndex,
  mergeSessionLists,
  startNewSession,
  switchToSession,
  type SessionIndexEntry,
} from "@/lib/moodboard/session-index";

const PROFILE_KEY = "moodboard-profile-name";

function truncate(text: string, max = 32) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function groupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / 86400000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupSessions(sessions: SessionIndexEntry[]) {
  const groups = new Map<string, SessionIndexEntry[]>();
  for (const s of sessions) {
    const label = groupLabel(s.updatedAt);
    const list = groups.get(label) ?? [];
    list.push(s);
    groups.set(label, list);
  }
  return [...groups.entries()];
}

export function MoodboardSidebar({ activeSessionId }: { activeSessionId: string }) {
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [profileName, setProfileName] = useState("Designer");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored?.trim()) setProfileName(stored.trim());
    } catch {
      /* ignore */
    }
  }, []);

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
        setLoading(false);
        return;
      }
    } catch {
      /* local only */
    }
    setSessions(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener("moodboard-session-index-updated", onUpdate);
    return () => window.removeEventListener("moodboard-session-index-updated", onUpdate);
  }, [refresh, activeSessionId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      (s.brandName ?? "untitled").toLowerCase().includes(q),
    );
  }, [search, sessions]);

  const grouped = useMemo(() => groupSessions(filtered), [filtered]);

  const initials = profileName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="moodboard-sidebar" aria-label="Sessions">
      <div className="moodboard-sidebar-top">
        <Link href="/tools" className="moodboard-sidebar-back">
          <ArrowLeftIcon size={18} aria-hidden />
          <span>All tools</span>
        </Link>

        <div className="moodboard-sidebar-search-wrap">
          <SearchIcon size={16} className="moodboard-sidebar-search-icon" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="moodboard-sidebar-search"
            aria-label="Search chats"
          />
          <kbd className="moodboard-sidebar-search-kbd">⌘K</kbd>
        </div>

        <button
          type="button"
          onClick={() => startNewSession()}
          className="moodboard-sidebar-new-chat"
        >
          + New direction
        </button>
      </div>

      <div className="moodboard-sidebar-recents">
        {loading ? (
          <p className="moodboard-sidebar-empty">Loading…</p>
        ) : grouped.length === 0 ? (
          <p className="moodboard-sidebar-empty">No boards yet</p>
        ) : (
          grouped.map(([label, items]) => (
            <div key={label} className="moodboard-sidebar-group">
              <p className="moodboard-sidebar-section-label">{label}</p>
              <ul className="moodboard-sidebar-list">
                {items.map((session) => {
                  const active = session.sessionId === activeSessionId;
                  const title = session.brandName || "Untitled brand";
                  return (
                    <li key={session.sessionId}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!active) switchToSession(session.sessionId);
                        }}
                        className={`moodboard-sidebar-item ${
                          active ? "moodboard-sidebar-item--active" : ""
                        }`}
                        title={title}
                      >
                        <span className="moodboard-sidebar-item-title">
                          {truncate(title)}
                        </span>
                        <span className="moodboard-sidebar-item-preview">
                          {session.status === "complete"
                            ? "Directions ready"
                            : "In progress…"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="moodboard-sidebar-profile">
        <div className="moodboard-sidebar-avatar" aria-hidden>
          {initials}
        </div>
        <div className="moodboard-sidebar-profile-text">
          <p className="moodboard-sidebar-profile-name">{profileName}</p>
          <p className="moodboard-sidebar-profile-role">Pro · Moodboard</p>
        </div>
      </div>
      <div className="moodboard-sidebar-footer-links">
        <Link href="/moodboard/memory" className="moodboard-sidebar-footer-link">
          Memory
        </Link>
      </div>
    </aside>
  );
}
