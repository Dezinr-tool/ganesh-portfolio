import Link from "next/link";
import type { SessionAnalyticsSummary } from "@/lib/moodboard/analytics";
import { resolveSessionDirections } from "@/lib/moodboard/resolve-session-directions";
import { MoodboardNav } from "../../_components/moodboard-nav";
import { DirectionPreviewCard } from "./direction-preview-card";
import { SessionAnswersSection } from "./session-answers-section";
import { SessionEventTimeline } from "./session-event-timeline";

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

function formatStatus(status: string) {
  if (status === "complete") return "Completed";
  if (status === "generating") return "Generating";
  if (status === "error") return "Error";
  return "In progress";
}

function formatModel(model: string | null | undefined) {
  if (!model) return "—";
  return model.replace(/^claude-/, "Claude ").replace(/-/g, " ");
}

export function SessionDetailView({ summary }: { summary: SessionAnalyticsSummary }) {
  const { session, timeSpentMs, events } = summary;
  const directions = resolveSessionDirections(summary);
  const modelUsed =
    session.selected_model ?? directions.find((d) => d.modelUsed)?.modelUsed ?? null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <MoodboardNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/moodboard/sessions"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← All sessions
        </Link>

        <header className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
          <h1 className="text-2xl font-light text-white">
            {session.brand_name || "Untitled brand"}
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{session.session_id}</p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Started</dt>
              <dd className="mt-1 text-sm text-zinc-200">{formatDate(session.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Last updated</dt>
              <dd className="mt-1 text-sm text-zinc-200">{formatDate(session.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Time spent</dt>
              <dd className="mt-1 text-sm text-zinc-200">{formatDuration(timeSpentMs)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Model used</dt>
              <dd className="mt-1 text-sm text-zinc-200">{formatModel(modelUsed)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Generation</dt>
              <dd className="mt-1 text-sm text-zinc-200">
                {session.generation_status === "completed"
                  ? "Completed"
                  : session.generation_status ?? "Not started"}
                {session.generated_at
                  ? ` · ${formatDate(session.generated_at)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Session status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    session.status === "complete"
                      ? "bg-green-500/15 text-green-400"
                      : session.status === "error"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {formatStatus(session.status)}
                </span>
              </dd>
            </div>
            {session.selected_direction ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Selected direction
                </dt>
                <dd className="mt-1 text-sm text-green-400">{session.selected_direction}</dd>
              </div>
            ) : null}
          </dl>
        </header>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Generated moodboard directions
          </h2>

          {directions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500">
              Moodboard not generated yet — session still in progress
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {directions.map((dir) => (
                <DirectionPreviewCard key={dir.id} direction={dir} />
              ))}
            </div>
          )}
        </section>

        <SessionAnswersSection session={session} />

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Event journey
          </h2>
          <div className="mt-4">
            <SessionEventTimeline events={events} />
          </div>
        </section>
      </main>
    </div>
  );
}
