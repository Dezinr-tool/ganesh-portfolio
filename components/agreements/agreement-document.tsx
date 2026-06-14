import type { Agreement } from "@/app/dashboard/_lib/agreements";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  totalScopeHours,
} from "@/app/dashboard/_lib/agreements";
import { EditableClientEmail } from "./editable-client-email";

type AgreementDocumentProps = {
  agreement: Agreement;
  showSignatures?: boolean;
  allowEmailEdit?: boolean;
};

export function AgreementDocument({
  agreement,
  showSignatures = true,
  allowEmailEdit = false,
}: AgreementDocumentProps) {
  const totalHours = totalScopeHours(agreement.scopeOfWork);

  return (
    <div className="mx-auto max-w-[800px] bg-white px-[60px] py-[60px] text-black shadow-lg">
      {/* Header */}
      <div className="border-b border-black pb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Design Services Agreement
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{agreement.title}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Created {formatDate(agreement.createdAt)}
        </p>
      </div>

      {/* Parties */}
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide">Parties</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Designer
            </p>
            <p className="mt-1 font-semibold">Ganesh Das</p>
            <p className="text-sm text-neutral-700">Design by Ganesh</p>
            <p className="text-sm text-neutral-600">
              hello@designbyganesh.com
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Client
            </p>
            <p className="mt-1 font-semibold">{agreement.clientName}</p>
            <p className="text-sm text-neutral-700">
              {agreement.clientCompany}
            </p>
            {allowEmailEdit ? (
              <EditableClientEmail
                key={agreement.clientEmail}
                agreementId={agreement.id}
                email={agreement.clientEmail}
              />
            ) : (
              <p className="text-sm text-neutral-600">{agreement.clientEmail}</p>
            )}
            <p className="mt-1 text-sm text-neutral-600">
              Representative: {agreement.clientRepresentative}
            </p>
          </div>
        </div>
      </section>

      <hr className="my-8 border-neutral-300" />

      {/* Project Overview */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Project Overview
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
          {agreement.projectOverview}
        </p>
      </section>

      <hr className="my-8 border-neutral-300" />

      {/* Scope of Work */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Scope of Work
        </h2>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 pr-4 text-left font-semibold">Task</th>
              <th className="py-2 text-right font-semibold">Hours</th>
            </tr>
          </thead>
          <tbody>
            {agreement.scopeOfWork.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="py-2.5 pr-4">{item.task}</td>
                <td className="py-2.5 text-right">{item.hours}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-semibold">
              <td className="py-2.5 pr-4">Total</td>
              <td className="py-2.5 text-right">{totalHours}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <hr className="my-8 border-neutral-300" />

      {/* Deliverables */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Deliverables
        </h2>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 pr-4 text-left font-semibold">Priority</th>
              <th className="py-2 text-left font-semibold">Deliverable</th>
            </tr>
          </thead>
          <tbody>
            {agreement.deliverables.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="py-2.5 pr-4 font-medium">{item.priority}</td>
                <td className="py-2.5">{item.item}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <hr className="my-8 border-neutral-300" />

      {/* Timeline */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">Timeline</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
          {agreement.timeline}
        </p>
      </section>

      <hr className="my-8 border-neutral-300" />

      {/* Payment Terms */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Payment Terms
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          {agreement.hourlyRate !== null ? (
            <p>
              <span className="font-semibold">Hourly Rate:</span>{" "}
              {formatCurrency(agreement.hourlyRate)}/hr
            </p>
          ) : null}
          {agreement.fixedCost !== null ? (
            <p>
              <span className="font-semibold">Fixed Cost:</span>{" "}
              {formatCurrency(agreement.fixedCost)}
            </p>
          ) : null}
          <p>
            <span className="font-semibold">Advance Payment:</span>{" "}
            {agreement.advancePercent}% due before work begins
          </p>
          {agreement.paymentNotes ? (
            <p className="mt-3 whitespace-pre-wrap text-neutral-700">
              {agreement.paymentNotes}
            </p>
          ) : null}
        </div>
      </section>

      <hr className="my-8 border-neutral-300" />

      {/* Terms */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Terms & Conditions
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-800">
          <li>
            All deliverables remain the property of the client upon full
            payment.
          </li>
          <li>
            Revisions beyond the agreed scope will be billed at the hourly
            rate.
          </li>
          <li>
            Either party may terminate this agreement with 7 days written notice.
          </li>
          <li>
            Confidential information shared during the project shall not be
            disclosed to third parties.
          </li>
        </ul>
      </section>

      {showSignatures ? (
        <>
          <hr className="my-8 border-neutral-300" />

          {/* Signatures */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Signatures
            </h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">
                  Client
                </p>
                <div className="mt-2 h-24 border border-neutral-400">
                  {agreement.clientSignature ? (
                    <div className="flex h-full flex-col justify-end p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agreement.clientSignature}
                        alt="Client signature"
                        className="max-h-14 object-contain object-left"
                      />
                      {agreement.clientSignedAt ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          Signed {formatDateTime(agreement.clientSignedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      Awaiting signature
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm">{agreement.clientRepresentative}</p>
                <p className="text-xs text-neutral-500">
                  {agreement.clientCompany}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">
                  Designer
                </p>
                <div className="mt-2 h-24 border border-neutral-400">
                  {agreement.ganeshSignature ? (
                    <div className="flex h-full flex-col justify-end p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agreement.ganeshSignature}
                        alt="Ganesh Das signature"
                        className="max-h-14 object-contain object-left"
                      />
                      {agreement.ganeshSignedAt ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          Signed {formatDateTime(agreement.ganeshSignedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      Awaiting signature
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm">Ganesh Das</p>
                <p className="text-xs text-neutral-500">Design by Ganesh</p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
