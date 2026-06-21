"use client";

import { useState } from "react";
import type { Invoice } from "@/app/dashboard/_lib/invoices";

type DownloadPdfButtonProps = {
  invoice: Invoice;
};

export function DownloadPdfButton({ invoice }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `PDF failed (${response.status})`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("PDF file was empty.");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] hover:border-[var(--color-text)] disabled:opacity-50"
      >
        {loading ? "Generating…" : "Download PDF"}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-[var(--color-accent)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
