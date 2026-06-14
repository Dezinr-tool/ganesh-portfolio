"use client";

import { useCallback, useEffect, useState } from "react";
import { EANav } from "../_components/ea-nav";
import { useEASettings } from "../_components/use-ea-settings";

type FollowUp = {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  body: string;
  status: "draft" | "approved" | "sent";
  sentAt: string | null;
  createdAt: string;
  meetingTitle?: string | null;
};

function StatusBadge({ status }: { status: FollowUp["status"] }) {
  const styles = {
    draft: "bg-amber-500/10 text-amber-400",
    approved: "bg-sky-500/10 text-sky-400",
    sent: "bg-emerald-500/10 text-emerald-400",
  } as const;

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ReviewModal({
  followup,
  onClose,
  onSaved,
}: {
  followup: FollowUp;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(followup.subject);
  const [body, setBody] = useState(followup.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/ea/followups/${followup.id}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send follow-up.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Failed to send follow-up.");
    } finally {
      setSaving(false);
    }
  }

  const readOnly = followup.status === "sent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-white">Review follow-up</h3>
            <p className="mt-1 text-sm text-zinc-500">
              To: {followup.recipientName ?? followup.recipientEmail}
              {followup.meetingTitle ? ` · ${followup.meetingTitle}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              readOnly={readOnly}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600 read-only:opacity-70"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              readOnly={readOnly}
              rows={12}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600 read-only:opacity-70"
            />
          </div>

          {followup.sentAt ? (
            <p className="text-xs text-emerald-400">
              Sent{" "}
              {new Date(followup.sentAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={saving}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? "Sending…" : "Approve & Send"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FollowUpSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: FollowUp[];
  onSelect: (item: FollowUp) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-medium text-white">{title}</h2>
        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
          {items.length}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-left transition-colors hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {item.recipientName ?? item.recipientEmail}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {item.subject}
                  </p>
                  {item.meetingTitle ? (
                    <p className="mt-1 text-xs text-zinc-600">
                      {item.meetingTitle}
                    </p>
                  ) : null}
                  {item.sentAt ? (
                    <p className="mt-2 text-xs text-emerald-400/80">
                      Sent{" "}
                      {new Date(item.sentAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : null}
                </div>
                <StatusBadge status={item.status} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EAFollowUpsPage() {
  const { eaName } = useEASettings();
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FollowUp | null>(null);

  const loadFollowups = useCallback(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ea/followups", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setFollowups(data.followups ?? []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  const drafts = followups.filter((f) => f.status === "draft");
  const approved = followups.filter((f) => f.status === "approved");
  const sent = followups.filter((f) => f.status === "sent");

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <EANav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-light text-white">Follow-ups</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {eaName} drafts post-meeting emails — review before sending
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading follow-ups…</p>
        ) : followups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
            <p className="text-sm text-zinc-400">No follow-ups yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Drafts are created automatically after meetings are processed
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <FollowUpSection
              title="Draft"
              items={drafts}
              onSelect={setSelected}
            />
            <FollowUpSection
              title="Approved"
              items={approved}
              onSelect={setSelected}
            />
            <FollowUpSection title="Sent" items={sent} onSelect={setSelected} />
          </div>
        )}
      </main>

      {selected ? (
        <ReviewModal
          followup={selected}
          onClose={() => setSelected(null)}
          onSaved={loadFollowups}
        />
      ) : null}
    </div>
  );
}
