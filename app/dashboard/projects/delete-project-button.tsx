"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type DeleteProjectButtonProps = {
  projectId: string;
  clientName: string;
  variant?: "button" | "icon";
  redirectTo?: string;
};

export function DeleteProjectButton({
  projectId,
  clientName,
  variant = "button",
  redirectTo,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the project for ${clientName}?`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`Delete project for ${clientName}`}
        title="Delete project"
      >
        <Trash2 className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting…" : "Delete"}
    </Button>
  );
}
