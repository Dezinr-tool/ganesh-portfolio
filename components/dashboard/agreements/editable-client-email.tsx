"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EditableClientEmailProps = {
  agreementId: string;
  email: string;
};

export function EditableClientEmail({
  agreementId,
  email: initialEmail,
}: EditableClientEmailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_email",
          clientEmail: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to update email.");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("Failed to update email.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEmail(initialEmail);
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mt-1">
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-[var(--color-text)] px-2 py-1 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-medium text-[var(--color-text)] hover:underline disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-[var(--color-text)] hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[var(--color-accent)]">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <p className="text-sm text-[var(--color-text)]">{initialEmail}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit client email"
        className="rounded p-0.5 text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="m2.695 14.762-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
        </svg>
      </button>
    </div>
  );
}
