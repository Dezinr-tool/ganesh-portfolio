"use client";

import { useMemo, useState } from "react";
import type { SessionAnalyticsSummary } from "@/lib/moodboard/analytics";
import { MoodboardNav } from "../../_components/moodboard-nav";

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

function formatAnswer(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value || "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "object" && value !== null && "text" in value) {
    const obj = value as { text?: string; files?: unknown[] };
    const parts = [obj.text?.trim()].filter(Boolean);
    if (obj.files?.length) parts.push(`${obj.files.length} file(s)`);
    return parts.join(" · ") || "—";
  }
  return String(value);
}

function EventTimeline({ events }: { events: SessionAnalyticsSummary["events"] }) {
  if (!events.length) {
    return <p className="text-sm text-zinc-500">No events recorded yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-zinc-200">{event.event_type}</span>
            <span className="text-xs text-zinc-500">{formatDate(event.created_at)}</span>
          </div>
          {event.question_key ? (
            <p className="mt-1 text-xs text-zinc-500">Question: {event.question_key}</p>
          ) : null}
          {event.duration_ms != null ? (
            <p className="mt-1 text-xs text-zinc-500">
              Duration: {formatDuration(event.duration_ms)}
            </p>
          ) : null}
          {Object.keys(event.payload).length > 0 ? (
            <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-2 text-xs text-zinc-400">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function SessionDetail({ summary }: { summary: SessionAnalyticsSummary }) {
  const { session, directions, events } = summary;
  const answerEntries = Object.entries(session.answers ?? {});

  return (
    <div className="space-y-8 border-t border-zinc-800 pt-6">
      <section>
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Questions & answers
        </h3>
        <div className="mt-3 space-y-3">
          {answerEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">No answers yet.</p>
          ) : (
            answerEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
              >
                <p className="text-xs uppercase tracking-wide text-zinc-500">{key}</p>
                <p className="mt-1 text-sm text-zinc-200">{formatAnswer(value)}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Generated directions ({directions.length})
        </h3>
        <div className="mt-3 space-y-4">
          {directions.length === 0 && session.generated_directions?.length ? (
            session.generated_directions.map((dir) => (
              <div
                key={dir.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <p className="font-medium text-zinc-100">
                  {dir.directionIndex}. {dir.directionName}
                </p>
                <p className="mt-1 text-sm text-zinc-400">{dir.tagline}</p>
              </div>
            ))
          ) : (
            directions.map((dir) => (
              <div
                key={dir.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-100">
                    {dir.direction_index}. {dir.direction_name}
                  </p>
                  {dir.is_selected ? (
                    <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs text-green-400">
                      Selected
                    </span>
                  ) : null}
                  {dir.refined_count > 0 ? (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                      Refined ×{dir.refined_count}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Model: {dir.model_used ?? session.selected_model ?? "—"}
                </p>
                {dir.selected_output_sections?.length ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Sections: {dir.selected_output_sections.join(", ")}
                  </p>
                ) : null}
                {dir.refinement_notes ? (
                  <p className="mt-2 text-sm text-zinc-300">
                    Refinement: {dir.refinement_notes}
                  </p>
                ) : null}
                {dir.full_content ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-zinc-400">
                      Full direction JSON
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/40 p-2 text-xs text-zinc-500">
                      {JSON.stringify(dir.full_content, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Event journey
        </h3>
        <div className="mt-3">
          <EventTimeline events={events} />
        </div>
      </section>
    </div>
  );
}

export function SessionsDashboard({
  sessions,
}: {
  sessions: SessionAnalyticsSummary[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const brand = s.session.brand_name?.toLowerCase() ?? "";
      const id = s.session.session_id.toLowerCase();
      return brand.includes(q) || id.includes(q);
    });
  }, [query, sessions]);

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

        <div className="mt-8 space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500">
              No sessions match your search.
            </p>
          ) : (
            filtered.map((summary) => {
              const expanded = expandedId === summary.session.session_id;
              return (
                <article
                  key={summary.session.session_id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : summary.session.session_id)
                    }
                    className="flex w-full flex-col gap-3 px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {summary.session.brand_name || "Untitled brand"}
                      </p>
                      <p className="mt-1 font-mono text-xs text-zinc-500">
                        {summary.session.session_id}
                      </p>
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
                      {summary.session.selected_direction ? (
                        <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-green-400">
                          → {summary.session.selected_direction}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-zinc-500 sm:text-right">
                      {formatDate(summary.session.updated_at)}
                    </p>
                  </button>
                  {expanded ? (
                    <div className="px-4 pb-4">
                      <SessionDetail summary={summary} />
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
