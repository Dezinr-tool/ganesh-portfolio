"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type DeleteInvoiceButtonProps = {
  invoiceId: string;
  invoiceNumber: string;
  variant?: "button" | "icon";
  redirectTo?: string;
};

export function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber,
  variant = "button",
  redirectTo,
}: DeleteInvoiceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`Delete invoice ${invoiceNumber}`}
        title="Delete invoice"
      >
        <Trash2 className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting…" : "Delete"}
    </Button>
  );
}
