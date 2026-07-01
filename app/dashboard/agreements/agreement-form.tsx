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
import { EmailListField } from "@/components/dashboard/EmailListField";
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
  MILESTONE_PAYMENT_METHOD,
  outOfScopeClauseText,
  normalizeScopeOfWork,
  parseClientEmails,
  type Agreement,
  type AgreementCurrency,
  type DeliverableItem,
  type DeliverablePhase,
  type DeliverablePhaseItem,
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

function createPhaseItem(): DeliverablePhaseItem {
  return {
    id: crypto.randomUUID(),
    deliverable: "",
    timeline: "",
    effortHours: null,
    cost: null,
    notes: "",
  };
}

function createPhase(index: number): DeliverablePhase {
  return {
    id: crypto.randomUUID(),
    name: `Phase ${index}`,
    items: [createPhaseItem()],
  };
}

function createMilestone(): MilestoneItem {
  return { id: crypto.randomUUID(), name: "", percent: 0, amount: 0, dueOn: "" };
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
  const [clientEmails, setClientEmails] = useState<string[]>(() => {
    const emails = agreement?.clientEmails?.length
      ? agreement.clientEmails
      : parseClientEmails(agreement?.clientEmail ?? "");
    return emails.length > 0 ? emails : [""];
  });
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
  const [deliverablePhases, setDeliverablePhases] = useState<DeliverablePhase[]>(
    agreement?.deliverablePhases?.length
      ? agreement.deliverablePhases
      : [createPhase(1)],
  );
  const totalProjectCost = useMemo(() => {
    return deliverablePhases.reduce(
      (sum, phase) =>
        sum + phase.items.reduce((s, item) => s + (item.cost ?? 0), 0),
      0,
    );
  }, [deliverablePhases]);

  const totalTimeline = useMemo(() => {
    let total = 0;
    for (const phase of deliverablePhases) {
      for (const item of phase.items) {
        const match = item.timeline.match(/(\d+\.?\d*)/);
        if (match) total += parseFloat(match[1]);
      }
    }
    if (total === 0) return "";
    return total % 1 === 0 ? `${total} Weeks` : `${total} Weeks`;
  }, [deliverablePhases]);
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

  function buildPayload(isDraft: boolean) {
    return {
      title,
      clientName,
      clientCompany,
      clientEmails,
      clientPhone,
      clientAddress,
      clientGstNumber: gstNumber,
      clientRepresentative,
      agreementDate,
      projectOverview,
      scopeOfWork: normalizeScopeOfWork(scopeOfWork),
      deliverables,
      deliverablePhases,
      totalTimeline,
      milestones: paymentStructure === "milestone" ? milestones : [],
      timeline: totalTimeline || timeline,
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
      isDraft,
    };
  }

  async function saveAgreement(isDraft: boolean) {
    setError(null);

    if (!isDraft && needsInvalidateWarning && !confirmInvalidate) {
      setError(
        "Please confirm that you understand editing will invalidate the previous signing link.",
      );
      return;
    }

    setSubmitting(true);

    const payload = buildPayload(isDraft);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveAgreement(false);
  }

  async function handleSaveDraft() {
    await saveAgreement(true);
  }

  const cancelHref = isEdit
    ? `/dashboard/agreements/${agreement!.id}`
    : "/dashboard/agreements";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="space-y-2 sm:col-span-2">
            <EmailListField
              id="clientEmail"
              emails={clientEmails}
              onChange={setClientEmails}
              required
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
              <div className="space-y-2 sm:col-span-10">
                <Label className="sm:sr-only">Task</Label>
                <Input
                  required
                  placeholder="Task name"
                  value={item.task}
                  onChange={(e) => updateScope(item.id, "task", e.target.value)}
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

      {/* Deliverables — phased breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deliverables &amp; Cost Breakdown</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Group deliverables into phases. Each row gets a timeline, effort estimate, and cost.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setDeliverablePhases((phases) => [
                ...phases,
                createPhase(phases.length + 1),
              ])
            }
          >
            Add phase
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {deliverablePhases.map((phase, phaseIdx) => (
            <div key={phase.id} className="space-y-3">
              {/* Phase header */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`Phase ${phaseIdx + 1} — Name`}
                  value={phase.name}
                  onChange={(e) =>
                    setDeliverablePhases((phases) =>
                      phases.map((p) =>
                        p.id === phase.id ? { ...p, name: e.target.value } : p,
                      ),
                    )
                  }
                  className="flex-1 font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeliverablePhases((phases) =>
                      phases.length === 1
                        ? phases
                        : phases.filter((p) => p.id !== phase.id),
                    )
                  }
                  disabled={deliverablePhases.length === 1}
                >
                  Remove phase
                </Button>
              </div>

              {/* Column headers */}
              <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                <span className="col-span-3">Deliverable</span>
                <span className="col-span-2">Timeline</span>
                <span className="col-span-1">Hrs</span>
                <span className="col-span-2">Cost ({currency})</span>
                <span className="col-span-3">Notes</span>
                <span className="col-span-1" />
              </div>

              {/* Rows */}
              {phase.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-12"
                >
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs sm:sr-only">Deliverable</Label>
                    <Input
                      required
                      placeholder="Deliverable name"
                      value={item.deliverable}
                      onChange={(e) =>
                        setDeliverablePhases((phases) =>
                          phases.map((p) =>
                            p.id === phase.id
                              ? {
                                  ...p,
                                  items: p.items.map((r) =>
                                    r.id === item.id
                                      ? { ...r, deliverable: e.target.value }
                                      : r,
                                  ),
                                }
                              : p,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs sm:sr-only">Timeline</Label>
                    <Input
                      placeholder="e.g. 1 Week"
                      value={item.timeline}
                      onChange={(e) =>
                        setDeliverablePhases((phases) =>
                          phases.map((p) =>
                            p.id === phase.id
                              ? {
                                  ...p,
                                  items: p.items.map((r) =>
                                    r.id === item.id
                                      ? { ...r, timeline: e.target.value }
                                      : r,
                                  ),
                                }
                              : p,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-xs sm:sr-only">Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Hrs"
                      value={item.effortHours ?? ""}
                      onChange={(e) => {
                        const hrs = e.target.value === "" ? null : Number(e.target.value);
                        const rate = hourlyRate === "" ? null : Number(hourlyRate);
                        const autoCost = hrs != null && rate != null ? hrs * rate : null;
                        setDeliverablePhases((phases) =>
                          phases.map((p) =>
                            p.id === phase.id
                              ? {
                                  ...p,
                                  items: p.items.map((r) =>
                                    r.id === item.id
                                      ? {
                                          ...r,
                                          effortHours: hrs,
                                          cost: autoCost ?? r.cost,
                                        }
                                      : r,
                                  ),
                                }
                              : p,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs sm:sr-only">Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Cost"
                      value={item.cost ?? ""}
                      onChange={(e) =>
                        setDeliverablePhases((phases) =>
                          phases.map((p) =>
                            p.id === phase.id
                              ? {
                                  ...p,
                                  items: p.items.map((r) =>
                                    r.id === item.id
                                      ? {
                                          ...r,
                                          cost:
                                            e.target.value === ""
                                              ? null
                                              : Number(e.target.value),
                                        }
                                      : r,
                                  ),
                                }
                              : p,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs sm:sr-only">Notes</Label>
                    <Input
                      placeholder="Notes (optional)"
                      value={item.notes}
                      onChange={(e) =>
                        setDeliverablePhases((phases) =>
                          phases.map((p) =>
                            p.id === phase.id
                              ? {
                                  ...p,
                                  items: p.items.map((r) =>
                                    r.id === item.id
                                      ? { ...r, notes: e.target.value }
                                      : r,
                                  ),
                                }
                              : p,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeliverablePhases((phases) =>
                          phases.map((p) =>
                            p.id === phase.id
                              ? {
                                  ...p,
                                  items:
                                    p.items.length === 1
                                      ? p.items
                                      : p.items.filter((r) => r.id !== item.id),
                                }
                              : p,
                          ),
                        )
                      }
                      disabled={phase.items.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDeliverablePhases((phases) =>
                    phases.map((p) =>
                      p.id === phase.id
                        ? { ...p, items: [...p.items, createPhaseItem()] }
                        : p,
                    ),
                  )
                }
              >
                + Add row
              </Button>
            </div>
          ))}

          <Separator />

          {(totalProjectCost > 0 || totalTimeline) ? (
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {totalProjectCost > 0 ? (
                <p>
                  Total project cost:{" "}
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(totalProjectCost)}
                  </span>
                </p>
              ) : null}
              {totalTimeline ? (
                <p>
                  Estimated timeline:{" "}
                  <span className="font-medium text-foreground">{totalTimeline}</span>
                </p>
              ) : null}
            </div>
          ) : null}
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
              {/* Column headers */}
              <div className="hidden grid-cols-12 gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid">
                <span className="col-span-7">Milestone</span>
                <span className="col-span-2 text-right">%</span>
                <span className="col-span-2 text-right">Amount ({currency})</span>
                <span className="col-span-1" />
              </div>
              {milestones.map((item) => {
                const computedAmount = totalProjectCost > 0
                  ? Math.round((item.percent / 100) * totalProjectCost)
                  : item.amount;
                return (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-12 items-center"
                  >
                    <div className="space-y-1 sm:col-span-7">
                      <Label className="text-xs sm:sr-only">Milestone</Label>
                      <Input
                        required
                        placeholder='e.g. "10% Advance (Before project start)"'
                        value={item.name}
                        onChange={(e) => updateMilestone(item.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs sm:sr-only">%</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="%"
                        value={item.percent || ""}
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          const amt = totalProjectCost > 0 ? Math.round((pct / 100) * totalProjectCost) : 0;
                          setMilestones((items) =>
                            items.map((m) => m.id === item.id ? { ...m, percent: pct, amount: amt } : m)
                          );
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2 text-right text-sm font-medium">
                      {computedAmount > 0
                        ? new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0 }).format(computedAmount)
                        : "—"}
                    </div>
                    <div className="flex items-center justify-end sm:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMilestones((items) =>
                            items.length === 1 ? items : items.filter((i) => i.id !== item.id),
                          )
                        }
                        disabled={milestones.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                );
              })}
              {/* Total + percentage check */}
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="font-medium">Total</span>
                <span className="text-muted-foreground">
                  {milestones.reduce((s, m) => s + (m.percent || 0), 0)}% ={" "}
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0 }).format(
                      milestones.reduce((s, m) => s + Math.round((m.percent / 100) * totalProjectCost), 0)
                    )}
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{MILESTONE_PAYMENT_METHOD}</p>
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

          {/* Early termination */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={killFee}
              onChange={(e) => setKillFee(e.target.checked)}
            />
            <span className="text-sm font-medium">
              Early termination clause
            </span>
          </label>
          {killFee ? (
            <p className="max-w-[520px] text-sm text-muted-foreground">
              {killFeeClauseText()}
            </p>
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
        {!isEdit || agreement?.status === "draft" ? (
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={handleSaveDraft}
          >
            Save as draft
          </Button>
        ) : null}
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
