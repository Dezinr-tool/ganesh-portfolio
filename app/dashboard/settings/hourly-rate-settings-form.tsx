"use client";

import { useEffect, useState } from "react";
import { inputClassName } from "../_lib/invoices";

export function HourlyRateSettingsForm() {
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hourlyRate === "number") {
          setHourlyRate(String(data.hourlyRate));
        }
      })
      .catch(() => setError("Failed to load hourly rate."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const parsed = Number(hourlyRate);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid hourly rate.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: parsed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save hourly rate.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Failed to save hourly rate.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="hourlyRate" className="mb-1.5 block text-sm text-neutral-300">
          Default hourly rate (₹)
        </label>
        <input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          value={hourlyRate}
          onChange={(e) => {
            setHourlyRate(e.target.value);
            setSuccess(false);
          }}
          className={inputClassName}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-emerald-400">Hourly rate saved.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save hourly rate"}
      </button>
    </div>
  );
}
