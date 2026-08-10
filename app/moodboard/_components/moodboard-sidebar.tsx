"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon } from "@/components/ui/arrow-left";
import { SearchIcon } from "@/components/ui/search";
import {
  deleteSessionEverywhere,
  loadSessionIndex,
  mergeSessionLists,
  renameSessionInIndex,
  startNewSession,
  switchToSession,
  toggleSessionPinned,
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

function MoreIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="3.25" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="12.75" r="1.25" fill="currentColor" />
    </svg>
  );
}

function SessionItemMenu({
  session,
  anchorRect,
  onRename,
  onTogglePin,
  onDelete,
  onClose,
}: {
  session: SessionIndexEntry;
  anchorRect: { top: number; left: number; bottom: number; right: number };
  onRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const MENU_WIDTH = 168;

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="moodboard-sidebar-item-menu"
      role="menu"
      style={{
        position: "fixed",
        top: anchorRect.bottom + 4,
        left: Math.max(8, anchorRect.right - MENU_WIDTH),
      }}
    >
      <button
        type="button"
        role="menuitem"
        className="moodboard-sidebar-item-menu-row"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Rename
      </button>
      <button
        type="button"
        role="menuitem"
        className="moodboard-sidebar-item-menu-row"
        onClick={() => {
          onTogglePin();
          onClose();
        }}
      >
        {session.pinned ? "Unpin" : "Pin"}
      </button>
      <div className="moodboard-sidebar-item-menu-divider" />
      <button
        type="button"
        role="menuitem"
        className="moodboard-sidebar-item-menu-row moodboard-sidebar-item-menu-row--danger"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </button>
    </div>,
    document.body,
  );
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

function SessionListItem({
  session,
  active,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onCommitRename,
  onCancelRename,
  renameInputRef,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
}: {
  session: SessionIndexEntry;
  active: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameValueChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSelect: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const title = session.brandName || "Untitled brand";
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<{
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    if (menuOpen && moreButtonRef.current) {
      setAnchorRect(moreButtonRef.current.getBoundingClientRect());
    }
  }, [menuOpen]);

  return (
    <li className="moodboard-sidebar-item-row">
      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onChange={(e) => onRenameValueChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename();
            if (e.key === "Escape") onCancelRename();
          }}
          className="moodboard-sidebar-item-rename-input"
          aria-label="Rename board"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!active) onSelect();
          }}
          className={`moodboard-sidebar-item ${
            active ? "moodboard-sidebar-item--active" : ""
          } ${menuOpen ? "moodboard-sidebar-item--menu-open" : ""}`}
          title={title}
        >
          <span className="moodboard-sidebar-item-title">
            {truncate(title)}
          </span>
          <span className="moodboard-sidebar-item-preview">
            {session.status === "complete" ? "Directions ready" : "In progress…"}
          </span>
        </button>
      )}

      {!isRenaming && (
        <button
          ref={moreButtonRef}
          type="button"
          className={`moodboard-sidebar-item-more ${
            menuOpen ? "moodboard-sidebar-item-more--visible" : ""
          }`}
          aria-label="Board options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
        >
          <MoreIcon />
        </button>
      )}

      {menuOpen && anchorRect && (
        <SessionItemMenu
          session={session}
          anchorRect={anchorRect}
          onRename={onRename}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onClose={onCloseMenu}
        />
      )}
    </li>
  );
}

export function MoodboardSidebar({ activeSessionId }: { activeSessionId: string }) {
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [profileName, setProfileName] = useState("Designer");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  const pinnedSessions = useMemo(
    () => filtered.filter((s) => s.pinned),
    [filtered],
  );
  const grouped = useMemo(
    () => groupSessions(filtered.filter((s) => !s.pinned)),
    [filtered],
  );

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const startRename = useCallback((session: SessionIndexEntry) => {
    setRenamingId(session.sessionId);
    setRenameValue(session.brandName || "Untitled brand");
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      void renameSessionInIndex(renamingId, renameValue);
    }
    setRenamingId(null);
  }, [renamingId, renameValue]);

  const handleDelete = useCallback(
    (session: SessionIndexEntry) => {
      const title = session.brandName || "Untitled brand";
      if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
      void deleteSessionEverywhere(session.sessionId);
      if (session.sessionId === activeSessionId) startNewSession();
    },
    [activeSessionId],
  );

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
        ) : pinnedSessions.length === 0 && grouped.length === 0 ? (
          <p className="moodboard-sidebar-empty">No boards yet</p>
        ) : (
          <>
            {pinnedSessions.length > 0 && (
              <div className="moodboard-sidebar-group">
                <p className="moodboard-sidebar-section-label">Pinned</p>
                <ul className="moodboard-sidebar-list">
                  {pinnedSessions.map((session) => (
                    <SessionListItem
                      key={session.sessionId}
                      session={session}
                      active={session.sessionId === activeSessionId}
                      isRenaming={renamingId === session.sessionId}
                      renameValue={renameValue}
                      onRenameValueChange={setRenameValue}
                      onCommitRename={commitRename}
                      onCancelRename={() => setRenamingId(null)}
                      renameInputRef={renameInputRef}
                      menuOpen={openMenuId === session.sessionId}
                      onToggleMenu={() =>
                        setOpenMenuId((id) =>
                          id === session.sessionId ? null : session.sessionId,
                        )
                      }
                      onCloseMenu={() => setOpenMenuId(null)}
                      onSelect={() => switchToSession(session.sessionId)}
                      onRename={() => startRename(session)}
                      onTogglePin={() => toggleSessionPinned(session.sessionId)}
                      onDelete={() => handleDelete(session)}
                    />
                  ))}
                </ul>
              </div>
            )}
            {grouped.map(([label, items]) => (
              <div key={label} className="moodboard-sidebar-group">
                <p className="moodboard-sidebar-section-label">{label}</p>
                <ul className="moodboard-sidebar-list">
                  {items.map((session) => (
                    <SessionListItem
                      key={session.sessionId}
                      session={session}
                      active={session.sessionId === activeSessionId}
                      isRenaming={renamingId === session.sessionId}
                      renameValue={renameValue}
                      onRenameValueChange={setRenameValue}
                      onCommitRename={commitRename}
                      onCancelRename={() => setRenamingId(null)}
                      renameInputRef={renameInputRef}
                      menuOpen={openMenuId === session.sessionId}
                      onToggleMenu={() =>
                        setOpenMenuId((id) =>
                          id === session.sessionId ? null : session.sessionId,
                        )
                      }
                      onCloseMenu={() => setOpenMenuId(null)}
                      onSelect={() => switchToSession(session.sessionId)}
                      onRename={() => startRename(session)}
                      onTogglePin={() => toggleSessionPinned(session.sessionId)}
                      onDelete={() => handleDelete(session)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </>
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
    </aside>
  );
}
