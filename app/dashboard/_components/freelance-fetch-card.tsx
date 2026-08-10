"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  monthLabel,
  shiftMonthKey,
} from "@/lib/expense-tracker-month";

const SHEET_START = "2026-08";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FreelanceFetchCard() {
  const months = useMemo(() => {
    const keys: string[] = [];
    let key = SHEET_START;
    // August + next 11 months for projection fetch
    for (let i = 0; i < 12; i++) {
      keys.push(key);
      key = shiftMonthKey(key, 1);
    }
    return keys.map((k) => ({ key: k, label: monthLabel(k) }));
  }, []);

  const [monthKey, setMonthKey] = useState(SHEET_START);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    amount: number;
    invoiceCount: number;
    fetchedAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchFreelance() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expense-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthKey, fetchFreelance: true }),
      });
      if (!res.ok) {
        setError("Fetch failed. Mark invoices Paid with a paid date first.");
        return;
      }
      const data = (await res.json()) as {
        freelanceAmount: number;
        freelanceInvoiceIds: string[];
        freelanceFetchedAt: string | null;
      };
      setResult({
        amount: data.freelanceAmount,
        invoiceCount: data.freelanceInvoiceIds.length,
        fetchedAt: data.freelanceFetchedAt || new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Freelance Fetch
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Pull Paid invoice totals (by paid date) into Expense Tracker for the
            selected month — e.g. August projection.
          </p>
        </div>
        <Link
          href={`/expense-tracker?month=${monthKey}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Open month →
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1.5 text-sm">
          <span className="text-muted-foreground">Month</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={monthKey}
            onChange={(e) => {
              setMonthKey(e.target.value);
              setResult(null);
            }}
          >
            {months.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" onClick={() => void fetchFreelance()} disabled={loading}>
          {loading ? "Fetching…" : "Fetch freelance"}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}

      {result ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Synced <span className="font-medium text-foreground">{formatINR(result.amount)}</span>{" "}
          from {result.invoiceCount} invoice(s) into{" "}
          <span className="font-medium text-foreground">{monthLabel(monthKey)}</span>.
        </p>
      ) : null}
    </section>
  );
}
