import type { MoodboardSession } from "@/lib/moodboard/db-types";

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

export function SessionAnswersSection({ session }: { session: MoodboardSession }) {
  const answerEntries = Object.entries(session.answers ?? {}).filter(
    ([key]) => !key.startsWith("_"),
  );

  if (answerEntries.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text)]">
        Intake & answers
      </h2>
      <div className="mt-4 space-y-3">
        {answerEntries.map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]/50 px-3 py-2"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-text)]">{key}</p>
            <p className="mt-1 text-sm text-[var(--color-text)]">{formatAnswer(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
