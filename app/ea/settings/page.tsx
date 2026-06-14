"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { EANav } from "../_components/ea-nav";
import { GoogleCalendarIntegration } from "../_components/google-calendar-integration";
import { saveEASettingsClient, useEASettings } from "../_components/use-ea-settings";
import { buildEAPreview, DEFAULT_EA_NAME } from "@/lib/ea-settings-helpers";

type MemoryItem = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
};

const MEMORY_CATEGORIES = [
  "preference",
  "fact",
  "instruction",
  "context",
  "meeting",
] as const;

export default function EASettingsPage() {
  const { eaName, loading } = useEASettings();
  const [draftName, setDraftName] = useState<string | null>(null);
  const name = draftName ?? eaName;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryError, setMemoryError] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [newCategory, setNewCategory] =
    useState<(typeof MEMORY_CATEGORIES)[number]>("context");
  const [addingMemory, setAddingMemory] = useState(false);

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarDisconnecting, setCalendarDisconnecting] = useState(false);
  const [calendarError, setCalendarError] = useState("");

  /*
  Billing disabled — Plan & Billing UI hidden:
  const [billing, setBilling] = useState<{
    plan: string;
    status: string;
    isOnTrial: boolean;
    trialEndsAt: string;
    messagesToday: number;
  } | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  */

  const loadMemories = useCallback(async () => {
    setMemoryLoading(true);
    setMemoryError("");
    try {
      const res = await fetch("/api/ea/memory?limit=100", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setMemoryError(data.error ?? "Failed to load memories.");
        return;
      }
      setMemories(Array.isArray(data.memories) ? data.memories : []);
    } catch {
      setMemoryError("Failed to load memories.");
    } finally {
      setMemoryLoading(false);
    }
  }, []);

  const loadCalendarStatus = useCallback(async () => {
    setCalendarLoading(true);
    setCalendarError("");
    try {
      const res = await fetch("/api/ea/calendar/status", {
        credentials: "include",
      });
      const data = await res.json();
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[ea/settings] calendar status check sessionId:",
          data.sessionId ?? "(missing)",
        );
      }
      if (!res.ok) {
        setCalendarError(data.error ?? "Failed to load calendar status.");
        return;
      }
      setCalendarConnected(Boolean(data.connected));
      setCalendarEmail(
        typeof data.email === "string" && data.email ? data.email : null,
      );
    } catch {
      setCalendarError("Failed to load calendar status.");
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMemories();
      void loadCalendarStatus();
      /*
      Billing disabled — billing status fetch commented out:
      void (async () => {
        try {
          const res = await fetch("/api/billing/status", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setBilling(data);
          }
        } catch {
          // legacy auth — no SaaS billing
        } finally {
          setBillingLoading(false);
        }
      })();
      */
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMemories, loadCalendarStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarResult = params.get("calendar");
    if (calendarResult !== "connected" && calendarResult !== "error") return;

    const timer = window.setTimeout(() => {
      void loadCalendarStatus();
      if (calendarResult === "error") {
        setCalendarError(
          "Google Calendar connection failed. Please try again.",
        );
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCalendarStatus]);

  const groupedMemories = useMemo(() => {
    const groups: Record<string, MemoryItem[]> = {};
    for (const memory of memories) {
      if (!groups[memory.category]) groups[memory.category] = [];
      groups[memory.category].push(memory);
    }
    return groups;
  }, [memories]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("EA name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await saveEASettingsClient(trimmed);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMemory(event: FormEvent) {
    event.preventDefault();
    const trimmed = newMemory.trim();
    if (!trimmed) return;

    setAddingMemory(true);
    setMemoryError("");
    try {
      const res = await fetch("/api/ea/memory", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          category: newCategory,
          source: "manual",
          importance: 6,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMemoryError(data.error ?? "Failed to save memory.");
        return;
      }
      setNewMemory("");
      await loadMemories();
    } catch {
      setMemoryError("Failed to save memory.");
    } finally {
      setAddingMemory(false);
    }
  }

  async function handleDeleteMemory(id: string) {
    try {
      const res = await fetch(`/api/ea/memory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) await loadMemories();
    } catch {
      setMemoryError("Failed to delete memory.");
    }
  }

  async function handleClearMemories() {
    if (!confirm("Clear all saved memories? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/ea/memory", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setMemoryError(data.error ?? "Failed to clear memories.");
        return;
      }
      await loadMemories();
    } catch {
      setMemoryError("Failed to clear memories.");
    }
  }

  async function handleDisconnectCalendar() {
    if (
      !confirm(
        "Disconnect Google Calendar? Virtual EA will no longer sync your schedule.",
      )
    ) {
      return;
    }

    setCalendarDisconnecting(true);
    setCalendarError("");
    try {
      const res = await fetch("/api/ea/calendar/status", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setCalendarError(data.error ?? "Failed to disconnect calendar.");
        return;
      }
      setCalendarConnected(false);
      setCalendarEmail(null);
    } catch {
      setCalendarError("Failed to disconnect calendar.");
    } finally {
      setCalendarDisconnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <EANav />

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-light text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Personalize your executive assistant
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <label className="mb-1.5 block text-sm text-zinc-400">EA Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setDraftName(e.target.value);
              setSaved(false);
            }}
            placeholder="Virtual EA"
            disabled={loading || saving}
            className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-40"
          />

          <div className="mt-4 rounded-lg border border-zinc-800/80 bg-black/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Preview
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {buildEAPreview(name.trim() || DEFAULT_EA_NAME)}
            </p>
          </div>

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          {saved ? (
            <p className="mt-3 text-sm text-emerald-400">Settings saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || saving || !name.trim()}
            className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setError("");
              try {
                const res = await fetch("/api/ea/conversations/clear", {
                  method: "DELETE",
                  credentials: "include",
                });
                if (!res.ok) {
                  const data = await res.json();
                  setError(data.error ?? "Failed to clear history.");
                  return;
                }
                setSaved(false);
                setError("");
                alert("Chat history cleared.");
              } catch {
                setError("Failed to clear history.");
              }
            }}
            className="mt-3 block text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Clear chat history
          </button>
        </form>

        {/*
        Billing disabled — Plan & Billing section hidden:
        {billing ? (
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-medium text-white">Plan & Billing</h2>
            ...
            Upgrade to Starter / Pro / Manage billing buttons
          </section>
        ) : billingLoading ? null : (
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-medium text-white">Plan & Billing</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Sign in with an account at /login to manage billing.
            </p>
          </section>
        )}
        */}

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Memory</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Facts and preferences Virtual EA remembers about you
              </p>
            </div>
            {memories.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleClearMemories()}
                className="text-xs text-red-400 underline hover:text-red-300"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <form onSubmit={handleAddMemory} className="mb-6 space-y-3">
            <textarea
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              placeholder="Add something for Virtual EA to remember…"
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
            <div className="flex items-center gap-3">
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(
                    e.target.value as (typeof MEMORY_CATEGORIES)[number],
                  )
                }
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              >
                {MEMORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addingMemory || !newMemory.trim()}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {addingMemory ? "Adding…" : "Add memory"}
              </button>
            </div>
          </form>

          {memoryError ? (
            <p className="mb-4 text-sm text-red-400">{memoryError}</p>
          ) : null}

          {memoryLoading ? (
            <p className="text-sm text-zinc-500">Loading memories…</p>
          ) : memories.length === 0 ? (
            <p className="text-sm text-zinc-500">No memories saved yet.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMemories).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {category}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((memory) => (
                      <li
                        key={memory.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-black/40 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm text-zinc-200">{memory.content}</p>
                          <p className="mt-1 text-[10px] text-zinc-600">
                            {new Date(memory.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteMemory(memory.id)}
                          className="shrink-0 text-xs text-zinc-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-medium text-white">Integrations</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Connect your tools to Virtual EA
          </p>

          <div className="mt-4">
            <GoogleCalendarIntegration
              connected={calendarConnected}
              accountEmail={calendarEmail}
              loading={calendarLoading}
              disconnecting={calendarDisconnecting}
              error={calendarError}
              onDisconnect={() => void handleDisconnectCalendar()}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
