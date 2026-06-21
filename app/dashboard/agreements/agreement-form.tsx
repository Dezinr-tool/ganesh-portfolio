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
  type Agreement,
  type DeliverableItem,
  type DeliverablePriority,
  type ScopeOfWorkItem,
} from "../_lib/agreements";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function createScopeItem(): ScopeOfWorkItem {
  return { id: crypto.randomUUID(), task: "", hours: 1 };
}

function createDeliverable(): DeliverableItem {
  return { id: crypto.randomUUID(), priority: "P0", item: "" };
}

type AgreementFormProps = {
  agreement?: Agreement;
};

export default function AgreementForm({ agreement }: AgreementFormProps) {
  const isEdit = Boolean(agreement);
  const router = useRouter();
  const needsInvalidateWarning =
    isEdit && agreement?.status === "awaiting_client";

  const [title, setTitle] = useState(agreement?.title ?? "");
  const [clientName, setClientName] = useState(agreement?.clientName ?? "");
  const [clientCompany, setClientCompany] = useState(
    agreement?.clientCompany ?? "",
  );
  const [clientEmail, setClientEmail] = useState(agreement?.clientEmail ?? "");
  const [clientRepresentative, setClientRepresentative] = useState(
    agreement?.clientRepresentative ?? "",
  );
  const [projectOverview, setProjectOverview] = useState(
    agreement?.projectOverview ?? "",
  );
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWorkItem[]>(
    agreement?.scopeOfWork.length
      ? agreement.scopeOfWork
      : [createScopeItem()],
  );
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    agreement?.deliverables.length
      ? agreement.deliverables
      : [createDeliverable()],
  );
  const [timeline, setTimeline] = useState(agreement?.timeline ?? "");
  const [hourlyRate, setHourlyRate] = useState(
    agreement?.hourlyRate != null ? String(agreement.hourlyRate) : "",
  );
  const [fixedCost, setFixedCost] = useState(
    agreement?.fixedCost != null ? String(agreement.fixedCost) : "",
  );
  const [advancePercent, setAdvancePercent] = useState(
    agreement ? String(agreement.advancePercent) : "50",
  );
  const [paymentNotes, setPaymentNotes] = useState(
    agreement?.paymentNotes ?? "",
  );
  const [confirmInvalidate, setConfirmInvalidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateScope(
    id: string,
    field: keyof ScopeOfWorkItem,
    value: string | number,
  ) {
    setScopeOfWork((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function updateDeliverable(
    id: string,
    field: keyof DeliverableItem,
    value: string,
  ) {
    setDeliverables((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (needsInvalidateWarning && !confirmInvalidate) {
      setError(
        "Please confirm that you understand editing will invalidate the previous signing link.",
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      title,
      clientName,
      clientCompany,
      clientEmail,
      clientRepresentative,
      projectOverview,
      scopeOfWork,
      deliverables,
      timeline,
      hourlyRate: hourlyRate === "" ? null : Number(hourlyRate),
      fixedCost: fixedCost === "" ? null : Number(fixedCost),
      advancePercent: Number(advancePercent) || 50,
      paymentNotes,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/agreements/${agreement!.id}` : "/api/agreements",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit ? { action: "update", ...payload } : payload,
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save agreement.");
        return;
      }

      router.push(`/dashboard/agreements/${data.id}`);
      router.refresh();
    } catch {
      setError("Failed to save agreement.");
    } finally {
      setSubmitting(false);
    }
  }

  const cancelHref = isEdit
    ? `/dashboard/agreements/${agreement!.id}`
    : "/dashboard/agreements";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {needsInvalidateWarning ? (
        <Alert variant="destructive">
          <AlertDescription>
            <p>
              This agreement has already been sent to the client. Editing will
              invalidate the previous signing link.
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={confirmInvalidate}
                onChange={(e) => setConfirmInvalidate(e.target.checked)}
                className="mt-0.5"
              />
              I understand — reset signing and require re-sign & re-send
            </label>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Agreement details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            placeholder="Brand Identity — Ajoni Technologies"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </CardContent>
      </Card>

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
              required
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientRepresentative">Representative name</Label>
            <Input
              id="clientRepresentative"
              required
              value={clientRepresentative}
              onChange={(e) => setClientRepresentative(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="projectOverview"
            rows={5}
            required
            value={projectOverview}
            onChange={(e) => setProjectOverview(e.target.value)}
            placeholder="Describe the project goals, context, and expected outcomes…"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scope of work</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setScopeOfWork((items) => [...items, createScopeItem()])}
          >
            Add row
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {scopeOfWork.map((item) => (
            <div key={item.id} className="flex gap-3">
              <Input
                required
                placeholder="Task name"
                value={item.task}
                onChange={(e) => updateScope(item.id, "task", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={item.hours}
                onChange={(e) =>
                  updateScope(item.id, "hours", Number(e.target.value))
                }
                className="w-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setScopeOfWork((items) =>
                    items.length === 1
                      ? items
                      : items.filter((i) => i.id !== item.id),
                  )
                }
                disabled={scopeOfWork.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deliverables</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setDeliverables((items) => [...items, createDeliverable()])
            }
          >
            Add row
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {deliverables.map((item) => (
            <div key={item.id} className="flex gap-3">
              <select
                value={item.priority}
                onChange={(e) =>
                  updateDeliverable(
                    item.id,
                    "priority",
                    e.target.value as DeliverablePriority,
                  )
                }
                className={cn(selectClassName, "w-24")}
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
              </select>
              <Input
                required
                placeholder="Deliverable name"
                value={item.item}
                onChange={(e) => updateDeliverable(item.id, "item", e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDeliverables((items) =>
                    items.length === 1
                      ? items
                      : items.filter((i) => i.id !== item.id),
                  )
                }
                disabled={deliverables.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="timeline"
            rows={3}
            required
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="e.g. Week 1–2: Discovery, Week 3–4: Design…"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly rate (optional)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fixedCost">Fixed cost (optional)</Label>
              <Input
                id="fixedCost"
                type="number"
                min="0"
                step="0.01"
                value={fixedCost}
                onChange={(e) => setFixedCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advancePercent">Advance %</Label>
              <Input
                id="advancePercent"
                type="number"
                min="0"
                max="100"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentNotes">Payment notes (optional)</Label>
            <Textarea
              id="paymentNotes"
              rows={3}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Bank details, payment schedule, etc."
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create agreement"}
        </Button>
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
