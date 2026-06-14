"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type InvoiceLineItem,
  calculateLineAmount,
  calculateTotals,
  inputClassName,
  formatCurrency,
} from "../../_lib/invoices";

type LineItemRow = InvoiceLineItem;

function createEmptyLineItem(hourlyRate: number): LineItemRow {
  return {
    id: crypto.randomUUID(),
    description: "",
    effortHrs: 0,
    rate: hourlyRate,
    amount: 0,
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function dueDateISO(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export default function InvoiceForm() {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [issueDate, setIssueDate] = useState(todayISO);
  const [dueDate, setDueDate] = useState(dueDateISO);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    createEmptyLineItem(0),
  ]);
  const [taxPercent, setTaxPercent] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        if (data.nextInvoiceNumber) {
          setInvoiceNumber(data.nextInvoiceNumber);
        }
      })
      .catch(() => setError("Could not load invoice number."))
      .finally(() => setLoadingNumber(false));
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hourlyRate === "number") {
          setHourlyRate(data.hourlyRate);
        }
      })
      .catch(() => setError("Could not load hourly rate."));
  }, []);

  const resolvedLineItems = useMemo(
    () =>
      lineItems.map((item) => ({
        ...item,
        rate: hourlyRate,
        amount: calculateLineAmount(item.effortHrs, hourlyRate),
      })),
    [lineItems, hourlyRate],
  );

  const parsedTaxPercent = taxPercent === "" ? null : Number(taxPercent);

  const totals = useMemo(
    () => calculateTotals(resolvedLineItems, parsedTaxPercent),
    [resolvedLineItems, parsedTaxPercent],
  );

  function updateLineItem(
    id: string,
    field: keyof LineItemRow,
    value: string | number,
  ) {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "effortHrs") {
          updated.rate = hourlyRate;
          updated.amount = calculateLineAmount(Number(value), hourlyRate);
        }

        return updated;
      }),
    );
  }

  function addLineItem() {
    setLineItems((items) => [...items, createEmptyLineItem(hourlyRate)]);
  }

  function removeLineItem(id: string) {
    setLineItems((items) =>
      items.length === 1 ? items : items.filter((item) => item.id !== id),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueDate,
          dueDate,
          clientName,
          clientEmail,
          clientCompany,
          clientAddress,
          lineItems: resolvedLineItems,
          subtotal: totals.subtotal,
          taxPercent: parsedTaxPercent,
          taxAmount: totals.taxAmount,
          total: totals.total,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save invoice.");
        return;
      }

      router.push(`/dashboard/invoices/${data.id}`);
    } catch {
      setError("Failed to save invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Invoice details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm text-neutral-300">
              Invoice number
            </label>
            <input
              type="text"
              value={loadingNumber ? "Loading…" : invoiceNumber}
              readOnly
              className={`${inputClassName} text-neutral-400`}
            />
          </div>
          <div>
            <label htmlFor="issueDate" className="mb-1.5 block text-sm text-neutral-300">
              Issue date
            </label>
            <input
              id="issueDate"
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="dueDate" className="mb-1.5 block text-sm text-neutral-300">
              Due date
            </label>
            <input
              id="dueDate"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Client</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clientName" className="mb-1.5 block text-sm text-neutral-300">
              Client name
            </label>
            <input
              id="clientName"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="clientEmail" className="mb-1.5 block text-sm text-neutral-300">
              Client email
            </label>
            <input
              id="clientEmail"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="clientCompany" className="mb-1.5 block text-sm text-neutral-300">
              Client company
            </label>
            <input
              id="clientCompany"
              type="text"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="clientAddress" className="mb-1.5 block text-sm text-neutral-300">
              Client address
            </label>
            <textarea
              id="clientAddress"
              rows={3}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className={`${inputClassName} resize-none`}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Line items</h2>
          <button
            type="button"
            onClick={addLineItem}
            className="text-sm text-neutral-300 hover:text-white"
          >
            + Add row
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="hidden grid-cols-12 gap-3 text-xs uppercase tracking-wide text-neutral-500 sm:grid">
            <div className="col-span-5">Description</div>
            <div className="col-span-3">Effort (hrs)</div>
            <div className="col-span-2">Rate</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-1" />
          </div>

          {resolvedLineItems.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border border-neutral-800 bg-neutral-950 p-3 sm:grid-cols-12 sm:border-0 sm:bg-transparent sm:p-0"
            >
              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs text-neutral-500 sm:hidden">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="Design consultation"
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                  className={inputClassName}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs text-neutral-500 sm:hidden">
                  Effort (hrs)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  placeholder="0"
                  value={item.effortHrs === 0 ? "" : item.effortHrs}
                  onChange={(e) =>
                    updateLineItem(
                      item.id,
                      "effortHrs",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className={inputClassName}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-neutral-500 sm:hidden">
                  Rate
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(hourlyRate)}
                  className={`${inputClassName} text-neutral-400`}
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-neutral-500 sm:hidden">
                  Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(item.amount)}
                  className={`${inputClassName} text-neutral-400`}
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="text-sm text-neutral-500 hover:text-red-400 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm text-neutral-300">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or additional notes…"
              className={`${inputClassName} resize-y`}
            />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="text-white">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="taxPercent" className="text-neutral-400">
                Tax %
              </label>
              <input
                id="taxPercent"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className={`${inputClassName} max-w-[120px] text-right`}
              />
            </div>
            {parsedTaxPercent !== null && parsedTaxPercent > 0 ? (
              <div className="flex justify-between text-neutral-400">
                <span>Tax amount</span>
                <span className="text-white">
                  {formatCurrency(totals.taxAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-neutral-800 pt-3 text-base font-semibold text-white">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save invoice"}
        </button>
        <Link
          href="/dashboard/invoices"
          className="text-sm text-neutral-400 hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
