"use client";

import { useEffect, useRef, useState } from "react";
import { AgreementDocument } from "@/components/dashboard/agreements/agreement-document";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/dashboard/agreements/signature-canvas";
import type { Agreement } from "@/app/dashboard/_lib/agreements";
import type { DesignTokens } from "@/lib/design-tokens";

type ClientSignPageProps = {
  token: string;
  designTokens: DesignTokens;
};

export function ClientSignPage({ token, designTokens }: ClientSignPageProps) {
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAgreement(data);
          if (data.clientSignedAt) {
            setSigned(true);
          }
        }
      })
      .catch(() => setError("Failed to load agreement."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSign() {
    const signature = canvasRef.current?.getDataUrl();
    if (!signature) {
      setError("Please draw your signature before signing.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to sign agreement.");
        return;
      }

      setAgreement(data);
      setSigned(true);
    } catch {
      setError("Failed to sign agreement.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm text-[var(--color-text)]">Loading agreement…</p>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--color-text)]">
            Agreement not found
          </p>
          <p className="mt-2 text-sm text-[var(--color-text)]">{error}</p>
        </div>
      </div>
    );
  }

  if (!agreement) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10">
      <div className="mx-auto max-w-[900px] px-4">
        {signed ? (
          <div className="mb-6 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 py-4 text-center">
            <p className="font-medium text-[var(--color-accent)]">
              Agreement signed successfully
            </p>
            <p className="mt-1 text-sm text-[var(--color-accent)]">
              Thank you, {agreement.clientName}. A confirmation has been sent.
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] px-6 py-4">
            <h1 className="text-lg font-semibold text-[var(--color-text)]">
              Review & Sign Agreement
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text)]">
              Please review the agreement below and sign to confirm.
            </p>
          </div>
        )}

        <AgreementDocument agreement={agreement} designTokens={designTokens} />

        {!signed ? (
          <div className="mt-6 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] px-6 py-6">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Your signature
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text)]">
              Draw your signature below using mouse or touch.
            </p>
            <div className="mt-4 overflow-x-auto">
              <SignatureCanvas
                ref={canvasRef}
                width={500}
                height={200}
                showClearButton={false}
                onChange={setHasSignature}
              />
            </div>
            {error ? (
              <p className="mt-2 text-sm text-[var(--color-accent)]">{error}</p>
            ) : null}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => canvasRef.current?.clear()}
                className="rounded-md border border-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={submitting || !hasSignature}
                className="rounded-md bg-[var(--color-text)] px-6 py-2.5 text-sm font-medium text-[var(--color-bg)] disabled:opacity-50"
              >
                {submitting ? "Signing…" : "Sign"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
