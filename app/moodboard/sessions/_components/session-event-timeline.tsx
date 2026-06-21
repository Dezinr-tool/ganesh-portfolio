import type { SessionAnalyticsSummary } from "@/lib/moodboard/analytics";

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

export function SessionEventTimeline({
  events,
}: {
  events: SessionAnalyticsSummary["events"];
}) {
  if (!events.length) {
    return <p className="text-sm text-[var(--color-text)]">No events recorded yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]/60 px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-[var(--color-text)]">{event.event_type}</span>
            <span className="text-xs text-[var(--color-text)]">{formatDate(event.created_at)}</span>
          </div>
          {event.question_key ? (
            <p className="mt-1 text-xs text-[var(--color-text)]">Question: {event.question_key}</p>
          ) : null}
          {event.duration_ms != null ? (
            <p className="mt-1 text-xs text-[var(--color-text)]">
              Duration: {formatDuration(event.duration_ms)}
            </p>
          ) : null}
          {Object.keys(event.payload).length > 0 ? (
            <pre className="mt-2 overflow-x-auto rounded bg-[var(--color-text)]/40 p-2 text-xs text-[var(--color-text)]">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
