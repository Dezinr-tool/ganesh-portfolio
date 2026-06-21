"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUDIT_DEFAULT_REASON,
  AUDIT_MODELS,
  auditModelTagClass,
  getAuditModel,
  getAuditModelReason,
} from "@/lib/design-audit/models";
import type { AuditModelId } from "@/lib/design-audit/types";

type AuditModelSelectorProps = {
  modelId: AuditModelId;
  onModelChange: (id: AuditModelId) => void;
  /** Compact trigger for pre-confirmation ("Change model") */
  compact?: boolean;
  /** Hide the reason line below the trigger */
  hideReason?: boolean;
  disabled?: boolean;
};

export function AuditModelSelector({
  modelId,
  onModelChange,
  compact = false,
  hideReason = false,
  disabled = false,
}: AuditModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<AuditModelId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = getAuditModel(modelId);
  const hovered = hoveredId ? getAuditModel(hoveredId) : null;
  const reason = getAuditModelReason(modelId);

  const close = useCallback(() => {
    setOpen(false);
    setHoveredId(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const tooltipText = hovered?.tooltip ?? selected.tooltip;

  return (
    <div ref={rootRef} className="relative">
      {compact ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-[var(--color-text)] underline-offset-2 transition hover:text-[var(--color-text)] hover:underline disabled:opacity-50"
        >
          Change model ↓
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-text)] transition hover:text-[var(--color-text)] disabled:opacity-50"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span>
            {selected.shortLabel}
            {selected.recommended ? " ⭐" : ""}
          </span>
          <span className="text-[10px] text-[var(--color-text)]">{open ? "∧" : "∨"}</span>
        </button>
      )}

      {!hideReason && !compact ? (
        <p className="mt-1.5 max-w-md text-[11px] leading-relaxed text-[var(--color-text)]">
          {modelId === "claude-sonnet" ? AUDIT_DEFAULT_REASON : reason}
        </p>
      ) : null}

      {open ? (
        <div
          role="listbox"
          aria-label="Select model for audit"
          className={`absolute z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-xl border border-[var(--color-text)] bg-[var(--color-text)] shadow-xl ${
            compact ? "right-0" : "left-0"
          }`}
        >
          <div className="border-b border-[var(--color-text)] px-3 py-2">
            <p className="text-xs font-medium text-[var(--color-text)]">Select Model for Audit</p>
          </div>

          <ul className="max-h-[min(60vh,20rem)] overflow-y-auto py-1">
            {AUDIT_MODELS.map((m) => {
              const active = m.id === modelId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    title={m.tooltip}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(m.id)}
                    onBlur={() => setHoveredId(null)}
                    onClick={() => {
                      onModelChange(m.id);
                      close();
                    }}
                    className={`w-full px-3 py-2.5 text-left transition ${
                      active ? "bg-[var(--color-bg)]/[0.06]" : "hover:bg-[var(--color-bg)]/[0.04]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[var(--color-text)]">
                        {m.recommended ? "⭐ " : ""}
                        {m.label}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${auditModelTagClass(m.tag)}`}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-text)]">{m.description}</p>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-[var(--color-text)] px-3 py-2">
            <p className="text-[11px] leading-relaxed text-[var(--color-text)]">{tooltipText}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AuditModelConfirmLine({
  modelId,
  onModelChange,
  disabled,
}: {
  modelId: AuditModelId;
  onModelChange: (id: AuditModelId) => void;
  disabled?: boolean;
}) {
  const selected = getAuditModel(modelId);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]/40 px-3 py-2.5">
      <p className="text-sm text-[var(--color-text)]">
        Running audit with:{" "}
        <span className="font-medium text-[var(--color-bg)]">
          {selected.label}
          {selected.recommended ? " ⭐" : ""}
        </span>
      </p>
      <AuditModelSelector
        modelId={modelId}
        onModelChange={onModelChange}
        compact
        hideReason
        disabled={disabled}
      />
    </div>
  );
}
