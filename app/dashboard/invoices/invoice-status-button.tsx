"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant={isPaid ? "outline" : "default"}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? "Updating…" : label}
    </Button>
  );
}
