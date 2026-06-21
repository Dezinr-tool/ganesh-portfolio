"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InvoiceStatus } from "@/app/dashboard/_lib/invoices";

type InvoiceStatusButtonProps = {
  invoiceId: string;
  status: InvoiceStatus;
};

export function InvoiceStatusButton({
  invoiceId,
  status,
}: InvoiceStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPaid = status === "Paid";
  const nextStatus = isPaid ? "unpaid" : "paid";
  const label = isPaid ? "Mark as Unpaid" : "Mark as Paid";

  async function handleToggle() {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={
        isPaid
          ? "rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)] disabled:opacity-50"
          : "rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)] disabled:opacity-50"
      }
    >
      {loading ? "Updating…" : label}
    </button>
  );
}
