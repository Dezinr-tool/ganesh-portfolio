import type { Agreement } from "@/app/dashboard/_lib/agreements";
import {
  CONFIDENTIALITY_TEXT,
  DEEMED_ACCEPTANCE_TEXT,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatClientEmails,
  IP_TRANSFER_TEXT,
  killFeeClauseText,
  latePaymentClauseText,
  LIMITATION_OF_LIABILITY_TEXT,
  MILESTONE_INVOICE_TERMS,
  MILESTONE_PAYMENT_INTRO,
  MILESTONE_PAYMENT_METHOD,
  outOfScopeClauseText,
  paymentStructureLabel,
  PORTFOLIO_RIGHTS_TEXT,
  totalDeliverablesCost,
  reviewWindowClauseText,
  scopeHasHours,
  terminationNoticeClauseText,
  totalScopeHours,
} from "@/app/dashboard/_lib/agreements";
import { DesignTokensScope } from "@/components/design-tokens-scope";
import type { DesignTokens } from "@/lib/design-tokens-shared";
import { EditableClientEmail } from "./editable-client-email";

type AgreementDocumentProps = {
  agreement: Agreement;
  showSignatures?: boolean;
  allowEmailEdit?: boolean;
  designTokens: DesignTokens;
};

export function AgreementDocument({
  agreement,
  showSignatures = true,
  allowEmailEdit = false,
  designTokens,
}: AgreementDocumentProps) {
  const totalHours = totalScopeHours(agreement.scopeOfWork);
  const showScopeHours = scopeHasHours(agreement.scopeOfWork);
  const currency = agreement.currency;

  return (
    <DesignTokensScope tokens={designTokens}>
    <div className="mx-auto max-w-[800px] bg-[var(--color-bg)] px-[60px] py-[60px] text-[var(--color-text)] shadow-lg">
      {/* Header */}
      <div className="border-b border-[var(--color-text)] pb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Design Services Agreement
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">{agreement.title}</p>
        <p className="mt-1 text-xs text-[var(--color-text)]">
          {formatDate(agreement.agreementDate)}
        </p>
      </div>

      {/* Parties */}
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide">Parties</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--color-text)]">
              Designer
            </p>
            <p className="mt-1 font-semibold">Ganesh Das</p>
            <p className="text-sm text-[var(--color-text)]">Design by Ganesh</p>
            <p className="text-sm text-[var(--color-text)]">
              hello@designbyganesh.com
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--color-text)]">
              Client
            </p>
            <p className="mt-1 font-semibold">{agreement.clientName}</p>
            <p className="text-sm text-[var(--color-text)]">
              {agreement.clientCompany}
            </p>
            {allowEmailEdit ? (
              <EditableClientEmail
                key={agreement.clientEmails.join(",")}
                agreementId={agreement.id}
                emails={agreement.clientEmails}
              />
            ) : (
              <p className="text-sm text-[var(--color-text)]">
                {formatClientEmails(agreement.clientEmails)}
              </p>
            )}
            {agreement.clientPhone ? (
              <p className="text-sm text-[var(--color-text)]">{agreement.clientPhone}</p>
            ) : null}
            {agreement.clientAddress ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                {agreement.clientAddress}
              </p>
            ) : null}
            {agreement.clientGstNumber ? (
              <p className="text-sm text-[var(--color-text)]">
                GST: {agreement.clientGstNumber}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-[var(--color-text)]">
              Representative: {agreement.clientRepresentative}
            </p>
          </div>
        </div>
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Project Overview */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Project Overview
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
          {agreement.projectOverview}
        </p>
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Scope of Work */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Scope of Work
        </h2>
        {showScopeHours ? (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--color-text)]">
                <th className="py-2 pr-4 text-left font-semibold">Task</th>
                <th className="py-2 text-right font-semibold">
                  Est. Hours (optional)
                </th>
              </tr>
            </thead>
            <tbody>
              {agreement.scopeOfWork.map((item) => (
                <tr key={item.id} className="border-b border-[var(--color-text)]">
                  <td className="py-2.5 pr-4">{item.task}</td>
                  <td className="py-2.5 text-right">{item.hours}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--color-text)] font-semibold">
                <td className="py-2.5 pr-4">Total</td>
                <td className="py-2.5 text-right">{totalHours}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm">
            {agreement.scopeOfWork.map((item) => (
              <li key={item.id}>{item.task}</li>
            ))}
          </ul>
        )}
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Deliverables */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Deliverables, Timeline &amp; Cost Breakdown
        </h2>
        {agreement.deliverablePhases?.length > 0 ? (
          <div className="mt-4 space-y-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--color-text)]">
                  <th className="py-2 pr-3 text-left font-semibold w-6">#</th>
                  <th className="py-2 pr-3 text-left font-semibold">Deliverable</th>
                  <th className="py-2 pr-3 text-left font-semibold">Timeline</th>
                  <th className="py-2 pr-3 text-right font-semibold">Hrs</th>
                  <th className="py-2 pr-3 text-right font-semibold">Cost</th>
                  <th className="py-2 text-left font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {agreement.deliverablePhases.map((phase) => (
                  <>
                    <tr key={phase.id} className="bg-foreground text-background">
                      <td colSpan={6} className="py-1.5 px-2 text-xs font-bold uppercase tracking-wide">
                        {phase.name}
                      </td>
                    </tr>
                    {phase.items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-[var(--color-text)] border-opacity-10">
                        <td className="py-2 pr-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 pr-3 font-medium">{item.deliverable}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{item.timeline}</td>
                        <td className="py-2 pr-3 text-right text-muted-foreground">{item.effortHours ?? ""}</td>
                        <td className="py-2 pr-3 text-right">{item.cost != null ? new Intl.NumberFormat("en-IN", { style: "currency", currency: agreement.currency ?? "INR", minimumFractionDigits: 0 }).format(item.cost) : ""}</td>
                        <td className="py-2 text-sm text-muted-foreground">{item.notes}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
            <p className="text-sm font-semibold">
              Total Project Cost:{" "}
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: agreement.currency ?? "INR", minimumFractionDigits: 0 }).format(
                agreement.deliverablePhases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + (i.cost ?? 0), 0), 0)
              )}
              {agreement.totalTimeline ? `  |  Estimated Timeline: ${agreement.totalTimeline}` : ""}
            </p>
          </div>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--color-text)]">
                <th className="py-2 pr-4 text-left font-semibold">Priority</th>
                <th className="py-2 text-left font-semibold">Deliverable</th>
              </tr>
            </thead>
            <tbody>
              {agreement.deliverables.map((item) => (
                <tr key={item.id} className="border-b border-[var(--color-text)]">
                  <td className="py-2.5 pr-4 font-medium">{item.priority}</td>
                  <td className="py-2.5">{item.item}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Approval & Acceptance */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Approval & Acceptance
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-text)]">
          <li>{reviewWindowClauseText(agreement.reviewWindowDays)}</li>
          {agreement.deemedAcceptance ? <li>{DEEMED_ACCEPTANCE_TEXT}</li> : null}
        </ul>
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Timeline */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Timeline</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
          {agreement.timeline}
        </p>
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Payment Terms */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Payment Terms</h2>
        <div className="mt-4 space-y-4 text-sm">
          {agreement.paymentStructure === "milestone" && agreement.milestones.length > 0 ? (
            <>
              <p className="text-[var(--color-text)]">{MILESTONE_PAYMENT_INTRO}</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#B22222" }}>
                    <th className="py-2 px-3 text-left font-semibold text-white">Milestone</th>
                    <th className="py-2 px-3 text-right font-semibold text-white">Percentage</th>
                    <th className="py-2 px-3 text-right font-semibold text-white">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody>
                  {agreement.milestones.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-text)] border-opacity-10">
                      <td className="py-2.5 px-3">{item.name}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{item.percent}%</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(item.amount, currency)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted">
                    <td className="py-2.5 px-3 font-bold">Total Project Cost</td>
                    <td />
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: "#B22222" }}>
                      {formatCurrency(totalDeliverablesCost(agreement.deliverablePhases ?? []) || agreement.milestones.reduce((s, m) => s + m.amount, 0), currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[var(--color-text)]">{MILESTONE_PAYMENT_METHOD}</p>
            </>
          ) : (
            <>
              <p>
                <span className="font-semibold">Payment Structure:</span>{" "}
                {paymentStructureLabel(agreement.paymentStructure)}
              </p>
              {agreement.paymentStructure === "custom" && agreement.customPaymentTerms ? (
                <p className="whitespace-pre-wrap">{agreement.customPaymentTerms}</p>
              ) : null}
              {agreement.hourlyRate !== null ? (
                <p><span className="font-semibold">Hourly Rate:</span> {formatCurrency(agreement.hourlyRate, currency)}/hr</p>
              ) : null}
              {agreement.fixedCost !== null ? (
                <p><span className="font-semibold">Fixed Cost:</span> {formatCurrency(agreement.fixedCost, currency)}</p>
              ) : null}
            </>
          )}
          {agreement.latePaymentClause ? (
            <p className="text-[var(--color-text)]">
              {latePaymentClauseText(agreement.latePaymentDays, agreement.latePaymentInterest)}
            </p>
          ) : null}
          {agreement.paymentNotes ? (
            <p className="whitespace-pre-wrap text-[var(--color-text)]">{agreement.paymentNotes}</p>
          ) : null}
        </div>
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {agreement.paymentStructure === "milestone" ? (
        <section>
          <p className="text-sm text-[var(--color-text)]">{MILESTONE_INVOICE_TERMS}</p>
        </section>
      ) : null}

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Revision Policy */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Revision Policy
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-semibold">Revisions included:</span>{" "}
            {agreement.revisionsIncluded}
          </p>
          {agreement.revisionScopeNote ? (
            <p className="whitespace-pre-wrap text-[var(--color-text)]">
              {agreement.revisionScopeNote}
            </p>
          ) : null}
        </div>
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Legal Clauses */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Legal Clauses
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-text)]">
          {agreement.ipTransfer ? <li>{IP_TRANSFER_TEXT}</li> : null}
          {agreement.confidentiality ? <li>{CONFIDENTIALITY_TEXT}</li> : null}
          {agreement.killFee ? (
            <li>{killFeeClauseText()}</li>
          ) : null}
          {agreement.portfolioRights ? <li>{PORTFOLIO_RIGHTS_TEXT}</li> : null}
          {agreement.outOfScopeClause ? (
            <li>
              {outOfScopeClauseText(agreement.outOfScopeRate, currency)}
            </li>
          ) : null}
          {agreement.limitationOfLiability ? (
            <li>{LIMITATION_OF_LIABILITY_TEXT}</li>
          ) : null}
          <li>{terminationNoticeClauseText(agreement.terminationNoticeDays)}</li>
          <li>
            This agreement shall be governed by the laws of{" "}
            {agreement.governingLaw}.
          </li>
        </ul>
      </section>

      {showSignatures ? (
        <>
          <hr className="my-8 border-[var(--color-text)]" />

          {/* Signatures */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Signatures
            </h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--color-text)]">
                  Client
                </p>
                <div className="mt-2 h-24 border border-[var(--color-text)]">
                  {agreement.clientSignature ? (
                    <div className="flex h-full flex-col justify-end p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agreement.clientSignature}
                        alt="Client signature"
                        className="max-h-14 object-contain object-left"
                      />
                      {agreement.clientSignedAt ? (
                        <p className="mt-1 text-xs text-[var(--color-text)]">
                          Signed {formatDateTime(agreement.clientSignedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--color-text)]">
                      Awaiting signature
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm">{agreement.clientRepresentative}</p>
                <p className="text-xs text-[var(--color-text)]">
                  {agreement.clientCompany}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--color-text)]">
                  Designer
                </p>
                <div className="mt-2 h-24 border border-[var(--color-text)]">
                  {agreement.ganeshSignature ? (
                    <div className="flex h-full flex-col justify-end p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agreement.ganeshSignature}
                        alt="Ganesh Das signature"
                        className="max-h-14 object-contain object-left"
                      />
                      {agreement.ganeshSignedAt ? (
                        <p className="mt-1 text-xs text-[var(--color-text)]">
                          Signed {formatDateTime(agreement.ganeshSignedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--color-text)]">
                      Awaiting signature
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm">Ganesh Das</p>
                <p className="text-xs text-[var(--color-text)]">Design by Ganesh</p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
    </DesignTokensScope>
  );
}
