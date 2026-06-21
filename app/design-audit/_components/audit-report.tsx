"use client";

import { useState } from "react";
import {
  EA_BTN_PRIMARY,
  EA_BTN_SECONDARY,
  EA_CARD,
  EA_CARD_PADDED,
} from "@/app/ea/_components/ea-ui";
import type { DesignAuditResult, DimensionStatus } from "@/lib/design-audit/types";
import {
  ALL_DIMENSION_KEYS,
  DIMENSION_LABELS,
} from "@/lib/design-audit/types";

function statusLabel(status: DimensionStatus): string {
  if (status === "good") return "✅ Strong";
  if (status === "needs_work") return "⚠️ Needs Work";
  return "❌ Critical";
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-[var(--color-accent)]";
  if (score >= 5) return "text-[var(--color-accent)]";
  return "text-[var(--color-accent)]";
}

function scoreBg(score: number): string {
  if (score >= 7) return "border-[var(--color-accent)] bg-[var(--color-accent)]";
  if (score >= 5) return "border-[var(--color-accent)] bg-[var(--color-accent)]";
  return "border-[var(--color-accent)] bg-[var(--color-accent)]";
}

function barColor(score: number): string {
  if (score >= 7) return "bg-[var(--color-accent)]";
  if (score >= 5) return "bg-[var(--color-accent)]";
  return "bg-[var(--color-accent)]";
}

function effortLabel(effort?: string): string {
  if (effort === "quick") return "Quick Fix";
  if (effort === "significant") return "Significant Work";
  return "Medium";
}

function ScoreBarChart({ result }: { result: DesignAuditResult }) {
  return (
    <div className="space-y-2">
      {ALL_DIMENSION_KEYS.map((key) => {
        const dim = result.dimensions[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[10px] text-[var(--color-text)]">
              {DIMENSION_LABELS[key]}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg)]">
              <div
                className={`h-full rounded-full transition-all ${barColor(dim.score)}`}
                style={{ width: `${dim.score * 10}%` }}
              />
            </div>
            <span className={`w-8 text-right text-xs ${scoreColor(dim.score)}`}>
              {dim.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DimensionSection({
  dimensionKey,
  result,
}: {
  dimensionKey: (typeof ALL_DIMENSION_KEYS)[number];
  result: DesignAuditResult["dimensions"][(typeof ALL_DIMENSION_KEYS)[number]];
}) {
  const [open, setOpen] = useState(result.status !== "good");

  return (
    <section className={`rounded-xl border ${scoreBg(result.score)}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-medium text-[var(--color-bg)]">
            {DIMENSION_LABELS[dimensionKey]}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-text)]">
            {statusLabel(result.status)} · {effortLabel(result.effort_estimate)}
          </p>
        </div>
        <span className={`text-2xl font-light ${scoreColor(result.score)}`}>
          {result.score}/10
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[var(--color-text)] px-5 pb-5 pt-4 text-sm">
          {result.working.length > 0 ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-text)]">
                What&apos;s working
              </p>
              <ul className="space-y-1 text-[var(--color-text)]">
                {result.working.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.issues.length > 0 ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-text)]">
                Issues found
              </p>
              <ul className="space-y-1 text-[var(--color-text)]">
                {result.issues.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.fixes.length > 0 ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--color-text)]">
                How to fix
              </p>
              <ul className="space-y-1 text-[var(--color-text)]">
                {result.fixes.map((item) => (
                  <li key={item}>→ {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function AuditReportView({
  result,
  previewUrl,
  onCopyMarkdown,
  onDownloadPdf,
  eaSaved,
}: {
  result: DesignAuditResult;
  previewUrl?: string | null;
  onCopyMarkdown: () => void;
  onDownloadPdf: () => void;
  eaSaved?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-6 border-b border-[var(--color-text)] bg-[var(--color-text)]/95 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text)]">
              Overall score
            </p>
            <p className={`text-5xl font-light ${scoreColor(result.overall_score)}`}>
              {result.overall_score}
              <span className="text-2xl text-[var(--color-text)]">/10</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyMarkdown}
              className={`text-xs ${EA_BTN_SECONDARY}`}
            >
              Copy full report as markdown
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className={`text-xs ${EA_BTN_PRIMARY}`}
            >
              Download PDF
            </button>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text)]">
          {result.summary}
        </p>
        {eaSaved ? (
          <p className="mt-2 text-xs text-[var(--color-text)]">
            This audit has been saved to your EA intelligence
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-6">
          <div className={`${EA_CARD_PADDED}`}>
            <h3 className="mb-4 text-sm font-medium text-[var(--color-text)]">Score breakdown</h3>
            <ScoreBarChart result={result} />
          </div>

          <div className={EA_CARD_PADDED}>
            <h3 className="text-sm font-medium text-[var(--color-text)]">Priority issues</h3>
            {result.priority_issues.critical.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-[var(--color-accent)]">🔴 Critical — fix immediately</p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--color-text)]">
                  {result.priority_issues.critical.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.priority_issues.important.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-[var(--color-accent)]">🟡 Important — fix in next sprint</p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--color-text)]">
                  {result.priority_issues.important.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.priority_issues.nice_to_have.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-[var(--color-accent)]">🟢 Polish — nice to have</p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--color-text)]">
                  {result.priority_issues.nice_to_have.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {result.annotated_issues.length > 0 ? (
            <div className={EA_CARD_PADDED}>
              <h3 className="text-sm font-medium text-[var(--color-text)]">Annotated callouts</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text)]">
                {result.annotated_issues.map((item) => (
                  <li key={item} className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]/30 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-text)]">Dimension breakdown</h3>
            {ALL_DIMENSION_KEYS.map((key) => (
              <DimensionSection
                key={key}
                dimensionKey={key}
                result={result.dimensions[key]}
              />
            ))}
          </div>
        </div>

        {previewUrl ? (
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className={`${EA_CARD} p-4`}>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                Original
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Audit subject"
                className="max-h-[70vh] w-full rounded-lg border border-[var(--color-text)] object-contain object-top"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
