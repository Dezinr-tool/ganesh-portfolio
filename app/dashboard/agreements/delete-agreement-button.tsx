"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`Delete agreement ${title}`}
        title="Delete agreement"
      >
        <Trash2 className="size-4" />
      </Button>
    ) : (
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Deleting…" : "Delete"}
      </Button>
    );

  return (
    <div className="flex flex-col items-end gap-1">
      {control}
      {error ? (
        <Alert variant="destructive" className="max-w-xs py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
