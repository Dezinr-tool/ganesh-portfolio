"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EANav } from "../../_components/ea-nav";

type ActionItem = {
  id: string;
  title: string;
  assignee: string | null;
  status: string;
};

type MeetingDetail = {
  id: string;
  title: string | null;
  status: string;
  rawTranscript: string | null;
  processedSummary: string | null;
  actionItems: string[];
  meetingUrl: string | null;
  scheduledAt: string | null;
};

export default function EAMeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const meetingId = params.id;
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadMeeting = useCallback(() => {
    if (!meetingId) return;

    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ea/meetings/${meetingId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to load meeting.");
          return;
        }
        setMeeting(data.meeting);
        setActionItems(data.actionItems ?? []);
        setTranscript(data.meeting.rawTranscript ?? "");
      } catch {
        setError("Failed to load meeting.");
      } finally {
        setLoading(false);
      }
    })();
  }, [meetingId]);

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  async function submitTranscript() {
    if (!meetingId || !transcript.trim()) return;
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/ea/meetings/${meetingId}/transcript`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save transcript.");
        return;
      }
      setMessage("Transcript saved. Processing started.");
      loadMeeting();
    } catch {
      setError("Failed to save transcript.");
    } finally {
      setSubmitting(false);
    }
  }

  async function simulate(action: "join" | "transcript" | "leave") {
    if (!meetingId) return;
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/ea/meetings/${meetingId}/simulate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: action === "transcript" ? transcript : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Simulation failed.");
        return;
      }
      setMessage(`Simulated: ${action}`);
      loadMeeting();
    } catch {
      setError("Simulation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !meeting) {
    return (
      <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
        <EANav />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-[var(--color-text)]">Loading…</p>
        </main>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
        <EANav />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-[var(--color-accent)]">{error || "Meeting not found."}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <EANav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/ea/meetings"
          className="text-sm text-[var(--color-text)] hover:text-[var(--color-text)]"
        >
          ← Back to meetings
        </Link>

        <h1 className="mt-4 text-2xl font-light text-[var(--color-bg)]">
          {meeting.title ?? "Untitled meeting"}
        </h1>
        <p className="mt-1 text-sm capitalize text-[var(--color-text)]">{meeting.status}</p>

        {meeting.processedSummary ? (
          <section className="mt-8 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text)]">
              Summary
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]">
              {meeting.processedSummary}
            </p>
          </section>
        ) : null}

        {actionItems.length > 0 ? (
          <section className="mt-6 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text)]">
              Action items
            </h2>
            <ul className="mt-3 space-y-2">
              {actionItems.map((item) => (
                <li key={item.id} className="text-sm text-[var(--color-text)]">
                  · {item.title}
                  {item.assignee ? ` (${item.assignee})` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text)]">
            Paste transcript
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text)]">
            Paste Zoom/Meet auto-captions or type notes manually
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            className="mt-3 w-full resize-y rounded-lg border border-[var(--color-text)] bg-[var(--color-text)] px-4 py-3 text-sm text-[var(--color-bg)] outline-none focus:border-[var(--color-text)]"
            placeholder="Paste transcript here…"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submitTranscript}
              disabled={submitting || !transcript.trim()}
              className="rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
            >
              Save & process
            </button>
            <button
              type="button"
              onClick={() => simulate("join")}
              disabled={submitting}
              className="rounded-lg border border-[var(--color-text)] px-3 py-2 text-xs text-[var(--color-text)]"
            >
              Simulate join
            </button>
            <button
              type="button"
              onClick={() => simulate("transcript")}
              disabled={submitting || !transcript.trim()}
              className="rounded-lg border border-[var(--color-text)] px-3 py-2 text-xs text-[var(--color-text)]"
            >
              Simulate transcript
            </button>
            <button
              type="button"
              onClick={() => simulate("leave")}
              disabled={submitting}
              className="rounded-lg border border-[var(--color-text)] px-3 py-2 text-xs text-[var(--color-text)]"
            >
              Simulate leave
            </button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-[var(--color-accent)]">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-[var(--color-accent)]">{message}</p> : null}
      </main>
    </div>
  );
}
