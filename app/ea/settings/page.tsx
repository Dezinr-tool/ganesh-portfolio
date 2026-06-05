"use client";

import { FormEvent, useEffect, useState } from "react";
import { EANav } from "../_components/ea-nav";
import { saveEASettingsClient, useEASettings } from "../_components/use-ea-settings";
import { buildEAPreview, DEFAULT_EA_NAME } from "@/lib/ea-settings-helpers";

export default function EASettingsPage() {
  const { eaName, loading } = useEASettings();
  const [name, setName] = useState(DEFAULT_EA_NAME);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) setName(eaName);
  }, [eaName, loading]);

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
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Max"
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
        </form>
      </main>
    </div>
  );
}
