import type { Agreement } from "@/app/dashboard/_lib/agreements";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_COMMUNICATION_PROTOCOL,
  DEFAULT_EXCLUSIONS,
  DEEMED_ACCEPTANCE_TEXT,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatClientEmails,
  latePaymentClauseText,
  MILESTONE_INVOICE_TERMS,
  MILESTONE_PAYMENT_INTRO,
  MILESTONE_PAYMENT_METHOD,
  outOfScopeClauseText,
  paymentStructureLabel,
  totalDeliverablesCost,
  reviewWindowClauseText,
  scopeHasHours,
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
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="text-right">Est. Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreement.scopeOfWork.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.task}</TableCell>
                  <TableCell className="text-right">{item.hours}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{totalHours}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
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
          <div className="mt-4 space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead className="text-right">Hrs</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreement.deliverablePhases.map((phase) => (
                  <>
                    <TableRow key={phase.id} className="bg-foreground hover:bg-foreground">
                      <TableCell colSpan={6} className="py-1.5 text-xs font-bold uppercase tracking-wide text-background">
                        {phase.name}
                      </TableCell>
                    </TableRow>
                    {phase.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.deliverable}</TableCell>
                        <TableCell className="text-muted-foreground">{item.timeline}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.effortHours ?? ""}</TableCell>
                        <TableCell className="text-right">{item.cost != null ? new Intl.NumberFormat("en-IN", { style: "currency", currency: agreement.currency ?? "INR", minimumFractionDigits: 0 }).format(item.cost) : ""}</TableCell>
                        <TableCell className="text-muted-foreground">{item.notes}</TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">Total Project Cost</TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: agreement.currency ?? "INR", minimumFractionDigits: 0 }).format(
                      agreement.deliverablePhases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + (i.cost ?? 0), 0), 0)
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {agreement.totalTimeline ? `Est. ${agreement.totalTimeline}` : ""}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Deliverable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreement.deliverables.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.priority}</TableCell>
                  <TableCell>{item.item}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <hr className="my-8 border-[var(--color-text)]" />

      {/* Payment Terms */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Payment Terms</h2>
        <div className="mt-4 space-y-4 text-sm">
          {agreement.paymentStructure === "milestone" && agreement.milestones.length > 0 ? (
            <>
              <p className="text-muted-foreground">{MILESTONE_PAYMENT_INTRO}</p>
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: "#B22222" }} className="hover:bg-[#B22222]">
                    <TableHead className="text-white font-semibold">Milestone</TableHead>
                    <TableHead className="text-right text-white font-semibold">Percentage</TableHead>
                    <TableHead className="text-right text-white font-semibold">Amount ({currency})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.milestones.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.percent}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Project Cost</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-bold" style={{ color: "#B22222" }}>
                      {formatCurrency(totalDeliverablesCost(agreement.deliverablePhases ?? []) || agreement.milestones.reduce((s, m) => s + m.amount, 0), currency)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <p className="text-muted-foreground">{MILESTONE_PAYMENT_METHOD}</p>
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

      {/* Revisions Policy */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Revisions Policy</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed">
          <p>Each design phase includes {agreement.revisionsIncluded} rounds of revisions at no additional cost:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Round 1: Minor direction or layout adjustments within the approved brief</li>
            <li>Round 2: Refinements based on consolidated feedback</li>
            {agreement.revisionsIncluded > 2 ? (
              Array.from({ length: agreement.revisionsIncluded - 2 }, (_, i) => (
                <li key={i}>Round {i + 3}: Additional revision as agreed</li>
              ))
            ) : null}
          </ul>
          <p>
            Additional revision requests beyond the included rounds will be billed at{" "}
            {agreement.hourlyRate
              ? formatCurrency(agreement.hourlyRate, currency)
              : "the designer's standard hourly rate"}
            /hour. Revision requests must be submitted in a consolidated document; piecemeal feedback may be treated as separate revision rounds.
          </p>
          {(agreement.deemedAcceptance || agreement.reviewWindowDays) ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>{reviewWindowClauseText(agreement.reviewWindowDays)}</li>
              {agreement.deemedAcceptance ? <li>{DEEMED_ACCEPTANCE_TEXT}</li> : null}
            </ul>
          ) : null}
        </div>
      </section>

      <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} />

      {/* Timeline & Delays */}
      {agreement.totalTimeline ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide">Timeline &amp; Delays</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>
              The total estimated project duration is <strong>{agreement.totalTimeline}</strong> from the date of advance payment receipt. The timeline is contingent upon:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Timely client feedback within 48 hours of each milestone delivery</li>
              <li>No scope additions or change requests post phase sign-off</li>
              <li>Advance payment cleared before project kickoff</li>
            </ul>
            <p>
              Any delay caused by late feedback, scope change, or additional requirements will extend the timeline proportionally. The Service Provider will communicate revised timelines in writing.
            </p>
          </div>
        </section>
      ) : null}

      {agreement.totalTimeline ? <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} /> : null}

      {/* Exclusions */}
      {(agreement.exclusions ?? DEFAULT_EXCLUSIONS) ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide">Exclusions — What&apos;s Not Included</h2>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {(agreement.exclusions ?? DEFAULT_EXCLUSIONS).split("\n").filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} />

      {/* Communication & Feedback Protocol */}
      {(agreement.communicationProtocol ?? DEFAULT_COMMUNICATION_PROTOCOL) ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide">Communication &amp; Feedback Protocol</h2>
          <p className="mt-4 text-sm">To ensure smooth project delivery:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {(agreement.communicationProtocol ?? DEFAULT_COMMUNICATION_PROTOCOL).split("\n").filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} />

      {/* Ownership & Intellectual Property */}
      {(agreement.ipTransfer || agreement.portfolioRights) ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide">Ownership &amp; Intellectual Property</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            {agreement.ipTransfer ? (
              <p>
                Upon receipt of full and final payment, all approved design files, assets, and deliverables become the exclusive property of{" "}
                {agreement.clientCompany
                  ? <><strong>{agreement.clientCompany}</strong>{agreement.clientRepresentative ? ` (${agreement.clientRepresentative})` : ""}</>
                  : <strong>{agreement.clientRepresentative}</strong>
                }.
              </p>
            ) : null}
            {agreement.portfolioRights ? (
              <>
                <p>
                  The Service Provider retains the right to display the work or a stylised version thereof in their professional portfolio, case studies, or social media, unless otherwise agreed in writing by both parties.
                </p>
                <p>Any design concepts not selected or approved remain the intellectual property of the Service Provider.</p>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {(agreement.ipTransfer || agreement.portfolioRights) ? <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} /> : null}

      {/* Confidentiality */}
      {agreement.confidentiality ? (
        <>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide">Confidentiality</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              <p>
                Both parties agree to keep all confidential information — including business strategies, product roadmaps, design files, and any proprietary data — strictly confidential during and after the project engagement.
              </p>
              <p>
                Neither party shall disclose confidential information to any third party without prior written consent from the other party.
              </p>
            </div>
          </section>
          <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} />
        </>
      ) : null}

      {/* Termination Clause */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Termination Clause</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed">
          <p>
            Either party may terminate this agreement with written notice (email constitutes written notice). In the event of termination:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Payment will be adjusted based on work completed and hours spent up to the date of termination</li>
            <li>If the project is terminated after the Moodboard or Wireframe phase, the advance will be partially refunded after deducting hours spent at the agreed project rate</li>
            <li>If the Service Provider terminates the project without cause, the full advance received will be refunded to the Client</li>
            <li>Work completed and approved up to the termination point remains the property of the Client, subject to proportional payment</li>
          </ul>
        </div>
      </section>

      <hr className="my-8 border-[var(--color-text)]" style={{ opacity: 0.1 }} />

      {/* Governing Law */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Governing Law</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed">
          <p>
            This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts in {agreement.governingLaw}.
          </p>
        </div>
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
