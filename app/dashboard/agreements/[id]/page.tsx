import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementDocument } from "@/components/dashboard/agreements/agreement-document";
import { getAgreementById } from "@/lib/agreements-store";
import { getDesignTokens } from "@/lib/design-tokens";
import { statusLabel } from "../../_lib/agreements";
import type { AgreementStatus } from "../../_lib/agreements";
import { DeleteAgreementButton } from "../delete-agreement-button";
import { SendToClientButton } from "../send-to-client-button";
import { SignGaneshButton } from "../sign-ganesh-button";

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

const EDITABLE_STATUSES: AgreementStatus[] = ["draft", "awaiting_client"];

export default async function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [agreement, designTokens] = await Promise.all([
    getAgreementById(id),
    getDesignTokens(),
  ]);

  if (!agreement) {
    notFound();
  }

  const canEdit = EDITABLE_STATUSES.includes(agreement.status);
  const isSigned = agreement.status === "signed";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/agreements"
          className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]"
        >
          ← Back to agreements
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={agreement.status} />
          {canEdit ? (
            <Link
              href={`/dashboard/agreements/${agreement.id}/edit`}
              className="rounded-md border border-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-bg)]"
            >
              Edit
            </Link>
          ) : isSigned ? (
            <span className="text-sm text-[var(--color-text)]">
              Agreement is fully signed
            </span>
          ) : null}
          <SignGaneshButton
            agreementId={agreement.id}
            alreadySigned={!!agreement.ganeshSignedAt}
          />
          <SendToClientButton
            agreementId={agreement.id}
            disabled={!agreement.ganeshSignedAt}
            alreadySent={
              agreement.status === "sent" || agreement.status === "signed"
            }
          />
          <DeleteAgreementButton
            agreementId={agreement.id}
            title={agreement.title}
            redirectTo="/dashboard/agreements"
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]/50 p-6">
        <AgreementDocument
          agreement={agreement}
          allowEmailEdit={!isSigned}
          designTokens={designTokens}
        />
      </div>
    </div>
  );
}
