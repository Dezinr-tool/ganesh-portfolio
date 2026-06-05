"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    return (
      <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
        Sent to client
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || submitting}
        className="rounded-md border border-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
      >
        {submitting ? "Sending…" : "Send to Client"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
