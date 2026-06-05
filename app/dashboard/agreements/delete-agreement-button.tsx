"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteAgreementButtonProps = {
  agreementId: string;
  title: string;
};

export function DeleteAgreementButton({
  agreementId,
  title,
}: DeleteAgreementButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/agreements");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Delete &ldquo;{title}&rdquo;?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-300"
        >
          {deleting ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-neutral-500 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm text-neutral-500 hover:text-red-400"
    >
      Delete
    </button>
  );
}
