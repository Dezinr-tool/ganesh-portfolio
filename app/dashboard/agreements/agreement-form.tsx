"use client";

import Link from "next/link";
import { Special_Elite } from "next/font/google";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
import "./agreement-form.css";

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
});

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

function formatAgreementDateDisplay(isoDate: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00`));
}

type AgreementFormProps = {
  agreement?: Agreement;
};

function DocSection({
  title,
  helperText,
  children,
  action,
}: {
  title: string;
  helperText?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="agreement-doc-section">
      {action ? (
        <div className="agreement-doc-section-header">
          <div>
            <h2 className={`agreement-doc-heading ${specialElite.className}`}>
              {title}
            </h2>
            {helperText ? (
              <p className="agreement-doc-helper">{helperText}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : (
        <>
          <h2 className={`agreement-doc-heading ${specialElite.className}`}>
            {title}
          </h2>
          {helperText ? (
            <p className="agreement-doc-helper">{helperText}</p>
          ) : null}
        </>
      )}
      {children}
    </section>
  );
}

function DocField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`agreement-doc-field ${className ?? ""}`}>
      <label className="agreement-doc-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AgreementForm({ agreement }: AgreementFormProps) {
  const isEdit = Boolean(agreement);
  const router = useRouter();
  const needsInvalidateWarning =
    isEdit && agreement?.status === "awaiting_client";

  const [title, setTitle] = useState(agreement?.title ?? "");
  const titleRef = useRef(agreement?.title ?? "");
  const [clientName, setClientName] = useState(agreement?.clientName ?? "");
  const [clientCompany, setClientCompany] = useState(
    agreement?.clientCompany ?? "",
  );
  const [clientEmail, setClientEmail] = useState(agreement?.clientEmail ?? "");
  const [clientPhone, setClientPhone] = useState(agreement?.clientPhone ?? "");
  const [clientAddress, setClientAddress] = useState(
    agreement?.clientAddress ?? "",
  );
  const [gstNumber, setGstNumber] = useState(agreement?.clientGstNumber ?? "");
  const [clientRepresentative, setClientRepresentative] = useState(
    agreement?.clientRepresentative ?? "",
  );
  const [agreementDate, setAgreementDate] = useState(
    agreement?.agreementDate ?? todayIsoDate(),
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
  const [paymentNotes, setPaymentNotes] = useState(
    agreement?.paymentNotes ?? "",
  );
  const [paymentStructure, setPaymentStructure] = useState<PaymentStructure>(
    agreement?.paymentStructure ?? "50_50",
  );
  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    agreement?.milestones?.length
      ? agreement.milestones
      : [createMilestone()],
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
  const [killFeePercent, setKillFeePercent] = useState(
    agreement?.killFeePercent ?? 50,
  );
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

  const agreementDateDisplay = useMemo(
    () => formatAgreementDateDisplay(agreementDate),
    [agreementDate],
  );
  const clientDisplayName = clientName.trim() || "[Client Name]";

  function updateScope(
    id: string,
    field: keyof ScopeOfWorkItem,
    value: string | number | null,
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

  function updateMilestone(
    id: string,
    field: keyof MilestoneItem,
    value: string | number,
  ) {
    setMilestones((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function handleClientSelectionChange(client: SavedClient | null) {
    setSavedClientSelected(client !== null);
    if (client) {
      setClientDetailsEditing(false);
      const domTitle =
        typeof document !== "undefined"
          ? (
              document.getElementById("title") as HTMLInputElement | null
            )?.value.trim()
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
    if (patch.representativeName !== undefined) {
      setClientRepresentative(patch.representativeName);
    }
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
    <div className="agreement-form-root">
      <form onSubmit={handleSubmit} className="agreement-form-inner">
        <header className="agreement-doc-header">
          <h1 className={`agreement-doc-title ${specialElite.className}`}>
            DESIGN SERVICES AGREEMENT
          </h1>
          <p className={`agreement-doc-subtitle ${specialElite.className}`}>
            This agreement is entered into between Ganesh Das (Designer) and{" "}
            {clientDisplayName} (Client)
          </p>
          <p className="agreement-doc-date">Date: {agreementDateDisplay}</p>
        </header>

        <DocSection title="Saved Client">
          <ClientSelector
            values={clientFormValues}
            onChange={handleClientChange}
            collapseAfterSelect
            onSelectionChange={handleClientSelectionChange}
          />
        </DocSection>

        {needsInvalidateWarning ? (
          <div className="agreement-form-warning">
            <p>
              This agreement has already been sent to the client. Editing will
              invalidate the previous signing link.
            </p>
            <label>
              <input
                type="checkbox"
                checked={confirmInvalidate}
                onChange={(e) => setConfirmInvalidate(e.target.checked)}
              />
              I understand — reset signing and require re-sign & re-send
            </label>
          </div>
        ) : null}

        <DocSection title="Agreement Details">
          <DocField label="Title" htmlFor="title">
            <input
              id="title"
              required
              placeholder={
                savedClientSelected
                  ? undefined
                  : "Client Name — Design Project"
              }
              value={title}
              onChange={(e) => {
                titleRef.current = e.target.value;
                setTitle(e.target.value);
              }}
              className="agreement-doc-input"
            />
          </DocField>
          <DocField label="Agreement Date" htmlFor="agreementDate">
            <input
              id="agreementDate"
              type="date"
              required
              value={agreementDate}
              onChange={(e) => setAgreementDate(e.target.value)}
              className="agreement-doc-input"
            />
          </DocField>
        </DocSection>

        <DocSection title="Client">
          {savedClientSelected && !clientDetailsEditing ? (
            <div className="agreement-client-summary">
              <p>{clientName}</p>
              <p>{clientCompany}</p>
              <p>{clientEmail}</p>
              {clientPhone.trim() ? <p>{clientPhone}</p> : null}
              {clientRepresentative.trim() ? (
                <p>Representative: {clientRepresentative}</p>
              ) : null}
              <button
                type="button"
                className="agreement-doc-edit-link"
                onClick={() => setClientDetailsEditing(true)}
              >
                Edit details
              </button>
            </div>
          ) : (
            <div className="agreement-doc-grid agreement-doc-grid-2">
              {!savedClientSelected ? (
                <DocField label="Client name" htmlFor="clientName">
                  <input
                    id="clientName"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="agreement-doc-input"
                  />
                </DocField>
              ) : null}
              <DocField label="Company" htmlFor="clientCompany">
                <input
                  id="clientCompany"
                  required
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="agreement-doc-input"
                />
              </DocField>
              <DocField label="Email" htmlFor="clientEmail">
                <input
                  id="clientEmail"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="agreement-doc-input"
                />
              </DocField>
              <DocField label="Phone" htmlFor="clientPhone">
                <input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="agreement-doc-input"
                />
              </DocField>
              <DocField
                label="Address"
                htmlFor="clientAddress"
                className="agreement-doc-span-2"
              >
                <textarea
                  id="clientAddress"
                  rows={3}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="agreement-doc-textarea"
                />
              </DocField>
              <DocField label="GST number" htmlFor="gstNumber">
                <input
                  id="gstNumber"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="agreement-doc-input"
                />
              </DocField>
              <DocField label="Representative name" htmlFor="clientRepresentative">
                <input
                  id="clientRepresentative"
                  required
                  value={clientRepresentative}
                  onChange={(e) => setClientRepresentative(e.target.value)}
                  className="agreement-doc-input"
                />
              </DocField>
            </div>
          )}
        </DocSection>

        <DocSection title="Project Overview">
          <textarea
            id="projectOverview"
            rows={5}
            required
            value={projectOverview}
            onChange={(e) => setProjectOverview(e.target.value)}
            placeholder="Describe the project goals, context, and expected outcomes…"
            className="agreement-doc-textarea"
          />
        </DocSection>

        <DocSection
          title="Scope of Work (What we will do)"
          helperText="List the high-level work areas and effort. e.g. Brand Strategy, Logo Design, Website UI"
          action={
            <button
              type="button"
              className="agreement-doc-add"
              onClick={() => setScopeOfWork((items) => [...items, createScopeItem()])}
            >
              + Add row
            </button>
          }
        >
          {scopeOfWork.map((item) => (
            <div key={item.id} className="agreement-doc-row">
              <input
                required
                placeholder="Task name"
                value={item.task}
                onChange={(e) => updateScope(item.id, "task", e.target.value)}
                className="agreement-doc-input"
              />
              <input
                type="number"
                min="0.5"
                step="0.5"
                placeholder="—"
                value={item.hours ?? ""}
                onChange={(e) =>
                  updateScope(
                    item.id,
                    "hours",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className="agreement-doc-input agreement-doc-hours"
                aria-label="Est. Hours (optional)"
              />
              <button
                type="button"
                className="agreement-doc-remove"
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
              </button>
            </div>
          ))}
        </DocSection>

        <DocSection
          title="Deliverables (What you will receive)"
          helperText="List the specific files/outputs the client receives. e.g. Logo files (AI, PNG, PDF), Brand Guidelines PDF"
          action={
            <button
              type="button"
              className="agreement-doc-add"
              onClick={() =>
                setDeliverables((items) => [...items, createDeliverable()])
              }
            >
              + Add row
            </button>
          }
        >
          {deliverables.map((item) => (
            <div key={item.id} className="agreement-doc-row">
              <select
                value={item.priority}
                onChange={(e) =>
                  updateDeliverable(
                    item.id,
                    "priority",
                    e.target.value as DeliverablePriority,
                  )
                }
                className="agreement-doc-select agreement-doc-priority"
                aria-label="Priority"
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
              </select>
              <input
                required
                placeholder="Deliverable name"
                value={item.item}
                onChange={(e) => updateDeliverable(item.id, "item", e.target.value)}
                className="agreement-doc-input"
              />
              <button
                type="button"
                className="agreement-doc-remove"
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
              </button>
            </div>
          ))}
        </DocSection>

        <DocSection
          title="Approval & Acceptance"
          helperText="Number of days client has to review and give feedback on each deliverable"
        >
          <DocField label="Review window (days)" htmlFor="reviewWindowDays">
            <input
              id="reviewWindowDays"
              type="number"
              min="1"
              step="1"
              value={reviewWindowDays}
              onChange={(e) => setReviewWindowDays(Number(e.target.value))}
              className="agreement-doc-input"
            />
          </DocField>
          <label className="agreement-doc-clause">
            <input
              type="checkbox"
              checked={deemedAcceptance}
              onChange={(e) => setDeemedAcceptance(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              If no feedback is received within the review window, deliverables
              are deemed accepted
            </span>
          </label>
        </DocSection>

        <DocSection title="Timeline">
          <textarea
            id="timeline"
            rows={3}
            required
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="e.g. Week 1–2: Discovery, Week 3–4: Design…"
            className="agreement-doc-textarea"
          />
        </DocSection>

        <DocSection title="Payment">
          <DocField label="Currency" htmlFor="currency">
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as AgreementCurrency)}
              className="agreement-doc-select"
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </DocField>
          <div className="agreement-doc-grid agreement-doc-grid-2">
            <DocField label="Hourly rate (optional)" htmlFor="hourlyRate">
              <input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="agreement-doc-input"
              />
            </DocField>
            <DocField label="Fixed cost (optional)" htmlFor="fixedCost">
              <input
                id="fixedCost"
                type="number"
                min="0"
                step="0.01"
                value={fixedCost}
                onChange={(e) => setFixedCost(e.target.value)}
                className="agreement-doc-input"
              />
            </DocField>
          </div>
          <DocField label="Payment notes (optional)" htmlFor="paymentNotes">
            <textarea
              id="paymentNotes"
              rows={3}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Bank details, payment schedule, etc."
              className="agreement-doc-textarea"
            />
          </DocField>
        </DocSection>

        <DocSection title="Payment Terms">
          <DocField label="Payment structure" htmlFor="paymentStructure">
            <select
              id="paymentStructure"
              value={paymentStructure}
              onChange={(e) =>
                setPaymentStructure(e.target.value as PaymentStructure)
              }
              className="agreement-doc-select"
            >
              {PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </DocField>
          {paymentStructure === "milestone" ? (
            <div className="agreement-doc-milestones">
              <div className="agreement-doc-section-header">
                <p className="agreement-doc-label">Milestones</p>
                <button
                  type="button"
                  className="agreement-doc-add"
                  onClick={() =>
                    setMilestones((items) => [...items, createMilestone()])
                  }
                >
                  + Add row
                </button>
              </div>
              {milestones.map((item) => (
                <div key={item.id} className="agreement-doc-row">
                  <input
                    required
                    placeholder="Milestone name"
                    value={item.name}
                    onChange={(e) =>
                      updateMilestone(item.id, "name", e.target.value)
                    }
                    className="agreement-doc-input"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder={`Amount (${currency})`}
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateMilestone(item.id, "amount", Number(e.target.value))
                    }
                    className="agreement-doc-input agreement-doc-hours"
                    aria-label="Amount"
                  />
                  <input
                    required
                    placeholder='Due on (e.g. "On delivery of wireframes")'
                    value={item.dueOn}
                    onChange={(e) =>
                      updateMilestone(item.id, "dueOn", e.target.value)
                    }
                    className="agreement-doc-input"
                  />
                  <button
                    type="button"
                    className="agreement-doc-remove"
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
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {paymentStructure === "custom" ? (
            <DocField label="Custom payment terms" htmlFor="customPaymentTerms">
              <textarea
                id="customPaymentTerms"
                rows={3}
                value={customPaymentTerms}
                onChange={(e) => setCustomPaymentTerms(e.target.value)}
                className="agreement-doc-textarea"
              />
            </DocField>
          ) : null}
          <label className="agreement-doc-clause">
            <input
              id="latePaymentClause"
              type="checkbox"
              checked={latePaymentClause}
              onChange={(e) => setLatePaymentClause(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              Late payment clause
            </span>
          </label>
          {latePaymentClause ? (
            <div className="agreement-doc-grid agreement-doc-grid-2">
              <DocField label="Grace period (days)" htmlFor="latePaymentDays">
                <input
                  id="latePaymentDays"
                  type="number"
                  min="1"
                  step="1"
                  value={latePaymentDays}
                  onChange={(e) => setLatePaymentDays(Number(e.target.value))}
                  className="agreement-doc-input"
                />
              </DocField>
              <DocField label="Monthly interest %" htmlFor="latePaymentInterest">
                <input
                  id="latePaymentInterest"
                  type="number"
                  min="0"
                  step="0.01"
                  value={latePaymentInterest}
                  onChange={(e) =>
                    setLatePaymentInterest(Number(e.target.value))
                  }
                  className="agreement-doc-input"
                />
              </DocField>
            </div>
          ) : null}
          {latePaymentClause ? (
            <p className="agreement-doc-helper">
              {latePaymentClauseText(latePaymentDays, latePaymentInterest)}
            </p>
          ) : null}
        </DocSection>

        <DocSection title="Revision Policy">
          <DocField label="Revisions included" htmlFor="revisionsIncluded">
            <input
              id="revisionsIncluded"
              type="number"
              min="0"
              step="1"
              value={revisionsIncluded}
              onChange={(e) => setRevisionsIncluded(Number(e.target.value))}
              className="agreement-doc-input"
            />
          </DocField>
          <DocField label="Revision scope note" htmlFor="revisionScopeNote">
            <textarea
              id="revisionScopeNote"
              rows={3}
              value={revisionScopeNote}
              onChange={(e) => setRevisionScopeNote(e.target.value)}
              placeholder={DEFAULT_REVISION_SCOPE_NOTE}
              className="agreement-doc-textarea"
            />
          </DocField>
        </DocSection>

        <DocSection title="Legal Clauses">
          <label className="agreement-doc-clause">
            <input
              type="checkbox"
              checked={ipTransfer}
              onChange={(e) => setIpTransfer(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              {IP_TRANSFER_TEXT}
            </span>
          </label>
          <label className="agreement-doc-clause">
            <input
              type="checkbox"
              checked={confidentiality}
              onChange={(e) => setConfidentiality(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              {CONFIDENTIALITY_TEXT}
            </span>
          </label>
          <label className="agreement-doc-clause">
            <input
              id="killFee"
              type="checkbox"
              checked={killFee}
              onChange={(e) => setKillFee(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              Kill fee applies if project is cancelled after kickoff
            </span>
          </label>
          {killFee ? (
            <DocField label="Kill fee %" htmlFor="killFeePercent">
              <input
                id="killFeePercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={killFeePercent}
                onChange={(e) => setKillFeePercent(Number(e.target.value))}
                className="agreement-doc-input"
              />
            </DocField>
          ) : null}
          {killFee ? (
            <p className="agreement-doc-helper">
              {killFeeClauseText(killFeePercent)}
            </p>
          ) : null}
          <label className="agreement-doc-clause">
            <input
              type="checkbox"
              checked={portfolioRights}
              onChange={(e) => setPortfolioRights(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              {PORTFOLIO_RIGHTS_TEXT}
            </span>
          </label>
          <label className="agreement-doc-clause">
            <input
              type="checkbox"
              checked={outOfScopeClause}
              onChange={(e) => setOutOfScopeClause(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              {outOfScopeClauseText(
                outOfScopeRate === "" ? null : Number(outOfScopeRate),
                currency,
              )}
            </span>
          </label>
          {outOfScopeClause ? (
            <DocField
              label={`Out-of-scope hourly rate (${currency})`}
              htmlFor="outOfScopeRate"
            >
              <input
                id="outOfScopeRate"
                type="number"
                min="0"
                step="1"
                value={outOfScopeRate}
                onChange={(e) => setOutOfScopeRate(e.target.value)}
                className="agreement-doc-input"
              />
            </DocField>
          ) : null}
          <label className="agreement-doc-clause">
            <input
              type="checkbox"
              checked={limitationOfLiability}
              onChange={(e) => setLimitationOfLiability(e.target.checked)}
              className="agreement-doc-toggle"
            />
            <span className={`agreement-doc-clause-text ${specialElite.className}`}>
              {LIMITATION_OF_LIABILITY_TEXT}
            </span>
          </label>
          <DocField label="Termination notice (days)" htmlFor="terminationNoticeDays">
            <input
              id="terminationNoticeDays"
              type="number"
              min="1"
              step="1"
              value={terminationNoticeDays}
              onChange={(e) => setTerminationNoticeDays(Number(e.target.value))}
              className="agreement-doc-input"
            />
          </DocField>
          <DocField label="Governing law" htmlFor="governingLaw">
            <input
              id="governingLaw"
              value={governingLaw}
              onChange={(e) => setGoverningLaw(e.target.value)}
              className="agreement-doc-input"
            />
          </DocField>
        </DocSection>

        {error ? <div className="agreement-form-error">{error}</div> : null}

        <button type="submit" disabled={submitting} className="agreement-form-submit">
          {submitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create agreement"}
        </button>

        <Link href={cancelHref} className="agreement-form-cancel">
          Cancel
        </Link>
      </form>
    </div>
  );
}
