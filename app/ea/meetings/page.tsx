"use client";

import { useState } from "react";
import { EANav } from "../_components/ea-nav";
import { useEASettings } from "../_components/use-ea-settings";

type ProcessedMeeting = {
  summary: string;
  actionItems: string[];
  decisions: string[];
};

export default function EAMeetingsPage() {
  const { eaName } = useEASettings();
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<ProcessedMeeting | null>(null);

  async function handleProcess() {
    if (!notes.trim()) {
      setError("Please add meeting notes or a transcript.");
      return;
    }

    setError("");
    setSaved(false);
    setProcessing(true);

    try {
      const res = await fetch("/api/ea/process-meeting", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, attendees, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to process meeting.");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to process meeting.");
    } finally {
      setProcessing(false);
    }
  }

  function handleSave() {
    if (!result) return;

    setSaving(true);
    try {
      const existing = JSON.parse(
        localStorage.getItem("ea_meetings") ?? "[]",
      ) as unknown[];

      existing.unshift({
        id: crypto.randomUUID(),
        title: title || "Untitled meeting",
        attendees,
        dateTime,
        notes,
        ...result,
        savedAt: new Date().toISOString(),
      });

      localStorage.setItem("ea_meetings", JSON.stringify(existing));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <EANav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-light text-white">Meetings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {eaName} processes notes into summaries and action items
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly design sync"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Attendees
            </label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Ganesh, Sarah, Mike"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Date & time
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">
              Meeting notes / transcript
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={10}
              placeholder="Paste your meeting notes or transcript here…"
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="button"
            onClick={handleProcess}
            disabled={processing}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {processing ? "Processing…" : "Process with AI"}
          </button>

          {result ? (
            <div className="space-y-6 border-t border-zinc-800 pt-8">
              <section>
                <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Summary
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  {result.summary}
                </p>
              </section>

              <section>
                <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Action Items
                </h2>
                <ul className="mt-3 space-y-2">
                  {result.actionItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-zinc-300 before:text-zinc-600 before:content-['·']"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Key Decisions
                </h2>
                <ul className="mt-3 space-y-2">
                  {result.decisions.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-zinc-300 before:text-zinc-600 before:content-['·']"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save meeting"}
                </button>
                {saved ? (
                  <span className="text-sm text-emerald-400">Saved</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
