"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Invoice } from "@/app/dashboard/_lib/invoices";
import { InvoicePdf } from "@/lib/invoice-pdf";

type DownloadPdfButtonProps = {
  invoice: Invoice;
};

export function DownloadPdfButton({ invoice }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await pdf(<InvoicePdf invoice={invoice} />).toBlob();
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
