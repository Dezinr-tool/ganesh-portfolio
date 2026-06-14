"use client";

import { useState } from "react";
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
  if (score >= 7) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 7) return "border-emerald-500/30 bg-emerald-500/10";
  if (score >= 5) return "border-amber-500/30 bg-amber-500/10";
  return "border-red-500/30 bg-red-500/10";
}

function barColor(score: number): string {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
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
            <span className="w-28 shrink-0 truncate text-[10px] text-zinc-500">
              {DIMENSION_LABELS[key]}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
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
          <h3 className="text-sm font-medium text-white">
            {DIMENSION_LABELS[dimensionKey]}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {statusLabel(result.status)} · {effortLabel(result.effort_estimate)}
          </p>
        </div>
        <span className={`text-2xl font-light ${scoreColor(result.score)}`}>
          {result.score}/10
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-white/8 px-5 pb-5 pt-4 text-sm">
          {result.working.length > 0 ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                What&apos;s working
              </p>
              <ul className="space-y-1 text-zinc-300">
                {result.working.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.issues.length > 0 ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                Issues found
              </p>
              <ul className="space-y-1 text-zinc-300">
                {result.issues.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.fixes.length > 0 ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                How to fix
              </p>
              <ul className="space-y-1 text-zinc-300">
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
      <div className="sticky top-0 z-20 -mx-4 border-b border-white/8 bg-[#0d0d0d]/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Overall score
            </p>
            <p className={`text-5xl font-light ${scoreColor(result.overall_score)}`}>
              {result.overall_score}
              <span className="text-2xl text-zinc-500">/10</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyMarkdown}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/5"
            >
              Copy full report as markdown
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200"
            >
              Download PDF
            </button>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {result.summary}
        </p>
        {eaSaved ? (
          <p className="mt-2 text-xs text-sky-400">
            This audit has been saved to your EA intelligence
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
            <h3 className="mb-4 text-sm font-medium text-white">Score breakdown</h3>
            <ScoreBarChart result={result} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
            <h3 className="text-sm font-medium text-white">Priority issues</h3>
            {result.priority_issues.critical.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-red-400">🔴 Critical — fix immediately</p>
                <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                  {result.priority_issues.critical.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.priority_issues.important.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-amber-400">🟡 Important — fix in next sprint</p>
                <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                  {result.priority_issues.important.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.priority_issues.nice_to_have.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-emerald-400">🟢 Polish — nice to have</p>
                <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                  {result.priority_issues.nice_to_have.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {result.annotated_issues.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
              <h3 className="text-sm font-medium text-white">Annotated callouts</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {result.annotated_issues.map((item) => (
                  <li key={item} className="rounded-lg bg-black/40 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">Dimension breakdown</h3>
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
            <div className="rounded-2xl border border-white/10 bg-[#12121a] p-4">
              <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Original
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Audit subject"
                className="max-h-[70vh] w-full rounded-lg border border-white/8 object-contain object-top"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
