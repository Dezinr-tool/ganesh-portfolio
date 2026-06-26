import type { Agreement } from "@/app/dashboard/_lib/agreements";
import {
  CONFIDENTIALITY_TEXT,
  DEEMED_ACCEPTANCE_TEXT,
  formatCurrency,
  formatDate,
  formatDateTime,
  IP_TRANSFER_TEXT,
  killFeeClauseText,
  latePaymentClauseText,
  LIMITATION_OF_LIABILITY_TEXT,
  outOfScopeClauseText,
  paymentStructureLabel,
  PORTFOLIO_RIGHTS_TEXT,
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
                key={agreement.clientEmail}
                agreementId={agreement.id}
                email={agreement.clientEmail}
              />
            ) : (
              <p className="text-sm text-[var(--color-text)]">{agreement.clientEmail}</p>
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
          Deliverables
        </h2>
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
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Payment Terms
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-[var(--color-text)]">
            All amounts in this agreement are in {currency}.
          </p>
          <p>
            <span className="font-semibold">Payment Structure:</span>{" "}
            {paymentStructureLabel(agreement.paymentStructure)}
          </p>
          {agreement.paymentStructure === "custom" &&
          agreement.customPaymentTerms ? (
            <p className="whitespace-pre-wrap text-[var(--color-text)]">
              {agreement.customPaymentTerms}
            </p>
          ) : null}
          {agreement.hourlyRate !== null ? (
            <p>
              <span className="font-semibold">Hourly Rate:</span>{" "}
              {formatCurrency(agreement.hourlyRate, currency)}/hr
            </p>
          ) : null}
          {agreement.fixedCost !== null ? (
            <p>
              <span className="font-semibold">Fixed Cost:</span>{" "}
              {formatCurrency(agreement.fixedCost, currency)}
            </p>
          ) : null}
          {agreement.paymentStructure === "milestone" &&
          agreement.milestones.length > 0 ? (
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--color-text)]">
                  <th className="py-2 pr-4 text-left font-semibold">Milestone</th>
                  <th className="py-2 pr-4 text-right font-semibold">Amount</th>
                  <th className="py-2 text-left font-semibold">Due On</th>
                </tr>
              </thead>
              <tbody>
                {agreement.milestones.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-text)]"
                  >
                    <td className="py-2.5 pr-4">{item.name}</td>
                    <td className="py-2.5 pr-4 text-right">
                      {formatCurrency(item.amount, currency)}
                    </td>
                    <td className="py-2.5">{item.dueOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {agreement.latePaymentClause ? (
            <p className="text-[var(--color-text)]">
              {latePaymentClauseText(
                agreement.latePaymentDays,
                agreement.latePaymentInterest,
              )}
            </p>
          ) : null}
          {agreement.paymentNotes ? (
            <p className="mt-3 whitespace-pre-wrap text-[var(--color-text)]">
              {agreement.paymentNotes}
            </p>
          ) : null}
        </div>
      </section>

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
            <li>{killFeeClauseText(agreement.killFeePercent)}</li>
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
