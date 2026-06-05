import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementDocument } from "@/components/agreements/agreement-document";
import { getAgreementById } from "@/lib/agreements-store";
import { statusLabel } from "../../_lib/agreements";
import type { AgreementStatus } from "../../_lib/agreements";
import { DeleteAgreementButton } from "../delete-agreement-button";
import { SendToClientButton } from "../send-to-client-button";
import { SignGaneshButton } from "../sign-ganesh-button";

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

const EDITABLE_STATUSES: AgreementStatus[] = ["draft", "awaiting_client"];

export default async function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreementById(id);

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
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Back to agreements
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={agreement.status} />
          {canEdit ? (
            <Link
              href={`/dashboard/agreements/${agreement.id}/edit`}
              className="rounded-md border border-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Edit
            </Link>
          ) : isSigned ? (
            <span className="text-sm text-neutral-400">
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
          />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <AgreementDocument
          agreement={agreement}
          allowEmailEdit={!isSigned}
        />
      </div>
    </div>
  );
}
