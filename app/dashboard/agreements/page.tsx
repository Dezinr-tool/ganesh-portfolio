import Link from "next/link";
import { readAgreements } from "@/lib/agreements-store";
import { statusLabel } from "../_lib/agreements";
import type { AgreementStatus } from "../_lib/agreements";
import { DeleteAgreementButton } from "./delete-agreement-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: AgreementStatus }) {
  const styles: Record<AgreementStatus, string> = {
    draft: "bg-[var(--color-bg)]/10 text-[var(--color-text)] ring-[var(--color-text)]",
    awaiting_client: "bg-[var(--color-accent)] text-[var(--color-accent)] ring-[var(--color-accent)]",
    sent: "bg-[var(--color-accent)] text-[var(--color-accent)] ring-[var(--color-accent)]",
    signed: "bg-[var(--color-accent)] text-[var(--color-accent)] ring-[var(--color-accent)]",
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
          <h1 className="text-2xl font-semibold text-[var(--color-bg)]">Agreements</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            {agreements.length === 0
              ? "No agreements yet."
              : `${agreements.length} agreement${agreements.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/dashboard/agreements/new"
          className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
        >
          New agreement
        </Link>
      </div>

      {agreements.length === 0 ? (
        <div className="mt-8 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-8 text-center text-sm text-[var(--color-text)]">
          Create your first agreement to get started.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-[var(--color-text)]">
          <table className="min-w-full divide-y divide-[var(--color-text)]">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Signatures
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)] bg-[var(--color-bg)]">
              {agreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-[var(--color-bg)]/50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/agreements/${agreement.id}`}
                      className="font-medium text-[var(--color-bg)] hover:underline"
                    >
                      {agreement.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {agreement.clientName}
                    <span className="block text-xs text-[var(--color-text)]">
                      {agreement.clientCompany}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={agreement.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    <span className={agreement.ganeshSignedAt ? "text-[var(--color-accent)]" : ""}>
                      You {agreement.ganeshSignedAt ? "✓" : "—"}
                    </span>
                    {" · "}
                    <span className={agreement.clientSignedAt ? "text-[var(--color-accent)]" : ""}>
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
