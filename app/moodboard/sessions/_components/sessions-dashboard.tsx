"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionAnalyticsSummary } from "@/lib/moodboard/analytics";
import { resolveSessionDirections } from "@/lib/moodboard/resolve-session-directions";
import { MoodboardNav } from "../../_components/moodboard-nav";

type SessionFilter = "all" | "in_progress" | "completed" | "no_input" | "today";

const FILTERS: { id: SessionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "no_input", label: "No input" },
  { id: "today", label: "Today" },
];

function formatDuration(ms: number | null) {
  if (ms == null) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function hasMeaningfulAnswers(answers: Record<string, unknown>): boolean {
  const keys = Object.keys(answers).filter((k) => !k.startsWith("_"));
  if (keys.length === 0) return false;
  return keys.some((key) => {
    const val = answers[key];
    if (val == null) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val as object).length > 0;
    return true;
  });
}

function isJunkSession(summary: SessionAnalyticsSummary): boolean {
  const brand = summary.session.brand_name?.trim().toLowerCase() ?? "";
  const junkBrand =
    !brand ||
    brand === "untitled" ||
    brand === "untitled brand" ||
    brand === "your brand";
  return junkBrand || !hasMeaningfulAnswers(summary.session.answers ?? {});
}

function matchesFilter(summary: SessionAnalyticsSummary, filter: SessionFilter): boolean {
  const { session } = summary;
  switch (filter) {
    case "all":
      return true;
    case "in_progress":
      return session.status === "in_progress" || session.status === "generating";
    case "completed":
      return (
        session.status === "complete" || session.generation_status === "completed"
      );
    case "no_input":
      return isJunkSession(summary);
    case "today":
      return isToday(session.created_at) || isToday(session.updated_at);
    default:
      return true;
  }
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2.5 4.5h11M6 4.5V3.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 4.5l.5 8.5a1 1 0 001 1h2a1 1 0 001-1l.5-8.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SessionsDashboard({
  sessions: initialSessions,
}: {
  sessions: SessionAnalyticsSummary[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (!matchesFilter(s, filter)) return false;
      if (!q) return true;
      const brand = s.session.brand_name?.toLowerCase() ?? "";
      const id = s.session.session_id.toLowerCase();
      return brand.includes(q) || id.includes(q);
    });
  }, [filter, query, sessions]);

  const filteredIds = useMemo(
    () => filtered.map((s) => s.session.session_id),
    [filtered],
  );

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));

  const toggleSelect = useCallback((sessionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }, [allFilteredSelected, filteredIds]);

  const deleteSessions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      if (ids.length === 1) {
        const res = await fetch(`/api/moodboard/sessions/${ids[0]}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
      } else {
        const res = await fetch("/api/moodboard/sessions/bulk", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error("Bulk delete failed");
      }

      setSessions((prev) => prev.filter((s) => !ids.includes(s.session.session_id)));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      setToast(ids.length === 1 ? "Session deleted" : `${ids.length} sessions deleted`);
    } catch {
      setToast("Delete failed — try again");
    } finally {
      setDeleting(false);
      setConfirmingId(null);
      setBulkConfirming(false);
    }
  }, []);

  const handleConfirmSingle = (sessionId: string) => {
    void deleteSessions([sessionId]);
  };

  const handleConfirmBulk = () => {
    void deleteSessions([...selected]);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <MoodboardNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-light text-white">Tester sessions</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Private analytics — {sessions.length} session{sessions.length === 1 ? "" : "s"}
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand or session ID"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 sm:max-w-xs"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === f.id
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selected.size > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            {bulkConfirming ? (
              <>
                <p className="text-sm text-zinc-300">
                  Delete {selected.size} session{selected.size === 1 ? "" : "s"}? This cannot be
                  undone.
                </p>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmBulk}
                  className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete all"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setBulkConfirming(false)}
                  className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">{selected.size} selected</p>
                <button
                  type="button"
                  onClick={() => setBulkConfirming(true)}
                  className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  Delete selected ({selected.size})
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-3 border-b border-zinc-800 pb-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={allFilteredSelected && filteredIds.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-zinc-700 bg-zinc-950 text-zinc-100"
            />
            Select all
          </label>
          <span className="text-xs text-zinc-600">
            {filtered.length} shown
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500">
              No sessions match your filters.
            </p>
          ) : (
            filtered.map((summary) => {
              const sessionId = summary.session.session_id;
              const directions = resolveSessionDirections(summary);
              const hasDirections = directions.length > 0;
              const isSelected = selected.has(sessionId);
              const isConfirming = confirmingId === sessionId;

              return (
                <div
                  key={sessionId}
                  className={`flex items-stretch gap-3 rounded-xl border bg-zinc-950/40 transition ${
                    isSelected ? "border-zinc-600" : "border-zinc-800"
                  }`}
                >
                  <label className="flex cursor-pointer items-center pl-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(sessionId)}
                      className="rounded border-zinc-700 bg-zinc-950 text-zinc-100"
                      aria-label={`Select ${summary.session.brand_name || "session"}`}
                    />
                  </label>

                  <Link
                    href={`/moodboard/sessions/${sessionId}`}
                    className="min-w-0 flex-1 py-4 pr-2 transition hover:opacity-90"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {summary.session.brand_name || "Untitled brand"}
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">{sessionId}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
                          {summary.completionPercent}% complete
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
                          {formatDuration(summary.timeSpentMs)}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
                          {summary.session.status}
                        </span>
                        {hasDirections ? (
                          <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-300">
                            {directions.length} direction{directions.length === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-500">
                            Not generated
                          </span>
                        )}
                        {summary.session.selected_direction ? (
                          <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-green-400">
                            → {summary.session.selected_direction}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-zinc-500 sm:text-right">
                        {formatDate(summary.session.updated_at)}
                      </p>
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center pr-4">
                    {isConfirming ? (
                      <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                        <p className="max-w-[140px] text-right text-[11px] leading-snug text-zinc-500 sm:max-w-none">
                          Delete this session?
                        </p>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => handleConfirmSingle(sessionId)}
                          className="rounded-md bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/25 disabled:opacity-50"
                        >
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(sessionId)}
                        className="rounded-md p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-[#ef4444]"
                        aria-label="Delete session"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
