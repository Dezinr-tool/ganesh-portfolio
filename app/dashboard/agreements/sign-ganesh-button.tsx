"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/dashboard/agreements/signature-canvas";

type SignGaneshButtonProps = {
  agreementId: string;
  alreadySigned: boolean;
};

export function SignGaneshButton({
  agreementId,
  alreadySigned,
}: SignGaneshButtonProps) {
  const router = useRouter();
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const [open, setOpen] = useState(false);
  const [defaultSignature, setDefaultSignature] = useState<string | null>(null);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  function openModal() {
    setOpen(true);
    setLoadingDefault(true);
    setError(null);
    setHasDrawnSignature(false);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setDefaultSignature(data.signature ?? null))
      .catch(() => setDefaultSignature(null))
      .finally(() => setLoadingDefault(false));
  }

  if (alreadySigned) {
    return (
      <span className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm text-[var(--color-accent)]">
        Signed by you
      </span>
    );
  }

  async function handleSign(signature: string) {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_ganesh", signature }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to sign.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to sign.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmDefault() {
    if (!defaultSignature) return;
    void handleSign(defaultSignature);
  }

  function handleConfirmDrawn() {
    const signature = canvasRef.current?.getDataUrl();
    if (!signature) {
      setError("Please draw your signature first.");
      return;
    }
    void handleSign(signature);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
      >
        Sign as Ganesh Das
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-bg)]">Sign agreement</h3>

            {loadingDefault ? (
              <p className="mt-4 text-sm text-[var(--color-text)]">Loading signature…</p>
            ) : defaultSignature ? (
              <>
                <p className="mt-1 text-sm text-[var(--color-text)]">
                  Using your saved default signature.
                </p>
                <div className="mt-4 rounded border border-[var(--color-text)] bg-[var(--color-bg)] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={defaultSignature}
                    alt="Your default signature"
                    className="mx-auto max-h-24 object-contain"
                  />
                </div>
                {error ? (
                  <p className="mt-2 text-sm text-[var(--color-accent)]">{error}</p>
                ) : null}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmDefault}
                    disabled={submitting}
                    className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
                  >
                    {submitting ? "Signing…" : "Confirm & Sign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-[var(--color-text)]">
                  No default signature set. Draw your signature below, or{" "}
                  <a
                    href="/dashboard/settings"
                    className="text-[var(--color-bg)] underline"
                  >
                    add one in Settings
                  </a>
                  .
                </p>
                <div className="mt-4 overflow-x-auto">
                  <SignatureCanvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    onChange={setHasDrawnSignature}
                  />
                </div>
                {error ? (
                  <p className="mt-2 text-sm text-[var(--color-accent)]">{error}</p>
                ) : null}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmDrawn}
                    disabled={submitting || !hasDrawnSignature}
                    className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
                  >
                    {submitting ? "Signing…" : "Confirm & Sign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
