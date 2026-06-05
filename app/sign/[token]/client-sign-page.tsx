"use client";

import { useEffect, useRef, useState } from "react";
import { AgreementDocument } from "@/components/agreements/agreement-document";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/agreements/signature-canvas";
import type { Agreement } from "@/app/dashboard/_lib/agreements";

type ClientSignPageProps = {
  token: string;
};

export function ClientSignPage({ token }: ClientSignPageProps) {
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
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm text-neutral-600">Loading agreement…</p>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="text-lg font-medium text-neutral-900">
            Agreement not found
          </p>
          <p className="mt-2 text-sm text-neutral-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!agreement) return null;

  return (
    <div className="min-h-screen bg-neutral-100 py-10">
      <div className="mx-auto max-w-[900px] px-4">
        {signed ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-4 text-center">
            <p className="font-medium text-emerald-800">
              Agreement signed successfully
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Thank you, {agreement.clientName}. A confirmation has been sent.
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white px-6 py-4">
            <h1 className="text-lg font-semibold text-neutral-900">
              Review & Sign Agreement
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Please review the agreement below and sign to confirm.
            </p>
          </div>
        )}

        <AgreementDocument agreement={agreement} />

        {!signed ? (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-neutral-900">
              Your signature
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
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
              <p className="mt-2 text-sm text-red-600">{error}</p>
            ) : null}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => canvasRef.current?.clear()}
                className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={submitting || !hasSignature}
                className="rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
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
