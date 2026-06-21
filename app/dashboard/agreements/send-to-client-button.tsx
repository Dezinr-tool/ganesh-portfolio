"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SendToClientButtonProps = {
  agreementId: string;
  disabled: boolean;
  alreadySent: boolean;
};

export function SendToClientButton({
  agreementId,
  disabled,
  alreadySent,
}: SendToClientButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(alreadySent);

  async function handleSend() {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/agreements/${agreementId}/send`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to send.");
        return;
      }

      setSent(true);
      router.refresh();
    } catch {
      setError("Failed to send.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return <Badge variant="secondary">Sent to client</Badge>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleSend}
        disabled={disabled || submitting}
      >
        {submitting ? "Sending…" : "Send to Client"}
      </Button>
      {error ? (
        <Alert variant="destructive" className="max-w-xs py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
