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
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <MoodboardNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/moodboard/sessions"
          className="text-sm text-[var(--color-text)] transition hover:text-[var(--color-text)]"
        >
          ← All sessions
        </Link>

        <header className="mt-6 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)]/40 p-5">
          <h1 className="text-2xl font-light text-[var(--color-bg)]">
            {session.brand_name || "Untitled brand"}
          </h1>
          <p className="mt-1 font-mono text-xs text-[var(--color-text)]">{session.session_id}</p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">Started</dt>
              <dd className="mt-1 text-sm text-[var(--color-text)]">{formatDate(session.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">Last updated</dt>
              <dd className="mt-1 text-sm text-[var(--color-text)]">{formatDate(session.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">Time spent</dt>
              <dd className="mt-1 text-sm text-[var(--color-text)]">{formatDuration(timeSpentMs)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">Model used</dt>
              <dd className="mt-1 text-sm text-[var(--color-text)]">{formatModel(modelUsed)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">Generation</dt>
              <dd className="mt-1 text-sm text-[var(--color-text)]">
                {session.generation_status === "completed"
                  ? "Completed"
                  : session.generation_status ?? "Not started"}
                {session.generated_at
                  ? ` · ${formatDate(session.generated_at)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">Session status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    session.status === "complete"
                      ? "bg-[var(--color-accent)] text-[var(--color-accent)]"
                      : session.status === "error"
                        ? "bg-[var(--color-accent)] text-[var(--color-accent)]"
                        : "bg-[var(--color-bg)] text-[var(--color-text)]"
                  }`}
                >
                  {formatStatus(session.status)}
                </span>
              </dd>
            </div>
            {session.selected_direction ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--color-text)]">
                  Selected direction
                </dt>
                <dd className="mt-1 text-sm text-[var(--color-accent)]">{session.selected_direction}</dd>
              </div>
            ) : null}
          </dl>
        </header>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text)]">
            Generated moodboard directions
          </h2>

          {directions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)]/50 px-4 py-8 text-center text-sm text-[var(--color-text)]">
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
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text)]">
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
