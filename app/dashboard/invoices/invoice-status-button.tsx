"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { InvoiceStatus } from "@/app/dashboard/_lib/invoices";

type InvoiceStatusButtonProps = {
  invoiceId: string;
  status: InvoiceStatus;
  paidAt?: string | null;
};

export function InvoiceStatusButton({
  invoiceId,
  status,
  paidAt,
}: InvoiceStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [paidDate, setPaidDate] = useState(
    () => paidAt || new Date().toISOString().slice(0, 10),
  );

  const isPaid = status === "Paid";

  async function applyStatus(next: "paid" | "unpaid", date?: string) {
    setLoading(true);
    try {
      const body: { status: string; paidAt?: string } = { status: next };
      if (next === "paid" && date) body.paidAt = date;

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) return;

      setPickingDate(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (pickingDate) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor={`paid-at-${invoiceId}`}>
          Paid on
        </label>
        <input
          id={`paid-at-${invoiceId}`}
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <Button
          type="button"
          size="sm"
          disabled={loading || !paidDate}
          onClick={() => applyStatus("paid", paidDate)}
        >
          {loading ? "Saving…" : "Confirm"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => setPickingDate(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={isPaid ? "outline" : "default"}
      onClick={() => {
        if (isPaid) {
          void applyStatus("unpaid");
          return;
        }
        setPickingDate(true);
      }}
      disabled={loading}
    >
      {loading ? "Updating…" : isPaid ? "Mark as Unpaid" : "Mark as Paid"}
    </Button>
  );
}
