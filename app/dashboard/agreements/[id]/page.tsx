import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementDocument } from "@/components/dashboard/agreements/agreement-document";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAgreementById } from "@/lib/agreements-store";
import { getDesignTokens } from "@/lib/design-tokens";
import { BackLink } from "../../_components/back-link";
import { statusLabel } from "../../_lib/agreements";
import type { AgreementStatus } from "../../_lib/agreements";
import { DeleteAgreementButton } from "../delete-agreement-button";
import { SendToClientButton } from "../send-to-client-button";
import { SignGaneshButton } from "../sign-ganesh-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: AgreementStatus }) {
  const variant =
    status === "draft"
      ? "outline"
      : status === "signed"
        ? "default"
        : "secondary";

  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <BackLink href="/dashboard/agreements" label="Back to agreements" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge status={agreement.status} />
          {canEdit ? (
            <Link
              href={`/dashboard/agreements/${agreement.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit
            </Link>
          ) : isSigned ? (
            <span className="text-sm text-muted-foreground">
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

      <Card>
        <CardContent className="pt-6">
          <AgreementDocument
            agreement={agreement}
            allowEmailEdit={!isSigned}
            designTokens={designTokens}
          />
        </CardContent>
      </Card>
    </div>
  );
}
