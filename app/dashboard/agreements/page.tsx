import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readAgreements } from "@/lib/agreements-store";
import { EmptyState } from "../_components/empty-state";
import { PageHeader } from "../_components/page-header";
import { statusLabel } from "../_lib/agreements";
import type { AgreementStatus } from "../_lib/agreements";
import { DeleteAgreementButton } from "./delete-agreement-button";

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

export default async function AgreementsPage() {
  const agreements = await readAgreements();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agreements"
        description={
          agreements.length === 0
            ? "No agreements yet."
            : `${agreements.length} agreement${agreements.length === 1 ? "" : "s"}`
        }
        action={{ href: "/dashboard/agreements/new", label: "New agreement" }}
      />

      {agreements.length === 0 ? (
        <EmptyState
          title="No agreements"
          description="Create your first agreement to get started."
        />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border sm:hidden">
            {agreements.map((agreement) => (
              <div key={agreement.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/agreements/${agreement.id}`}
                    className="block truncate font-medium text-foreground hover:underline"
                  >
                    {agreement.title}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {agreement.clientName}
                    {agreement.clientCompany ? ` · ${agreement.clientCompany}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={agreement.status} />
                  <DeleteAgreementButton
                    agreementId={agreement.id}
                    title={agreement.title}
                    variant="icon"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/agreements/${agreement.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {agreement.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>{agreement.clientName}</div>
                      <div className="text-xs text-muted-foreground">
                        {agreement.clientCompany}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agreement.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className={agreement.ganeshSignedAt ? "font-medium text-foreground" : ""}>
                        You {agreement.ganeshSignedAt ? "✓" : "—"}
                      </span>
                      {" · "}
                      <span className={agreement.clientSignedAt ? "font-medium text-foreground" : ""}>
                        Client {agreement.clientSignedAt ? "✓" : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteAgreementButton
                        agreementId={agreement.id}
                        title={agreement.title}
                        variant="icon"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
