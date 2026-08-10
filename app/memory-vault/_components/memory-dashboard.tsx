"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MemoryCorpusCategory,
  MemoryCorpusEntry,
  MemoryCorpusStats,
} from "@/lib/moodboard/memory-corpus";

type Filter = "all" | MemoryCorpusCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "prompt", label: "Prompts" },
  { id: "intake", label: "Intake" },
  { id: "generation", label: "Generations" },
  { id: "refinement", label: "Refinements" },
  { id: "chip", label: "Chips" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function MemoryDashboard() {
  const [entries, setEntries] = useState<MemoryCorpusEntry[]>([]);
  const [stats, setStats] = useState<MemoryCorpusStats | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/memory-vault?limit=2000", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load memory.");
        return;
      }
      setEntries(data.entries ?? []);
      setStats(data.stats ?? null);
    } catch {
      setError("Failed to load memory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== "all" && entry.category !== filter) return false;
      if (!q) return true;
      return (
        entry.preview.toLowerCase().includes(q) ||
        entry.sessionId.toLowerCase().includes(q) ||
        entry.eventType.toLowerCase().includes(q) ||
        entry.label.toLowerCase().includes(q)
      );
    });
  }, [entries, filter, search]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ stats, entries: filtered }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memory-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, stats]);

  return (
    <div className="moodboard-memory">
      <header className="moodboard-memory-header">
        <div>
          <Link href="/" className="moodboard-sidebar-back">
            ← Back to site
          </Link>
          <p className="zd-num">// Memory Vault</p>
          <h1 className="moodboard-memory-title">Agent training corpus</h1>
          <p className="moodboard-memory-sub">
            Every user prompt, intake snapshot, generation, and refinement — stored for
            agent training. Private — not linked from anywhere in the app.
          </p>
        </div>
        <div className="moodboard-memory-actions">
          <button type="button" className="moodboard-memory-btn" onClick={() => void load()}>
            Refresh
          </button>
          <button
            type="button"
            className="moodboard-memory-btn moodboard-memory-btn--primary"
            onClick={exportJson}
            disabled={!filtered.length}
          >
            Export JSON
          </button>
        </div>
      </header>

      {stats ? (
        <div className="moodboard-memory-stats">
          <div>
            <span>{stats.total}</span>
            <p>Total records</p>
          </div>
          <div>
            <span>{stats.prompts}</span>
            <p>Prompts</p>
          </div>
          <div>
            <span>{stats.generations}</span>
            <p>Generations</p>
          </div>
          <div>
            <span>{stats.sessions}</span>
            <p>Sessions</p>
          </div>
        </div>
      ) : null}

      <div className="moodboard-memory-toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompts, session id…"
          className="moodboard-memory-search"
          aria-label="Search memory"
        />
        <div className="moodboard-memory-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`moodboard-memory-filter ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="moodboard-memory-error">{error}</p> : null}
      {loading ? (
        <p className="moodboard-memory-empty">Loading training memory…</p>
      ) : filtered.length === 0 ? (
        <p className="moodboard-memory-empty">
          No training records yet. User prompts appear here as people use Moodboard.
        </p>
      ) : (
        <ul className="moodboard-memory-list">
          {filtered.map((entry) => {
            const open = expandedId === entry.id;
            return (
              <li key={entry.id} className="moodboard-memory-item">
                <button
                  type="button"
                  className="moodboard-memory-item-head"
                  onClick={() => setExpandedId(open ? null : entry.id)}
                >
                  <span className="moodboard-memory-item-label">{entry.label}</span>
                  <span className="moodboard-memory-item-time">
                    {formatDate(entry.createdAt)}
                  </span>
                </button>
                <p className="moodboard-memory-item-preview">{entry.preview}</p>
                <div className="moodboard-memory-item-meta">
                  <span className="moodboard-memory-tag">{entry.category}</span>
                  <span className="moodboard-memory-session-link">
                    {entry.sessionId.slice(0, 8)}…
                  </span>
                </div>
                {open ? (
                  <pre className="moodboard-memory-json">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
