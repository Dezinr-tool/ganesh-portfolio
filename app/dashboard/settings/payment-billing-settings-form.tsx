"use client";

import { useEffect, useState } from "react";
import { inputClassName } from "../_lib/invoices";

type BillingFormState = {
  hourlyRate: string;
  upiId: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  panNumber: string;
};

const emptyForm: BillingFormState = {
  hourlyRate: "0",
  upiId: "",
  bankAccountHolder: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  panNumber: "",
};

export function PaymentBillingSettingsForm() {
  const [form, setForm] = useState<BillingFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          hourlyRate:
            typeof data.hourlyRate === "number" ? String(data.hourlyRate) : "0",
          upiId: data.upiId ?? "",
          bankAccountHolder: data.bankAccountHolder ?? "",
          bankName: data.bankName ?? "",
          bankAccountNumber: data.bankAccountNumber ?? "",
          bankIfsc: data.bankIfsc ?? "",
          panNumber: data.panNumber ?? "",
        });
      })
      .catch(() => setError("Failed to load payment settings."))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof BillingFormState>(
    field: K,
    value: BillingFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess(false);
  }

  async function handleSave() {
    const hourlyRate = Number(form.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
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
        body: JSON.stringify({
          hourlyRate,
          upiId: form.upiId,
          bankAccountHolder: form.bankAccountHolder,
          bankName: form.bankName,
          bankAccountNumber: form.bankAccountNumber,
          bankIfsc: form.bankIfsc,
          panNumber: form.panNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save payment settings.");
        return;
      }

      setForm({
        hourlyRate: String(data.hourlyRate ?? hourlyRate),
        upiId: data.upiId ?? form.upiId,
        bankAccountHolder: data.bankAccountHolder ?? form.bankAccountHolder,
        bankName: data.bankName ?? form.bankName,
        bankAccountNumber: data.bankAccountNumber ?? form.bankAccountNumber,
        bankIfsc: data.bankIfsc ?? form.bankIfsc,
        panNumber: data.panNumber ?? form.panNumber,
      });
      setSuccess(true);
    } catch {
      setError("Failed to save payment settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-text)]">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="hourlyRate" className="mb-1.5 block text-sm text-[var(--color-text)]">
          Default hourly rate (₹)
        </label>
        <input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          value={form.hourlyRate}
          onChange={(e) => updateField("hourlyRate", e.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="upiId" className="mb-1.5 block text-sm text-[var(--color-text)]">
            UPI ID
          </label>
          <input
            id="upiId"
            type="text"
            value={form.upiId}
            onChange={(e) => updateField("upiId", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="bankAccountHolder"
            className="mb-1.5 block text-sm text-[var(--color-text)]"
          >
            Account holder
          </label>
          <input
            id="bankAccountHolder"
            type="text"
            value={form.bankAccountHolder}
            onChange={(e) => updateField("bankAccountHolder", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="bankName" className="mb-1.5 block text-sm text-[var(--color-text)]">
            Bank name
          </label>
          <input
            id="bankName"
            type="text"
            value={form.bankName}
            onChange={(e) => updateField("bankName", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="bankIfsc" className="mb-1.5 block text-sm text-[var(--color-text)]">
            IFSC code
          </label>
          <input
            id="bankIfsc"
            type="text"
            value={form.bankIfsc}
            onChange={(e) => updateField("bankIfsc", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor="bankAccountNumber"
            className="mb-1.5 block text-sm text-[var(--color-text)]"
          >
            Account number
          </label>
          <input
            id="bankAccountNumber"
            type="text"
            value={form.bankAccountNumber}
            onChange={(e) => updateField("bankAccountNumber", e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="panNumber" className="mb-1.5 block text-sm text-[var(--color-text)]">
            PAN number
          </label>
          <input
            id="panNumber"
            type="text"
            value={form.panNumber}
            onChange={(e) => updateField("panNumber", e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-accent)]" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-[var(--color-accent)]">Payment & billing settings saved.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
