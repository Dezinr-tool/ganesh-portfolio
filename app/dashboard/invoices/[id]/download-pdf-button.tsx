"use client";

import { useState } from "react";
import type { Invoice } from "@/app/dashboard/_lib/invoices";

type DownloadPdfButtonProps = {
  invoice: Invoice;
};

export function DownloadPdfButton({ invoice }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:border-neutral-500 disabled:opacity-50"
    >
      {loading ? "Generating…" : "Download PDF"}
    </button>
  );
}
