import Link from "next/link";
import { readAgreements } from "@/lib/agreements-store";
import { statusLabel } from "../_lib/agreements";
import type { AgreementStatus } from "../_lib/agreements";
import { DeleteAgreementButton } from "./delete-agreement-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: AgreementStatus }) {
  const styles: Record<AgreementStatus, string> = {
    draft: "bg-neutral-500/10 text-neutral-400 ring-neutral-500/20",
    awaiting_client: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    sent: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    signed: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export default async function AgreementsPage() {
  const agreements = await readAgreements();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agreements</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {agreements.length === 0
              ? "No agreements yet."
              : `${agreements.length} agreement${agreements.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/dashboard/agreements/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950"
        >
          New agreement
        </Link>
      </div>

      {agreements.length === 0 ? (
        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-500">
          Create your first agreement to get started.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-neutral-800">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Signatures
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-950">
              {agreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-neutral-900/50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/agreements/${agreement.id}`}
                      className="font-medium text-white hover:underline"
                    >
                      {agreement.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {agreement.clientName}
                    <span className="block text-xs text-neutral-500">
                      {agreement.clientCompany}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={agreement.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    <span className={agreement.ganeshSignedAt ? "text-emerald-400" : ""}>
                      You {agreement.ganeshSignedAt ? "✓" : "—"}
                    </span>
                    {" · "}
                    <span className={agreement.clientSignedAt ? "text-emerald-400" : ""}>
                      Client {agreement.clientSignedAt ? "✓" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteAgreementButton
                      agreementId={agreement.id}
                      title={agreement.title}
                      variant="icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
