"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type Agreement,
  type DeliverableItem,
  type DeliverablePriority,
  type ScopeOfWorkItem,
  inputClassName,
} from "../_lib/agreements";

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {needsInvalidateWarning ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-200">
            This agreement has already been sent to the client. Editing will
            invalidate the previous signing link.
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-amber-100">
            <input
              type="checkbox"
              checked={confirmInvalidate}
              onChange={(e) => setConfirmInvalidate(e.target.checked)}
              className="mt-0.5"
            />
            I understand — reset signing and require re-sign & re-send
          </label>
        </div>
      ) : null}

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Agreement details</h2>
        <div className="mt-4">
          <label htmlFor="title" className="mb-1.5 block text-sm text-neutral-300">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder='Brand Identity — Ajoni Technologies'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClassName}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Client</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clientName" className="mb-1.5 block text-sm text-neutral-300">
              Client name
            </label>
            <input
              id="clientName"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="clientCompany" className="mb-1.5 block text-sm text-neutral-300">
              Company
            </label>
            <input
              id="clientCompany"
              type="text"
              required
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="clientEmail" className="mb-1.5 block text-sm text-neutral-300">
              Email
            </label>
            <input
              id="clientEmail"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="clientRepresentative" className="mb-1.5 block text-sm text-neutral-300">
              Representative name
            </label>
            <input
              id="clientRepresentative"
              type="text"
              required
              value={clientRepresentative}
              onChange={(e) => setClientRepresentative(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <label htmlFor="projectOverview" className="text-sm font-medium text-white">
          Project overview
        </label>
        <textarea
          id="projectOverview"
          rows={5}
          required
          value={projectOverview}
          onChange={(e) => setProjectOverview(e.target.value)}
          placeholder="Describe the project goals, context, and expected outcomes…"
          className={`${inputClassName} mt-4 resize-y`}
        />
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Scope of work</h2>
          <button
            type="button"
            onClick={() => setScopeOfWork((items) => [...items, createScopeItem()])}
            className="text-sm text-neutral-300 hover:text-white"
          >
            + Add row
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {scopeOfWork.map((item) => (
            <div key={item.id} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="Task name"
                value={item.task}
                onChange={(e) => updateScope(item.id, "task", e.target.value)}
                className={`${inputClassName} flex-1`}
              />
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={item.hours}
                onChange={(e) =>
                  updateScope(item.id, "hours", Number(e.target.value))
                }
                className={`${inputClassName} w-24`}
              />
              <button
                type="button"
                onClick={() =>
                  setScopeOfWork((items) =>
                    items.length === 1
                      ? items
                      : items.filter((i) => i.id !== item.id),
                  )
                }
                disabled={scopeOfWork.length === 1}
                className="text-sm text-neutral-500 hover:text-red-400 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Deliverables</h2>
          <button
            type="button"
            onClick={() =>
              setDeliverables((items) => [...items, createDeliverable()])
            }
            className="text-sm text-neutral-300 hover:text-white"
          >
            + Add row
          </button>
        </div>
        <div className="mt-4 space-y-3">
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
                className={`${inputClassName} w-24`}
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
              </select>
              <input
                type="text"
                required
                placeholder="Deliverable name"
                value={item.item}
                onChange={(e) => updateDeliverable(item.id, "item", e.target.value)}
                className={`${inputClassName} flex-1`}
              />
              <button
                type="button"
                onClick={() =>
                  setDeliverables((items) =>
                    items.length === 1
                      ? items
                      : items.filter((i) => i.id !== item.id),
                  )
                }
                disabled={deliverables.length === 1}
                className="text-sm text-neutral-500 hover:text-red-400 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <label htmlFor="timeline" className="text-sm font-medium text-white">
          Timeline
        </label>
        <textarea
          id="timeline"
          rows={3}
          required
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. Week 1–2: Discovery, Week 3–4: Design…"
          className={`${inputClassName} mt-4 resize-y`}
        />
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-white">Payment</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="hourlyRate" className="mb-1.5 block text-sm text-neutral-300">
              Hourly rate (optional)
            </label>
            <input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="fixedCost" className="mb-1.5 block text-sm text-neutral-300">
              Fixed cost (optional)
            </label>
            <input
              id="fixedCost"
              type="number"
              min="0"
              step="0.01"
              value={fixedCost}
              onChange={(e) => setFixedCost(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="advancePercent" className="mb-1.5 block text-sm text-neutral-300">
              Advance %
            </label>
            <input
              id="advancePercent"
              type="number"
              min="0"
              max="100"
              value={advancePercent}
              onChange={(e) => setAdvancePercent(e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="paymentNotes" className="mb-1.5 block text-sm text-neutral-300">
            Payment notes (optional)
          </label>
          <textarea
            id="paymentNotes"
            rows={3}
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Bank details, payment schedule, etc."
            className={`${inputClassName} resize-y`}
          />
        </div>
      </section>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          {submitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create agreement"}
        </button>
        <Link
          href={cancelHref}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
