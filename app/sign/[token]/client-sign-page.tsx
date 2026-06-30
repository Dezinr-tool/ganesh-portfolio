"use client";

import { useEffect, useRef, useState } from "react";
import {
  SignatureInput,
  type SignatureInputRef,
} from "@/components/dashboard/agreements/signature-input";
import type { Agreement } from "@/app/dashboard/_lib/agreements";

type ClientSignPageProps = {
  token: string;
};

export function ClientSignPage({ token }: ClientSignPageProps) {
  const signatureRef = useRef<SignatureInputRef>(null);
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
    const signature = signatureRef.current?.getDataUrl();
    if (!signature) {
      setError("Please add your signature before signing.");
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

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="max-w-sm text-center">
          <p className="text-lg font-medium text-[var(--color-text)]">
            Agreement signed successfully
          </p>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            Thank you, {agreement.clientName}. Your signature has been
            recorded. You can close this window now.
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            className="mt-6 rounded-md bg-[var(--color-text)] px-6 py-2.5 text-sm font-medium text-[var(--color-bg)]"
          >
            Close window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--color-bg)] px-4 py-8">
      <div className="w-full max-w-[900px]">
        <div className="mb-4 text-center">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Review &amp; Sign Agreement
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text)]">
            Please review the agreement below and sign to confirm.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--color-text)]">
          <iframe
            src={`/api/sign/${token}/pdf`}
            title={`${agreement.title} agreement PDF`}
            className="h-[75vh] w-full"
          />
        </div>

        <div className="mt-6 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] px-6 py-6">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Your signature
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text)]">
            Draw, type, or upload an image of your signature.
          </p>
          <div className="mt-4">
            <SignatureInput ref={signatureRef} onChange={setHasSignature} />
          </div>
          {error ? (
            <p className="mt-3 text-sm text-[var(--color-accent)]">{error}</p>
          ) : null}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSign}
              disabled={submitting || !hasSignature}
              className="rounded-md bg-[var(--color-text)] px-6 py-2.5 text-sm font-medium text-[var(--color-bg)] disabled:opacity-50"
            >
              {submitting ? "Signing…" : "Sign Agreement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
