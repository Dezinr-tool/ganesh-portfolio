"use client";

import { useEffect, useState } from "react";
import { EANav } from "../_components/ea-nav";

type IntelligenceItem = {
  id: string;
  category: string;
  insight: string;
  clientName: string | null;
  importance: number;
  sentiment: number | null;
  createdAt: string;
};

type ClientCard = {
  id: string;
  clientName: string;
  company: string | null;
  interactionCount: number;
  lastInteractionAt: string | null;
  preferences: string[];
};

type PatternItem = {
  description: string;
  evidenceCount: number;
};

type InsightsSummary = {
  narrative: string;
  stats: {
    totalInsights: number;
    clientCount: number;
    patternCount: number;
    avgSentiment: number | null;
    meetingSources: number;
  };
  patterns: PatternItem[];
  suggestions: string[];
  topLearnings: string[];
};

const CATEGORIES = [
  "design",
  "business",
  "strategy",
  "client",
  "leadership",
  "emotional",
  "learning",
] as const;

function sentimentLabel(score: number | null): string {
  if (score === null) return "Neutral";
  if (score >= 0.3) return "Positive";
  if (score <= -0.3) return "Negative";
  return "Mixed";
}

function sentimentColor(score: number | null): string {
  if (score === null) return "text-zinc-400";
  if (score >= 0.3) return "text-emerald-400";
  if (score <= -0.3) return "text-red-400";
  return "text-amber-400";
}

export default function EAInsightsPage() {
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [clients, setClients] = useState<ClientCard[]>([]);
  const [categoryItems, setCategoryItems] = useState<IntelligenceItem[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof CATEGORIES)[number]>("design");
  const [selectedClient, setSelectedClient] = useState<ClientCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [insightsRes, clientsRes, categoryRes] = await Promise.all([
          fetch("/api/ea/intelligence/insights", { credentials: "include" }),
          fetch("/api/ea/intelligence/clients", { credentials: "include" }),
          fetch(
            `/api/ea/intelligence?category=${activeTab}&limit=10&minImportance=5`,
            { credentials: "include" },
          ),
        ]);

        const insightsData = await insightsRes.json();
        const clientsData = await clientsRes.json();
        const categoryData = await categoryRes.json();

        if (cancelled) return;

        if (!insightsRes.ok) {
          setError(insightsData.error ?? "Failed to load insights.");
          return;
        }

        setSummary(insightsData);
        setClients(clientsRes.ok ? (clientsData.clients ?? []) : []);
        setCategoryItems(categoryRes.ok ? (categoryData.items ?? []) : []);
        setLastUpdated(new Date().toLocaleString("en-IN"));
      } catch {
        if (!cancelled) setError("Failed to load intelligence.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  async function handleGenerateSummary() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ea/intelligence/insights", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
        setLastUpdated(new Date().toLocaleString("en-IN"));
      }
    } finally {
      setGenerating(false);
    }
  }

  const stats = summary?.stats;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <EANav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-white">Intelligence</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {lastUpdated ? `Last updated ${lastUpdated}` : "Loading…"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleGenerateSummary()}
            disabled={generating}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate weekly summary"}
          </button>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading intelligence…</p>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Insights captured", value: stats?.totalInsights ?? 0 },
                { label: "Meetings analyzed", value: stats?.meetingSources ?? 0 },
                { label: "Clients profiled", value: stats?.clientCount ?? 0 },
                { label: "Patterns identified", value: stats?.patternCount ?? 0 },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <p className="text-2xl font-light text-white">{card.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{card.label}</p>
                </div>
              ))}
            </div>

            <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-300">Weekly narrative</h2>
                <span
                  className={`text-xs ${sentimentColor(stats?.avgSentiment ?? null)}`}
                >
                  Sentiment: {sentimentLabel(stats?.avgSentiment ?? null)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">
                {summary?.narrative ??
                  "Process meetings to generate your first intelligence summary."}
              </p>
              {summary?.topLearnings && summary.topLearnings.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Top learnings
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    {summary.topLearnings.map((learning) => (
                      <li key={learning}>• {learning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-sm font-medium text-zinc-300">By category</h2>
              <div className="mb-4 flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveTab(cat)}
                    className={`rounded-md px-3 py-1.5 text-xs capitalize transition ${
                      activeTab === cat
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {categoryItems.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No {activeTab} insights yet.
                  </p>
                ) : (
                  categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
                    >
                      <p className="text-sm text-zinc-200">{item.insight}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Importance {item.importance}
                        {item.clientName ? ` · ${item.clientName}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section>
                <h2 className="mb-3 text-sm font-medium text-zinc-300">
                  Client profiles
                </h2>
                {clients.length === 0 ? (
                  <p className="text-sm text-zinc-500">No clients profiled yet.</p>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() =>
                          setSelectedClient(
                            selectedClient?.id === client.id ? null : client,
                          )
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-left transition hover:border-zinc-700"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            {client.clientName}
                          </p>
                          <span className="text-xs text-zinc-500">
                            {client.interactionCount} interactions
                          </span>
                        </div>
                        {client.company && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {client.company}
                          </p>
                        )}
                        {selectedClient?.id === client.id && (
                          <div className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
                            {client.preferences.length > 0 && (
                              <p>Preferences: {client.preferences.join(", ")}</p>
                            )}
                            {client.lastInteractionAt && (
                              <p className="mt-1">
                                Last seen:{" "}
                                {new Date(client.lastInteractionAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 text-sm font-medium text-zinc-300">Patterns</h2>
                {!summary?.patterns?.length ? (
                  <p className="text-sm text-zinc-500">No patterns detected yet.</p>
                ) : (
                  <div className="space-y-2">
                    {summary.patterns.map((pattern) => (
                      <div
                        key={pattern.description}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
                      >
                        <p className="text-sm text-zinc-200">{pattern.description}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Seen {pattern.evidenceCount} time
                          {pattern.evidenceCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {summary?.suggestions && summary.suggestions.length > 0 && (
                  <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-900/20 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Suggested actions
                    </p>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      {summary.suggestions.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
