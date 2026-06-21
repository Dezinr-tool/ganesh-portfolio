"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type KnowledgeEntry = {
  id: string;
  category: string;
  file_name: string;
  title: string;
  version: number;
  last_updated_at: string;
  next_update_at: string | null;
  last_researched_at: string | null;
};

type KnowledgeUpdate = {
  id: string;
  file_name: string;
  previous_version: number | null;
  new_version: number;
  changes_summary: string | null;
  new_content: string | null;
  updated_at: string;
  update_source: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function simpleDiff(oldText: string, newText: string): string[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  const lines: string[] = [];
  for (let i = 0; i < max; i++) {
    const o = oldLines[i] ?? "";
    const n = newLines[i] ?? "";
    if (o === n) lines.push(`  ${n}`);
    else if (o && n) lines.push(`- ${o}`, `+ ${n}`);
    else if (o) lines.push(`- ${o}`);
    else lines.push(`+ ${n}`);
  }
  return lines.slice(0, 200);
}

export function KnowledgeAdminPanel() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [updates, setUpdates] = useState<KnowledgeUpdate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/knowledge/list");
    if (!res.ok) throw new Error("Failed to load list");
    const data = await res.json();
    setEntries(data.entries ?? []);
  }, []);

  const loadUpdates = useCallback(async () => {
    const res = await fetch("/api/knowledge/updates?limit=30");
    if (!res.ok) return;
    const data = await res.json();
    setUpdates(data.updates ?? []);
  }, []);

  const loadEntry = useCallback(async (fileName: string) => {
    const res = await fetch(`/api/knowledge/${encodeURIComponent(fileName)}`);
    if (!res.ok) throw new Error("Failed to load entry");
    const data = await res.json();
    setContent(data.entry.content ?? "");
    setPreviousContent(data.entry.content ?? "");
    setSelected(fileName);
    setEditMode(false);
    setShowDiff(false);

    const history = updates.find((u) => u.file_name === fileName);
    if (history?.new_content) {
      setPreviousContent(history.new_content);
    }
  }, [updates]);

  useEffect(() => {
    (async () => {
      try {
        await loadList();
        await loadUpdates();
      } catch {
        setMessage("Failed to load knowledge base.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadList, loadUpdates]);

  const grouped = useMemo(() => {
    const ux = entries.filter((e) => e.category === "ux_rules");
    const fw = entries.filter((e) => e.category === "design_framework");
    const ia = entries.filter((e) => e.category === "ia");
    return { ux, fw, ia };
  }, [entries]);

  const runUpdate = async (fileName?: string) => {
    setBusy(fileName ?? "all");
    setMessage("");
    try {
      const res = fileName
        ? await fetch(`/api/knowledge/update/${encodeURIComponent(fileName)}`, {
            method: "POST",
          })
        : await fetch("/api/knowledge/update-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMessage(
        fileName
          ? `${fileName}: ${data.result?.status ?? "done"}`
          : `Bulk: ${data.summary?.updated ?? 0} updated, ${data.summary?.unchanged ?? 0} unchanged`,
      );
      await loadList();
      await loadUpdates();
      if (fileName && selected === fileName) await loadEntry(fileName);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const saveManual = async () => {
    if (!selected) return;
    setBusy("save");
    try {
      const res = await fetch(`/api/knowledge/${encodeURIComponent(selected)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage(`Saved ${selected} v${data.entry.version}`);
      setEditMode(false);
      await loadList();
      await loadUpdates();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="py-20 text-center text-sm text-[var(--color-text)]">Loading knowledge base…</p>;
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--color-text)]">Knowledge files</h2>
          <button
            type="button"
            disabled={busy === "all"}
            onClick={() => runUpdate()}
            className="rounded-md bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] disabled:opacity-50"
          >
            {busy === "all" ? "Updating…" : "Update all"}
          </button>
        </div>

        {(["ux_rules", "design_framework", "ia"] as const).map((cat) => (
          <div key={cat}>
            <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-text)]">
              {cat === "ux_rules"
                ? "UX Rules"
                : cat === "design_framework"
                  ? "Design Frameworks"
                  : "Information Architecture"}
            </p>
            <ul className="space-y-1">
              {(cat === "ux_rules"
                ? grouped.ux
                : cat === "design_framework"
                  ? grouped.fw
                  : grouped.ia
              ).map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => loadEntry(entry.file_name)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selected === entry.file_name
                        ? "bg-[var(--color-bg)] text-[var(--color-bg)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span className="block font-medium">{entry.title}</span>
                    <span className="text-xs text-[var(--color-text)]">
                      v{entry.version} · {formatDate(entry.last_updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wider text-[var(--color-text)]">Update history</h3>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-xs text-[var(--color-text)]">
            {updates.map((u) => (
              <li key={u.id} className="rounded border border-[var(--color-text)] p-2">
                <p className="text-[var(--color-text)]">{u.file_name}</p>
                <p>
                  v{u.previous_version ?? "?"} → v{u.new_version} · {u.update_source}
                </p>
                <p className="text-[var(--color-text)]">{formatDate(u.updated_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="min-h-[70vh] rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
        {!selected ? (
          <p className="py-20 text-center text-sm text-[var(--color-text)]">
            Select a file to view content, compare versions, or edit.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[var(--color-text)] pb-4">
              <h2 className="text-lg font-medium text-[var(--color-bg)]">{selected}</h2>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => runUpdate(selected)}
                className="rounded-md border border-[var(--color-text)] px-3 py-1.5 text-xs text-[var(--color-text)] disabled:opacity-50"
              >
                {busy === selected ? "Researching…" : "Update now"}
              </button>
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className="rounded-md border border-[var(--color-text)] px-3 py-1.5 text-xs text-[var(--color-text)]"
              >
                {editMode ? "Preview" : "Manual edit"}
              </button>
              <button
                type="button"
                onClick={() => setShowDiff((v) => !v)}
                className="rounded-md border border-[var(--color-text)] px-3 py-1.5 text-xs text-[var(--color-text)]"
              >
                {showDiff ? "Hide diff" : "Compare versions"}
              </button>
              {editMode && (
                <button
                  type="button"
                  disabled={busy === "save"}
                  onClick={saveManual}
                  className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-bg)] disabled:opacity-50"
                >
                  {busy === "save" ? "Saving…" : "Save"}
                </button>
              )}
            </div>

            {message && (
              <p className="mb-3 rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]">
                {message}
              </p>
            )}

            {showDiff ? (
              <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--color-text)] p-4 text-xs leading-relaxed text-[var(--color-text)]">
                {simpleDiff(previousContent, content).join("\n")}
              </pre>
            ) : editMode ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-[65vh] w-full resize-none rounded-lg border border-[var(--color-text)] bg-[var(--color-text)] p-4 font-mono text-xs leading-relaxed text-[var(--color-text)] outline-none focus:border-[var(--color-text)]"
              />
            ) : (
              <article className="prose prose-invert max-w-none prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text)] prose-li:text-[var(--color-text)] prose-a:text-[var(--color-accent)] max-h-[65vh] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                {content}
              </article>
            )}
          </>
        )}
      </section>
    </div>
  );
}
