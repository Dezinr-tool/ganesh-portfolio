"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Agreement } from "@/app/dashboard/_lib/agreements";

type DownloadPdfButtonProps = {
  agreement: Agreement;
};

export function DownloadPdfButton({ agreement }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agreements/${agreement.id}/pdf`);

      if (!response.ok) {
        setError("Failed to generate PDF.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${agreement.title.replace(/[^a-z0-9-_]+/gi, "-")}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? "Generating…" : "Download PDF"}
      </Button>
      {error ? (
        <Alert variant="destructive" className="max-w-xs py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
