"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteAgreementButtonProps = {
  agreementId: string;
  title: string;
  variant?: "button" | "icon";
  redirectTo?: string;
};

export function DeleteAgreementButton({
  agreementId,
  title,
  variant = "button",
  redirectTo,
}: DeleteAgreementButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this agreement? This cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Failed to delete agreement.");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setError("Failed to delete agreement.");
    } finally {
      setLoading(false);
    }
  }

  const control =
    variant === "icon" ? (
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`Delete agreement ${title}`}
        title="Delete agreement"
        className="rounded-md p-1.5 text-[var(--color-text)] hover:text-[var(--color-accent)] disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    ) : (
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-sm text-[var(--color-text)] hover:text-[var(--color-accent)] disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
    );

  if (variant === "icon" && error) {
    return (
      <div className="flex flex-col items-end gap-1">
        {control}
        <span className="max-w-[120px] text-right text-xs text-[var(--color-accent)]">
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {control}
      {error ? (
        <span className="text-xs text-[var(--color-accent)]" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
