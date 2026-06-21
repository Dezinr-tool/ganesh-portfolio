"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { IaOutput, IaUxControversy, IaUxControversyDecision } from "@/lib/ia/types";
import { iaToJsonExport, iaToMarkdown } from "@/lib/ia/markdown";
import { SitemapTree } from "./sitemap-tree";

type IaOutputViewProps = {
  output: IaOutput;
  sessionId: string;
  initialDecisions?: Record<string, IaUxControversyDecision>;
};

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: IaOutput["navigation_structure"]["primary"];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2">
            <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text)]">{item.purpose}</p>
            <p className="mt-1 text-[11px] text-[var(--color-text)]">{item.access_level}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ControversyCard({
  controversy,
  decision,
  onApply,
  onReject,
  busy,
}: {
  controversy: IaUxControversy;
  decision?: IaUxControversyDecision;
  onApply: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const applied = decision?.decision === "applied";
  const rejected = decision?.decision === "rejected";

  return (
    <div className="rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-accent)]">
        🔥 {controversy.title}
      </p>
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold text-[var(--color-text)]">The Debate</p>
          <p className="mt-1 text-[var(--color-text)]">{controversy.debate}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--color-text)]">Research says</p>
          <p className="mt-1 text-[var(--color-text)]">{controversy.research}</p>
        </div>
        <div className="rounded-lg bg-[var(--color-accent)] px-3 py-2">
          <p className="text-xs font-semibold text-[var(--color-accent)]">For YOUR product</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-accent)]">{controversy.recommendation}</p>
          <p className="mt-1 text-xs text-[var(--color-accent)]">{controversy.rationale}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || applied}
          onClick={onApply}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
            applied
              ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
              : "border border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]"
          } disabled:opacity-60`}
        >
          {applied ? "Applied ✓" : "Apply this recommendation ✓"}
        </button>
        <button
          type="button"
          disabled={busy || rejected}
          onClick={onReject}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
            rejected
              ? "bg-[var(--color-bg)] text-[var(--color-text)]"
              : "border border-[var(--color-text)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          } disabled:opacity-60`}
        >
          {rejected ? "Rejected" : "Reject"}
        </button>
      </div>
    </div>
  );
}

export function IaOutputView({ output, sessionId, initialDecisions = {} }: IaOutputViewProps) {
  const [copied, setCopied] = useState<"md" | "json" | null>(null);
  const [decisions, setDecisions] =
    useState<Record<string, IaUxControversyDecision>>(initialDecisions);
  const [saving, setSaving] = useState(false);

  const controversies = output.ux_controversy_recommendations ?? [];

  const saveDecision = useCallback(
    async (controversy: IaUxControversy, decision: "applied" | "rejected") => {
      setSaving(true);
      const next = {
        ...decisions,
        [controversy.id]: {
          controversy_id: controversy.id,
          title: controversy.title,
          decision,
        },
      };
      setDecisions(next);
      try {
        await fetch("/api/ia/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, ux_controversy_decisions: next }),
        });
      } finally {
        setSaving(false);
      }
    },
    [decisions, sessionId],
  );

  const copyMarkdown = useCallback(async () => {
    await navigator.clipboard.writeText(iaToMarkdown(output));
    setCopied("md");
    setTimeout(() => setCopied(null), 2000);
  }, [output]);

  const copyJson = useCallback(async () => {
    await navigator.clipboard.writeText(iaToJsonExport(output));
    setCopied("json");
    setTimeout(() => setCopied(null), 2000);
  }, [output]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([iaToJsonExport(output)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.product_overview.product_name.replace(/\s+/g, "-").toLowerCase()}-ia.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const { health_score } = output;
  const avgScore = Math.round((health_score.depth_score + health_score.breadth_score) / 2);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-[var(--color-text)] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text)]">
            Information Architecture
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
            {output.product_overview.product_name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text)]">{output.product_overview.product_type}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyMarkdown()}
            className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
          >
            {copied === "md" ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            type="button"
            onClick={() => void copyJson()}
            className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
          >
            {copied === "json" ? "Copied!" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="rounded-lg border border-[var(--color-text)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
          >
            Download JSON
          </button>
          <Link
            href={`/wireframe/${sessionId}`}
            className="rounded-lg bg-[var(--color-bg)] px-4 py-1.5 text-xs font-medium text-[var(--color-bg)] transition hover:bg-[var(--color-bg)]"
          >
            Generate Wireframes →
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">1. Product Overview</h2>
        <p className="mt-2 text-sm text-[var(--color-text)]">{output.product_overview.primary_goal}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
              User Types
            </h3>
            <ul className="mt-2 space-y-2">
              {output.product_overview.user_types.map((u) => (
                <li key={u.name} className="text-sm text-[var(--color-text)]">
                  <span className="font-medium">{u.name}</span>
                  {u.needs.length > 0 ? (
                    <span className="text-[var(--color-text)]"> — {u.needs.join("; ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Key Tasks
            </h3>
            <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-text)]">
              {output.product_overview.key_tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">2. Navigation Structure</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <NavGroup title="Primary" items={output.navigation_structure.primary} />
          <NavGroup title="Secondary" items={output.navigation_structure.secondary} />
          <NavGroup title="Utility" items={output.navigation_structure.utility} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">3. Sitemap</h2>
        <div className="mt-4 rounded-xl border border-[var(--color-text)] p-4">
          <SitemapTree nodes={output.sitemap} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">4. User Flows</h2>
        <div className="mt-4 space-y-6">
          {output.user_flows.map((flow) => (
            <div key={flow.id} className="rounded-xl border border-[var(--color-text)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{flow.flow_name}</h3>
              <p className="mt-1 text-xs text-[var(--color-text)]">{flow.flow_goal}</p>
              <ol className="mt-4 space-y-2">
                {flow.steps.map((step) => (
                  <li key={step.step} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-xs font-medium text-[var(--color-text)]">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-[var(--color-text)]">{step.label}</p>
                      {step.screen ? (
                        <p className="text-xs text-[var(--color-text)]">→ {step.screen}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              {flow.decision_points.length > 0 ? (
                <div className="mt-3 border-t border-[var(--color-text)] pt-3">
                  <p className="text-xs font-medium text-[var(--color-text)]">Decision points</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-[var(--color-text)]">
                    {flow.decision_points.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">5. Content Hierarchy</h2>
        <div className="mt-4 space-y-4">
          {output.content_hierarchy.map((ch) => (
            <div key={ch.screen_name} className="rounded-xl border border-[var(--color-text)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{ch.screen_name}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[var(--color-text)]">Primary</p>
                  <p className="mt-1 text-xs text-[var(--color-text)]">{ch.primary.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[var(--color-text)]">Secondary</p>
                  <p className="mt-1 text-xs text-[var(--color-text)]">{ch.secondary.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[var(--color-text)]">Tertiary</p>
                  <p className="mt-1 text-xs text-[var(--color-text)]">{ch.tertiary.join(", ") || "—"}</p>
                </div>
              </div>
              {ch.key_actions.length > 0 ? (
                <p className="mt-2 text-xs text-[var(--color-text)]">
                  <span className="font-medium">Actions:</span> {ch.key_actions.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">6. Navigation Patterns</h2>
        <div className="mt-4 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {output.navigation_patterns.pattern}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text)]">{output.navigation_patterns.rationale}</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">7. IA Health Score</h2>
        <div className="mt-4 rounded-xl border border-[var(--color-text)] p-4">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-xl font-bold text-[var(--color-accent)]">
              {avgScore}
            </div>
            <div className="flex-1">
              <div className="flex gap-4 text-sm">
                <span className="text-[var(--color-text)]">
                  Depth: <strong>{health_score.depth_score}</strong>/10
                </span>
                <span className="text-[var(--color-text)]">
                  Breadth: <strong>{health_score.breadth_score}</strong>/10
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text)]">{health_score.balance_assessment}</p>
            </div>
          </div>
          {health_score.recommendations.length > 0 ? (
            <ul className="mt-4 list-inside list-disc border-t border-[var(--color-text)] pt-4 text-sm text-[var(--color-text)]">
              {health_score.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {controversies.length > 0 ? (
        <section className="mt-10 pb-16">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">8. UX Controversy Recommendations</h2>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            Evidence-based recommendations for key UX debates relevant to your product. Accepted
            recommendations will be applied in wireframe generation.
          </p>
          <div className="mt-6 space-y-4">
            {controversies.map((c) => (
              <ControversyCard
                key={c.id}
                controversy={c}
                decision={decisions[c.id]}
                busy={saving}
                onApply={() => void saveDecision(c, "applied")}
                onReject={() => void saveDecision(c, "rejected")}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="pb-16" />
      )}
    </div>
  );
}
