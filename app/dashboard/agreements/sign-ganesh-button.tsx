"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/agreements/signature-canvas";

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

  useEffect(() => {
    if (!open) return;

    setLoadingDefault(true);
    setError(null);
    setHasDrawnSignature(false);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setDefaultSignature(data.signature ?? null))
      .catch(() => setDefaultSignature(null))
      .finally(() => setLoadingDefault(false));
  }, [open]);

  if (alreadySigned) {
    return (
      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
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
        onClick={() => setOpen(true)}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950"
      >
        Sign as Ganesh Das
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-neutral-700 bg-neutral-900 p-6">
            <h3 className="text-lg font-semibold text-white">Sign agreement</h3>

            {loadingDefault ? (
              <p className="mt-4 text-sm text-neutral-400">Loading signature…</p>
            ) : defaultSignature ? (
              <>
                <p className="mt-1 text-sm text-neutral-400">
                  Using your saved default signature.
                </p>
                <div className="mt-4 rounded border border-neutral-700 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={defaultSignature}
                    alt="Your default signature"
                    className="mx-auto max-h-24 object-contain"
                  />
                </div>
                {error ? (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                ) : null}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmDefault}
                    disabled={submitting}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
                  >
                    {submitting ? "Signing…" : "Confirm & Sign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-neutral-400">
                  No default signature set. Draw your signature below, or{" "}
                  <a
                    href="/dashboard/settings"
                    className="text-white underline"
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
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                ) : null}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmDrawn}
                    disabled={submitting || !hasDrawnSignature}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
                  >
                    {submitting ? "Signing…" : "Confirm & Sign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm text-neutral-400 hover:text-white"
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
