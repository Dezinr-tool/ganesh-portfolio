"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Default hourly rate (₹)</Label>
        <Input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          value={form.hourlyRate}
          onChange={(e) => updateField("hourlyRate", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="upiId">UPI ID</Label>
          <Input
            id="upiId"
            value={form.upiId}
            onChange={(e) => updateField("upiId", e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bankAccountHolder">Account holder</Label>
          <Input
            id="bankAccountHolder"
            value={form.bankAccountHolder}
            onChange={(e) => updateField("bankAccountHolder", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankName">Bank name</Label>
          <Input
            id="bankName"
            value={form.bankName}
            onChange={(e) => updateField("bankName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankIfsc">IFSC code</Label>
          <Input
            id="bankIfsc"
            value={form.bankIfsc}
            onChange={(e) => updateField("bankIfsc", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">Account number</Label>
          <Input
            id="bankAccountNumber"
            value={form.bankAccountNumber}
            onChange={(e) => updateField("bankAccountNumber", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="panNumber">PAN number</Label>
          <Input
            id="panNumber"
            value={form.panNumber}
            onChange={(e) => updateField("panNumber", e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertDescription>Payment & billing settings saved.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
