"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { IaOutput } from "@/lib/ia/types";
import { iaToJsonExport, iaToMarkdown } from "@/lib/ia/markdown";
import { SitemapTree } from "./sitemap-tree";

type IaOutputViewProps = {
  output: IaOutput;
  sessionId: string;
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
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
            <p className="text-sm font-medium text-zinc-900">{item.label}</p>
            <p className="mt-0.5 text-xs text-zinc-600">{item.purpose}</p>
            <p className="mt-1 text-[11px] text-zinc-400">{item.access_level}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IaOutputView({ output, sessionId }: IaOutputViewProps) {
  const [copied, setCopied] = useState<"md" | "json" | null>(null);

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
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Information Architecture
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {output.product_overview.product_name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{output.product_overview.product_type}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyMarkdown()}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {copied === "md" ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            type="button"
            onClick={() => void copyJson()}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {copied === "json" ? "Copied!" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Download JSON
          </button>
          <Link
            href={`/wireframe/${sessionId}`}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
          >
            Generate Wireframes →
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">1. Product Overview</h2>
        <p className="mt-2 text-sm text-zinc-600">{output.product_overview.primary_goal}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              User Types
            </h3>
            <ul className="mt-2 space-y-2">
              {output.product_overview.user_types.map((u) => (
                <li key={u.name} className="text-sm text-zinc-700">
                  <span className="font-medium">{u.name}</span>
                  {u.needs.length > 0 ? (
                    <span className="text-zinc-500"> — {u.needs.join("; ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Key Tasks
            </h3>
            <ul className="mt-2 list-inside list-disc text-sm text-zinc-700">
              {output.product_overview.key_tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">2. Navigation Structure</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <NavGroup title="Primary" items={output.navigation_structure.primary} />
          <NavGroup title="Secondary" items={output.navigation_structure.secondary} />
          <NavGroup title="Utility" items={output.navigation_structure.utility} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">3. Sitemap</h2>
        <div className="mt-4 rounded-xl border border-zinc-200 p-4">
          <SitemapTree nodes={output.sitemap} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">4. User Flows</h2>
        <div className="mt-4 space-y-6">
          {output.user_flows.map((flow) => (
            <div key={flow.id} className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">{flow.flow_name}</h3>
              <p className="mt-1 text-xs text-zinc-500">{flow.flow_goal}</p>
              <ol className="mt-4 space-y-2">
                {flow.steps.map((step) => (
                  <li key={step.step} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-zinc-800">{step.label}</p>
                      {step.screen ? (
                        <p className="text-xs text-zinc-500">→ {step.screen}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              {flow.decision_points.length > 0 ? (
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <p className="text-xs font-medium text-zinc-500">Decision points</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-zinc-600">
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
        <h2 className="text-lg font-semibold text-zinc-900">5. Content Hierarchy</h2>
        <div className="mt-4 space-y-4">
          {output.content_hierarchy.map((ch) => (
            <div key={ch.screen_name} className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">{ch.screen_name}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-zinc-500">Primary</p>
                  <p className="mt-1 text-xs text-zinc-700">{ch.primary.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-zinc-500">Secondary</p>
                  <p className="mt-1 text-xs text-zinc-700">{ch.secondary.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-zinc-500">Tertiary</p>
                  <p className="mt-1 text-xs text-zinc-700">{ch.tertiary.join(", ") || "—"}</p>
                </div>
              </div>
              {ch.key_actions.length > 0 ? (
                <p className="mt-2 text-xs text-zinc-600">
                  <span className="font-medium">Actions:</span> {ch.key_actions.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">6. Navigation Patterns</h2>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-900">
            {output.navigation_patterns.pattern}
          </p>
          <p className="mt-2 text-sm text-zinc-600">{output.navigation_patterns.rationale}</p>
        </div>
      </section>

      <section className="mt-10 pb-16">
        <h2 className="text-lg font-semibold text-zinc-900">7. IA Health Score</h2>
        <div className="mt-4 rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700">
              {avgScore}
            </div>
            <div className="flex-1">
              <div className="flex gap-4 text-sm">
                <span className="text-zinc-600">
                  Depth: <strong>{health_score.depth_score}</strong>/10
                </span>
                <span className="text-zinc-600">
                  Breadth: <strong>{health_score.breadth_score}</strong>/10
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{health_score.balance_assessment}</p>
            </div>
          </div>
          {health_score.recommendations.length > 0 ? (
            <ul className="mt-4 list-inside list-disc border-t border-zinc-100 pt-4 text-sm text-zinc-600">
              {health_score.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}
