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
      <div className="min-h-screen bg-black text-zinc-100">
        <EANav />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-zinc-500">Loading…</p>
        </main>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-black text-zinc-100">
        <EANav />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-red-400">{error || "Meeting not found."}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <EANav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/ea/meetings"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to meetings
        </Link>

        <h1 className="mt-4 text-2xl font-light text-white">
          {meeting.title ?? "Untitled meeting"}
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">{meeting.status}</p>

        {meeting.processedSummary ? (
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Summary
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              {meeting.processedSummary}
            </p>
          </section>
        ) : null}

        {actionItems.length > 0 ? (
          <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Action items
            </h2>
            <ul className="mt-3 space-y-2">
              {actionItems.map((item) => (
                <li key={item.id} className="text-sm text-zinc-300">
                  · {item.title}
                  {item.assignee ? ` (${item.assignee})` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Paste transcript
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Paste Zoom/Meet auto-captions or type notes manually
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            className="mt-3 w-full resize-y rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
            placeholder="Paste transcript here…"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submitTranscript}
              disabled={submitting || !transcript.trim()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Save & process
            </button>
            <button
              type="button"
              onClick={() => simulate("join")}
              disabled={submitting}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
            >
              Simulate join
            </button>
            <button
              type="button"
              onClick={() => simulate("transcript")}
              disabled={submitting || !transcript.trim()}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
            >
              Simulate transcript
            </button>
            <button
              type="button"
              onClick={() => simulate("leave")}
              disabled={submitting}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
            >
              Simulate leave
            </button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
      </main>
    </div>
  );
}
