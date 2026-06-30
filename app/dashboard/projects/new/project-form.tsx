"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_OPTIONS,
  type Project,
  type ProjectStatus,
} from "@/app/dashboard/_lib/projects";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50";

type ProjectFormProps = {
  project?: Project;
};

export default function ProjectForm({ project }: ProjectFormProps) {
  const isEditing = Boolean(project);
  const router = useRouter();

  const [clientName, setClientName] = useState(project?.clientName ?? "");
  const [clientCompany, setClientCompany] = useState(
    project?.clientCompany ?? "",
  );
  const [clientEmail, setClientEmail] = useState(project?.clientEmail ?? "");
  const [clientAddress, setClientAddress] = useState(
    project?.clientAddress ?? "",
  );
  const [requirements, setRequirements] = useState(
    project?.requirements ?? "",
  );
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "lead",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const url = isEditing ? `/api/projects/${project!.id}` : "/api/projects";
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientCompany,
          clientEmail,
          clientAddress,
          requirements,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save project.");
        return;
      }

      router.push(`/dashboard/projects/${data.id}`);
    } catch {
      setError("Failed to save project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client name</Label>
            <Input
              id="clientName"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientCompany">Company</Label>
            <Input
              id="clientCompany"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className={selectClassName}
            >
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="clientAddress">Address</Label>
            <Textarea
              id="clientAddress"
              rows={3}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requirements &amp; notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="requirements"
            rows={10}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Scope of work, discussion notes, what they asked for, links to shared docs…"
          />
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEditing ? "Save changes" : "Save project"}
        </Button>
        <Link
          href={
            isEditing
              ? `/dashboard/projects/${project!.id}`
              : "/dashboard/projects"
          }
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
