"use client";

import { useCallback, useMemo, useState } from "react";
import { WireframeRenderer } from "./wireframe-renderer";
import type { WireframeScreen, WireframeScreenSpec } from "@/lib/wireframe/types";
import { SHADCN_COMPONENTS } from "@/lib/wireframe/types";
import { replaceComponent, specToJsx } from "@/lib/wireframe/jsx-export";

function toFileName(screenName: string): string {
  const base = screenName
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || "screen"}.tsx`;
}

function downloadBlob(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function WireframeOutputView({
  screens: initialScreens,
  sessionId,
  onScreensChange,
}: {
  screens: WireframeScreen[];
  sessionId: string;
  onScreensChange?: (screens: WireframeScreen[]) => void;
}) {
  const [screens, setScreens] = useState(initialScreens);
  const [index, setIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [exporting, setExporting] = useState(false);

  const current = screens[index];

  const updateScreen = useCallback(
    (screenName: string, spec: WireframeScreenSpec, jsxCode: string) => {
      setScreens((prev) => {
        const next = prev.map((s) =>
          s.screen_name === screenName ? { ...s, spec, jsx_code: jsxCode } : s,
        );
        onScreensChange?.(next);
        return next;
      });
    },
    [onScreensChange],
  );

  const handleSelectElement = useCallback((id: string, component: string) => {
    setSelectedElementId(id);
    setSelectedComponent(component);
  }, []);

  const handleReplaceComponent = useCallback(
    (newComponent: string) => {
      if (!current || !selectedElementId) return;
      const nextSpec = replaceComponent(current.spec, selectedElementId, newComponent);
      const nextJsx = specToJsx(nextSpec);
      updateScreen(current.screen_name, nextSpec, nextJsx);
      setSelectedComponent(newComponent);
    },
    [current, selectedElementId, updateScreen],
  );

  const handleCopyJsx = useCallback(async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.jsx_code);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Copy failed");
    }
  }, [current]);

  const handleDownloadJsx = useCallback(() => {
    if (!current) return;
    downloadBlob(toFileName(current.screen_name), current.jsx_code, "text/typescript");
  }, [current]);

  const handleDownloadZip = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/wireframe/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, format: "zip" }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wireframes-${sessionId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      for (const screen of screens) {
        downloadBlob(toFileName(screen.screen_name), screen.jsx_code, "text/typescript");
      }
    } finally {
      setExporting(false);
    }
  }, [screens, sessionId]);

  const annotations = useMemo(
    () => current?.spec.annotations ?? current?.annotations ?? [],
    [current],
  );

  if (!current) {
    return (
      <div className="p-8 text-center text-sm text-[var(--color-text)]">
        No wireframes generated yet.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="border-b border-[var(--color-text)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">
              {current.screen_name}
            </h1>
            <p className="text-sm text-[var(--color-text)]">
              Screen {index + 1} of {screens.length}
              {current.spec.description ? ` · ${current.spec.description}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => i - 1);
                setSelectedElementId(null);
                setSelectedComponent(null);
              }}
              className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={index >= screens.length - 1}
              onClick={() => {
                setIndex((i) => i + 1);
                setSelectedElementId(null);
                setSelectedComponent(null);
              }}
              className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg)] disabled:opacity-40"
            >
              Next →
            </button>
            <span className="mx-1 h-5 w-px bg-[var(--color-bg)]" />
            <button
              type="button"
              onClick={() => void handleCopyJsx()}
              className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
            >
              {copyStatus || "Copy JSX"}
            </button>
            <button
              type="button"
              onClick={handleDownloadJsx}
              className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
            >
              Download JSX
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void handleDownloadZip()}
              className="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-bg)] transition hover:bg-[var(--color-bg)] disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Download ZIP"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <WireframeRenderer
            elements={current.spec.elements}
            layout={current.spec.layout}
            onSelectElement={handleSelectElement}
            selectedElementId={selectedElementId}
          />

          {selectedElementId ? (
            <div className="mt-4 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Selected: {selectedComponent}
              </p>
              <label className="mt-3 block text-xs font-medium text-[var(--color-text)]">
                Replace with…
              </label>
              <select
                value={selectedComponent ?? ""}
                onChange={(e) => handleReplaceComponent(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]"
              >
                {SHADCN_COMPONENTS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[var(--color-text)]">
              Click any element to inspect or replace its component.
            </p>
          )}
        </div>

        <aside className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Annotations</h2>
          <p className="mt-1 text-xs text-[var(--color-text)]">
            UX notes and audit findings for this screen.
          </p>

          {annotations.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text)]">No annotations for this screen.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {annotations.map((ann, i) => (
                <li
                  key={`${ann.element_id}-${i}`}
                  className={`rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-3 text-sm ${
                    selectedElementId === ann.element_id ? "ring-2 ring-[var(--color-accent)]" : ""
                  }`}
                >
                  {ann.shadcn_component ? (
                    <p className="text-xs font-medium text-[var(--color-text)]">
                      {ann.shadcn_component}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[var(--color-text)]">{ann.note}</p>
                  {ann.ux_rule ? (
                    <p className="mt-2 text-xs text-[var(--color-text)]">Rule: {ann.ux_rule}</p>
                  ) : null}
                  {ann.audit_finding ? (
                    <p className="mt-1 text-xs text-[var(--color-accent)]">
                      Audit: {ann.audit_finding}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
