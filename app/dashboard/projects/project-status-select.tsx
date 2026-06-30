"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PROJECT_STATUS_OPTIONS,
  type ProjectStatus,
} from "@/app/dashboard/_lib/projects";

const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type ProjectStatusSelectProps = {
  projectId: string;
  status: ProjectStatus;
};

export function ProjectStatusSelect({
  projectId,
  status,
}: ProjectStatusSelectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.target.value;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) return;

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className={selectClassName}
      aria-label="Project status"
    >
      {PROJECT_STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
