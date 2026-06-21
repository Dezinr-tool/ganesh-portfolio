"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EANav } from "../_components/ea-nav";
import { useEASettings } from "../_components/use-ea-settings";
import { platformLabel } from "@/lib/meeting-detector";

type Meeting = {
  id: string;
  title: string | null;
  meetingUrl: string | null;
  meetingPlatform: "google_meet" | "zoom" | "teams" | null;
  scheduledAt: string | null;
  status: string;
  processedSummary: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[var(--color-bg)] text-[var(--color-text)]",
    joining: "bg-[var(--color-accent)] text-[var(--color-accent)]",
    recording: "bg-[var(--color-accent)] text-[var(--color-accent)] animate-pulse",
    processing: "bg-[var(--color-accent)] text-[var(--color-accent)]",
    done: "bg-[var(--color-accent)] text-[var(--color-accent)]",
    failed: "bg-[var(--color-accent)] text-[var(--color-accent)]",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}

function formatWhen(iso: string | null): string {
  if (!iso) return "No time set";
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EAMeetingsPage() {
  const { eaName } = useEASettings();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  const loadMeetings = useCallback(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ea/meetings", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to load meetings.");
          return;
        }
        setMeetings(data.meetings ?? []);
        setError("");
      } catch {
        setError("Failed to load meetings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/ea/meetings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled meeting",
          meetingUrl: meetingUrl.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create meeting.");
        return;
      }

      setTitle("");
      setMeetingUrl("");
      setScheduledAt("");
      setShowForm(false);
      loadMeetings();
    } catch {
      setError("Failed to create meeting.");
    } finally {
      setCreating(false);
    }
  }

  const upcoming = meetings.filter(
    (m) => m.status !== "done" && m.status !== "failed",
  );
  const past = meetings.filter(
    (m) => m.status === "done" || m.status === "failed",
  );

  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <EANav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-[var(--color-bg)]">Meetings</h1>
            <p className="mt-1 text-sm text-[var(--color-text)]">
              {eaName} detects meetings from your calendar and processes transcripts
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            Add meeting
          </button>
        </div>

        {showForm ? (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5 space-y-4"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title"
              className="w-full rounded-lg border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-2.5 text-sm text-[var(--color-bg)] outline-none focus:border-[var(--color-text)]"
            />
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full rounded-lg border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-2.5 text-sm text-[var(--color-bg)] outline-none focus:border-[var(--color-text)]"
            />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-2.5 text-sm text-[var(--color-bg)] outline-none focus:border-[var(--color-text)]"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
            >
              {creating ? "Saving…" : "Save meeting"}
            </button>
          </form>
        ) : null}

        {error ? <p className="mb-4 text-sm text-[var(--color-accent)]">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-[var(--color-text)]">Loading meetings…</p>
        ) : meetings.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-8 text-center">
            <p className="text-sm text-[var(--color-text)]">
              No meetings yet. Virtual EA will detect them from your calendar.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text)]">
                  Upcoming
                </h2>
                <ul className="space-y-3">
                  {upcoming.map((meeting) => (
                    <MeetingRow key={meeting.id} meeting={meeting} />
                  ))}
                </ul>
              </section>
            ) : null}

            {past.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text)]">
                  Past
                </h2>
                <ul className="space-y-3">
                  {past.map((meeting) => (
                    <MeetingRow key={meeting.id} meeting={meeting} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

function platformIcon(platform: Meeting["meetingPlatform"]): string | null {
  if (!platform) return null;
  if (platform === "google_meet") return "🎥";
  if (platform === "zoom") return "📹";
  if (platform === "teams") return "💼";
  return null;
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const platform = meeting.meetingPlatform
    ? platformLabel(meeting.meetingPlatform)
    : null;
  const icon = platformIcon(meeting.meetingPlatform);

  return (
    <li className="rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-bg)]">
            {icon ? <span className="mr-1.5">{icon}</span> : null}
            {meeting.title ?? "Untitled meeting"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text)]">
            {formatWhen(meeting.scheduledAt)}
            {platform ? ` · ${platform}` : ""}
          </p>
        </div>
        <StatusBadge status={meeting.status} />
      </div>
      <div className="mt-3">
        {meeting.status === "done" ? (
          <Link
            href={`/ea/meetings/${meeting.id}`}
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            View summary →
          </Link>
        ) : (
          <Link
            href={`/ea/meetings/${meeting.id}`}
            className="text-sm text-[var(--color-text)] hover:text-[var(--color-text)]"
          >
            Open →
          </Link>
        )}
      </div>
    </li>
  );
}
