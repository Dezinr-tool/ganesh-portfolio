"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { EmailListField } from "@/components/dashboard/EmailListField";
import { cn } from "@/lib/utils";
import {
  type InvoiceLineItem,
  calculateLineAmount,
  calculateTotals,
  DEFAULT_PROCESSING_FEE_PERCENT,
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
  const [clientEmails, setClientEmails] = useState<string[]>([""]);
  const [clientPhone, setClientPhone] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
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
    () => calculateTotals(resolvedLineItems, parsedTaxPercent, DEFAULT_PROCESSING_FEE_PERCENT),
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
          clientEmails,
          clientPhone,
          clientCompany,
          clientAddress,
          clientGstNumber: gstNumber,
          lineItems: resolvedLineItems,
          subtotal: totals.subtotal,
          taxPercent: parsedTaxPercent,
          taxAmount: totals.taxAmount,
          processingFeePercent: DEFAULT_PROCESSING_FEE_PERCENT,
          processingFeeAmount: totals.processingFeeAmount,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Invoice number</Label>
            <Input
              type="text"
              value={loadingNumber ? "Loading…" : invoiceNumber}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue date</Label>
            <Input
              id="issueDate"
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client name</Label>
            <Input
              id="clientName"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <EmailListField
              id="clientEmail"
              label="Client email"
              emails={clientEmails}
              onChange={setClientEmails}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Phone</Label>
            <Input
              id="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="clientCompany">Client company</Label>
            <Input
              id="clientCompany"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="clientAddress">Client address</Label>
            <Textarea
              id="clientAddress"
              rows={3}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gstNumber">GST number</Label>
            <Input
              id="gstNumber"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            Add row
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {resolvedLineItems.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-12"
            >
              <div className="space-y-2 sm:col-span-5">
                <Label className="sm:sr-only">Description</Label>
                <Input
                  required
                  placeholder="Design consultation"
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="sm:sr-only">Effort (hrs)</Label>
                <Input
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
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="sm:sr-only">Rate</Label>
                <Input readOnly value={formatCurrency(hourlyRate)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="sm:sr-only">Amount</Label>
                <Input readOnly value={formatCurrency(item.amount)} />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or additional notes…"
            />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="taxPercent">Tax %</Label>
              <Input
                id="taxPercent"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="max-w-[120px] text-right"
              />
            </div>
            {parsedTaxPercent !== null && parsedTaxPercent > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax amount</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Payment processing ({DEFAULT_PROCESSING_FEE_PERCENT}%)
              </span>
              <span>{formatCurrency(totals.processingFeeAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save invoice"}
        </Button>
        <Link
          href="/dashboard/invoices"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
