"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClientSelector } from "@/components/dashboard/ClientSelector";
import type { ClientFormValues, SavedClient } from "@/app/dashboard/_lib/clients";
import {
  CONFIDENTIALITY_TEXT,
  CURRENCY_OPTIONS,
  DEFAULT_GOVERNING_LAW,
  DEFAULT_REVISION_SCOPE_NOTE,
  IP_TRANSFER_TEXT,
  LIMITATION_OF_LIABILITY_TEXT,
  PORTFOLIO_RIGHTS_TEXT,
  PAYMENT_STRUCTURE_OPTIONS,
  killFeeClauseText,
  latePaymentClauseText,
  outOfScopeClauseText,
  normalizeScopeOfWork,
  type Agreement,
  type AgreementCurrency,
  type DeliverableItem,
  type DeliverablePriority,
  type MilestoneItem,
  type PaymentStructure,
  type ScopeOfWorkItem,
} from "../_lib/agreements";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

function createScopeItem(): ScopeOfWorkItem {
  return { id: crypto.randomUUID(), task: "", hours: null };
}

function createDeliverable(): DeliverableItem {
  return { id: crypto.randomUUID(), priority: "P0", item: "" };
}

function createMilestone(): MilestoneItem {
  return { id: crypto.randomUUID(), name: "", amount: 0, dueOn: "" };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
  const titleRef = useRef(agreement?.title ?? "");
  const [clientName, setClientName] = useState(agreement?.clientName ?? "");
  const [clientCompany, setClientCompany] = useState(agreement?.clientCompany ?? "");
  const [clientEmail, setClientEmail] = useState(agreement?.clientEmail ?? "");
  const [clientPhone, setClientPhone] = useState(agreement?.clientPhone ?? "");
  const [clientAddress, setClientAddress] = useState(agreement?.clientAddress ?? "");
  const [gstNumber, setGstNumber] = useState(agreement?.clientGstNumber ?? "");
  const [clientRepresentative, setClientRepresentative] = useState(
    agreement?.clientRepresentative ?? "",
  );
  const [agreementDate, setAgreementDate] = useState(
    agreement?.agreementDate ?? todayIsoDate(),
  );
  const [projectOverview, setProjectOverview] = useState(agreement?.projectOverview ?? "");
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWorkItem[]>(
    agreement?.scopeOfWork.length ? agreement.scopeOfWork : [createScopeItem()],
  );
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    agreement?.deliverables.length ? agreement.deliverables : [createDeliverable()],
  );
  const [timeline, setTimeline] = useState(agreement?.timeline ?? "");
  const [hourlyRate, setHourlyRate] = useState(
    agreement?.hourlyRate != null ? String(agreement.hourlyRate) : "",
  );
  const [fixedCost, setFixedCost] = useState(
    agreement?.fixedCost != null ? String(agreement.fixedCost) : "",
  );
  const [paymentNotes, setPaymentNotes] = useState(agreement?.paymentNotes ?? "");
  const [paymentStructure, setPaymentStructure] = useState<PaymentStructure>(
    agreement?.paymentStructure ?? "50_50",
  );
  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    agreement?.milestones?.length ? agreement.milestones : [createMilestone()],
  );
  const [customPaymentTerms, setCustomPaymentTerms] = useState(
    agreement?.customPaymentTerms ?? "",
  );
  const [latePaymentClause, setLatePaymentClause] = useState(
    agreement?.latePaymentClause ?? true,
  );
  const [latePaymentDays, setLatePaymentDays] = useState(
    agreement?.latePaymentDays ?? 7,
  );
  const [latePaymentInterest, setLatePaymentInterest] = useState(
    agreement?.latePaymentInterest ?? 2,
  );
  const [currency, setCurrency] = useState<AgreementCurrency>(
    agreement?.currency ?? "INR",
  );
  const [revisionsIncluded, setRevisionsIncluded] = useState(
    agreement?.revisionsIncluded ?? 2,
  );
  const [revisionScopeNote, setRevisionScopeNote] = useState(
    agreement?.revisionScopeNote ?? "",
  );
  const [ipTransfer, setIpTransfer] = useState(agreement?.ipTransfer ?? true);
  const [confidentiality, setConfidentiality] = useState(
    agreement?.confidentiality ?? true,
  );
  const [killFee, setKillFee] = useState(agreement?.killFee ?? true);
  const [killFeePercent, setKillFeePercent] = useState(agreement?.killFeePercent ?? 50);
  const [portfolioRights, setPortfolioRights] = useState(
    agreement?.portfolioRights ?? true,
  );
  const [outOfScopeClause, setOutOfScopeClause] = useState(
    agreement?.outOfScopeClause ?? true,
  );
  const [outOfScopeRate, setOutOfScopeRate] = useState(
    agreement?.outOfScopeRate != null ? String(agreement.outOfScopeRate) : "",
  );
  const [reviewWindowDays, setReviewWindowDays] = useState(
    agreement?.reviewWindowDays ?? 5,
  );
  const [deemedAcceptance, setDeemedAcceptance] = useState(
    agreement?.deemedAcceptance ?? true,
  );
  const [limitationOfLiability, setLimitationOfLiability] = useState(
    agreement?.limitationOfLiability ?? true,
  );
  const [terminationNoticeDays, setTerminationNoticeDays] = useState(
    agreement?.terminationNoticeDays ?? 7,
  );
  const [governingLaw, setGoverningLaw] = useState(
    agreement?.governingLaw ?? DEFAULT_GOVERNING_LAW,
  );
  const [confirmInvalidate, setConfirmInvalidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedClientSelected, setSavedClientSelected] = useState(false);
  const [clientDetailsEditing, setClientDetailsEditing] = useState(false);

  function updateScope(id: string, field: keyof ScopeOfWorkItem, value: string | number | null) {
    setScopeOfWork((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function updateDeliverable(id: string, field: keyof DeliverableItem, value: string) {
    setDeliverables((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function updateMilestone(id: string, field: keyof MilestoneItem, value: string | number) {
    setMilestones((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function handleClientSelectionChange(client: SavedClient | null) {
    setSavedClientSelected(client !== null);
    if (client) {
      setClientDetailsEditing(false);
      const domTitle =
        typeof document !== "undefined"
          ? (document.getElementById("title") as HTMLInputElement | null)?.value.trim()
          : "";
      const currentTitle = titleRef.current.trim() || domTitle || "";
      if (!currentTitle) {
        const nextTitle = `${client.name} — Design Project`;
        titleRef.current = nextTitle;
        setTitle(nextTitle);
      }
    } else {
      setClientDetailsEditing(false);
    }
  }

  function handleClientChange(patch: Partial<ClientFormValues>) {
    if (patch.clientName !== undefined) setClientName(patch.clientName);
    if (patch.clientEmail !== undefined) setClientEmail(patch.clientEmail);
    if (patch.clientPhone !== undefined) setClientPhone(patch.clientPhone);
    if (patch.clientCompany !== undefined) setClientCompany(patch.clientCompany);
    if (patch.clientAddress !== undefined) setClientAddress(patch.clientAddress);
    if (patch.gstNumber !== undefined) setGstNumber(patch.gstNumber);
    if (patch.representativeName !== undefined) setClientRepresentative(patch.representativeName);
  }

  const clientFormValues: ClientFormValues = {
    clientName,
    clientEmail,
    clientPhone,
    clientCompany,
    clientAddress,
    gstNumber,
    representativeName: clientRepresentative,
  };

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
      clientPhone,
      clientAddress,
      clientGstNumber: gstNumber,
      clientRepresentative,
      agreementDate,
      projectOverview,
      scopeOfWork: normalizeScopeOfWork(scopeOfWork),
      deliverables,
      milestones: paymentStructure === "milestone" ? milestones : [],
      timeline,
      hourlyRate: hourlyRate === "" ? null : Number(hourlyRate),
      fixedCost: fixedCost === "" ? null : Number(fixedCost),
      paymentNotes,
      paymentStructure,
      customPaymentTerms,
      latePaymentClause,
      latePaymentDays: Number(latePaymentDays) || 7,
      latePaymentInterest: Number(latePaymentInterest) || 2,
      currency,
      revisionsIncluded: Number(revisionsIncluded) || 2,
      revisionScopeNote,
      ipTransfer,
      confidentiality,
      killFee,
      killFeePercent: Number(killFeePercent) || 50,
      portfolioRights,
      outOfScopeClause,
      outOfScopeRate: outOfScopeRate === "" ? null : Number(outOfScopeRate),
      reviewWindowDays: Number(reviewWindowDays) || 5,
      deemedAcceptance,
      limitationOfLiability,
      terminationNoticeDays: Number(terminationNoticeDays) || 7,
      governingLaw,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/agreements/${agreement!.id}` : "/api/agreements",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? { action: "update", ...payload } : payload),
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
      {/* Saved client */}
      <Card>
        <CardHeader>
          <CardTitle>Saved client</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSelector
            values={clientFormValues}
            onChange={handleClientChange}
            collapseAfterSelect
            onSelectionChange={handleClientSelectionChange}
          />
        </CardContent>
      </Card>

      {needsInvalidateWarning ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-3">
            <p>
              This agreement has already been sent to the client. Editing will
              invalidate the previous signing link.
            </p>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmInvalidate}
                onChange={(e) => setConfirmInvalidate(e.target.checked)}
              />
              <span>I understand — reset signing and require re-sign &amp; re-send</span>
            </label>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Agreement details */}
      <Card>
        <CardHeader>
          <CardTitle>Agreement details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="Client Name — Design Project"
              value={title}
              onChange={(e) => {
                titleRef.current = e.target.value;
                setTitle(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agreementDate">Agreement date</Label>
            <Input
              id="agreementDate"
              type="date"
              required
              value={agreementDate}
              onChange={(e) => setAgreementDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent>
          {savedClientSelected && !clientDetailsEditing ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">{clientName}</p>
              {clientCompany ? <p className="text-muted-foreground">{clientCompany}</p> : null}
              <p className="text-muted-foreground">{clientEmail}</p>
              {clientPhone ? <p className="text-muted-foreground">{clientPhone}</p> : null}
              {clientRepresentative ? (
                <p className="text-muted-foreground">Rep: {clientRepresentative}</p>
              ) : null}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0"
                onClick={() => setClientDetailsEditing(true)}
              >
                Edit details
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {!savedClientSelected ? (
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client name</Label>
                  <Input
                    id="clientName"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              ) : null}
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
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
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
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST number</Label>
                <Input
                  id="gstNumber"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project overview */}
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

      {/* Scope of work */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scope of work</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              List high-level work areas. e.g. Brand Strategy, Logo Design
            </p>
          </div>
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
            <div key={item.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-12">
              <div className="space-y-2 sm:col-span-8">
                <Label className="sm:sr-only">Task</Label>
                <Input
                  required
                  placeholder="Task name"
                  value={item.task}
                  onChange={(e) => updateScope(item.id, "task", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="sm:sr-only">Est. hours (optional)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="hrs"
                  value={item.hours ?? ""}
                  onChange={(e) =>
                    updateScope(
                      item.id,
                      "hours",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  aria-label="Est. Hours (optional)"
                />
              </div>
              <div className="flex items-end sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setScopeOfWork((items) =>
                      items.length === 1 ? items : items.filter((i) => i.id !== item.id),
                    )
                  }
                  disabled={scopeOfWork.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Deliverables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deliverables</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              List specific outputs the client receives. e.g. Logo files, Brand Guidelines PDF
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeliverables((items) => [...items, createDeliverable()])}
          >
            Add row
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {deliverables.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-12">
              <div className="space-y-2 sm:col-span-2">
                <Label className="sm:sr-only">Priority</Label>
                <select
                  value={item.priority}
                  onChange={(e) =>
                    updateDeliverable(item.id, "priority", e.target.value as DeliverablePriority)
                  }
                  className={selectClassName}
                  aria-label="Priority"
                >
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-8">
                <Label className="sm:sr-only">Deliverable</Label>
                <Input
                  required
                  placeholder="Deliverable name"
                  value={item.item}
                  onChange={(e) => updateDeliverable(item.id, "item", e.target.value)}
                />
              </div>
              <div className="flex items-end sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeliverables((items) =>
                      items.length === 1 ? items : items.filter((i) => i.id !== item.id),
                    )
                  }
                  disabled={deliverables.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Approval & Acceptance */}
      <Card>
        <CardHeader>
          <CardTitle>Approval &amp; acceptance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Days the client has to review and give feedback on each deliverable
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-[200px]">
            <Label htmlFor="reviewWindowDays">Review window (days)</Label>
            <Input
              id="reviewWindowDays"
              type="number"
              min="1"
              step="1"
              value={reviewWindowDays}
              onChange={(e) => setReviewWindowDays(Number(e.target.value))}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={deemedAcceptance}
              onChange={(e) => setDeemedAcceptance(e.target.checked)}
            />
            <span className="text-sm">
              If no feedback is received within the review window, deliverables are deemed accepted
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Timeline */}
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

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as AgreementCurrency)}
              className={selectClassName}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
          <div className="space-y-2 sm:col-span-2">
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

      {/* Payment terms */}
      <Card>
        <CardHeader>
          <CardTitle>Payment terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentStructure">Payment structure</Label>
            <select
              id="paymentStructure"
              value={paymentStructure}
              onChange={(e) => setPaymentStructure(e.target.value as PaymentStructure)}
              className={selectClassName}
            >
              {PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {paymentStructure === "milestone" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Milestones</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMilestones((items) => [...items, createMilestone()])}
                >
                  Add row
                </Button>
              </div>
              {milestones.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-12"
                >
                  <div className="space-y-2 sm:col-span-4">
                    <Label className="sm:sr-only">Milestone name</Label>
                    <Input
                      required
                      placeholder="Milestone name"
                      value={item.name}
                      onChange={(e) => updateMilestone(item.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-3">
                    <Label className="sm:sr-only">Amount ({currency})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder={`Amount (${currency})`}
                      value={item.amount || ""}
                      onChange={(e) =>
                        updateMilestone(item.id, "amount", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-3">
                    <Label className="sm:sr-only">Due on</Label>
                    <Input
                      required
                      placeholder='Due on (e.g. "On delivery")'
                      value={item.dueOn}
                      onChange={(e) => updateMilestone(item.id, "dueOn", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end sm:col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMilestones((items) =>
                          items.length === 1
                            ? items
                            : items.filter((i) => i.id !== item.id),
                        )
                      }
                      disabled={milestones.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {paymentStructure === "custom" ? (
            <div className="space-y-2">
              <Label htmlFor="customPaymentTerms">Custom payment terms</Label>
              <Textarea
                id="customPaymentTerms"
                rows={3}
                value={customPaymentTerms}
                onChange={(e) => setCustomPaymentTerms(e.target.value)}
              />
            </div>
          ) : null}

          <Separator />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={latePaymentClause}
              onChange={(e) => setLatePaymentClause(e.target.checked)}
            />
            <span className="text-sm font-medium">Late payment clause</span>
          </label>

          {latePaymentClause ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latePaymentDays">Grace period (days)</Label>
                <Input
                  id="latePaymentDays"
                  type="number"
                  min="1"
                  step="1"
                  value={latePaymentDays}
                  onChange={(e) => setLatePaymentDays(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latePaymentInterest">Monthly interest %</Label>
                <Input
                  id="latePaymentInterest"
                  type="number"
                  min="0"
                  step="0.01"
                  value={latePaymentInterest}
                  onChange={(e) => setLatePaymentInterest(Number(e.target.value))}
                />
              </div>
              <p className="text-sm text-muted-foreground sm:col-span-2">
                {latePaymentClauseText(latePaymentDays, latePaymentInterest)}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Revision policy */}
      <Card>
        <CardHeader>
          <CardTitle>Revision policy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="revisionsIncluded">Revisions included</Label>
            <Input
              id="revisionsIncluded"
              type="number"
              min="0"
              step="1"
              value={revisionsIncluded}
              onChange={(e) => setRevisionsIncluded(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="revisionScopeNote">Revision scope note</Label>
            <Textarea
              id="revisionScopeNote"
              rows={3}
              value={revisionScopeNote}
              onChange={(e) => setRevisionScopeNote(e.target.value)}
              placeholder={DEFAULT_REVISION_SCOPE_NOTE}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal clauses */}
      <Card>
        <CardHeader>
          <CardTitle>Legal clauses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IP Transfer */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={ipTransfer}
              onChange={(e) => setIpTransfer(e.target.checked)}
            />
            <span className="text-sm">{IP_TRANSFER_TEXT}</span>
          </label>

          <Separator />

          {/* Confidentiality */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={confidentiality}
              onChange={(e) => setConfidentiality(e.target.checked)}
            />
            <span className="text-sm">{CONFIDENTIALITY_TEXT}</span>
          </label>

          <Separator />

          {/* Kill fee */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={killFee}
              onChange={(e) => setKillFee(e.target.checked)}
            />
            <span className="text-sm font-medium">
              Kill fee applies if project is cancelled after kickoff
            </span>
          </label>
          {killFee ? (
            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="killFeePercent">Kill fee %</Label>
              <Input
                id="killFeePercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={killFeePercent}
                onChange={(e) => setKillFeePercent(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                {killFeeClauseText(killFeePercent)}
              </p>
            </div>
          ) : null}

          <Separator />

          {/* Portfolio rights */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={portfolioRights}
              onChange={(e) => setPortfolioRights(e.target.checked)}
            />
            <span className="text-sm">{PORTFOLIO_RIGHTS_TEXT}</span>
          </label>

          <Separator />

          {/* Out of scope */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={outOfScopeClause}
              onChange={(e) => setOutOfScopeClause(e.target.checked)}
            />
            <span className="text-sm">
              {outOfScopeClauseText(
                outOfScopeRate === "" ? null : Number(outOfScopeRate),
                currency,
              )}
            </span>
          </label>
          {outOfScopeClause ? (
            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="outOfScopeRate">
                Out-of-scope hourly rate ({currency}, optional)
              </Label>
              <Input
                id="outOfScopeRate"
                type="number"
                min="0"
                step="1"
                value={outOfScopeRate}
                onChange={(e) => setOutOfScopeRate(e.target.value)}
              />
            </div>
          ) : null}

          <Separator />

          {/* Limitation of liability */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={limitationOfLiability}
              onChange={(e) => setLimitationOfLiability(e.target.checked)}
            />
            <span className="text-sm">{LIMITATION_OF_LIABILITY_TEXT}</span>
          </label>

          <Separator />

          {/* Termination notice */}
          <div className="space-y-2 max-w-[200px]">
            <Label htmlFor="terminationNoticeDays">Termination notice (days)</Label>
            <Input
              id="terminationNoticeDays"
              type="number"
              min="1"
              step="1"
              value={terminationNoticeDays}
              onChange={(e) => setTerminationNoticeDays(Number(e.target.value))}
            />
          </div>

          <Separator />

          {/* Governing law */}
          <div className="space-y-2">
            <Label htmlFor="governingLaw">Governing law</Label>
            <Input
              id="governingLaw"
              value={governingLaw}
              onChange={(e) => setGoverningLaw(e.target.value)}
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
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create agreement"}
        </Button>
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
