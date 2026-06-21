"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`Delete invoice ${invoiceNumber}`}
        title="Delete invoice"
        className="rounded-md p-1.5 text-[var(--color-text)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)] disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
