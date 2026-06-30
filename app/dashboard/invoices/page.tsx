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
import { readInvoices } from "@/lib/invoices-store";
import { EmptyState } from "../_components/empty-state";
import { PageHeader } from "../_components/page-header";
import { formatCurrency, formatDate } from "../_lib/invoices";
import type { InvoiceStatus } from "../_lib/invoices";
import { DeleteInvoiceButton } from "./delete-invoice-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "Draft") {
    return <Badge variant="secondary">Draft</Badge>;
  }
  const label = status === "Paid" ? "Paid" : "Pending";
  return (
    <Badge variant={status === "Paid" ? "default" : "outline"}>{label}</Badge>
  );
}

export default async function InvoicesPage() {
  const invoices = await readInvoices();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        description={
          invoices.length === 0
            ? "No invoices yet."
            : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`
        }
        action={{ href: "/dashboard/invoices/new", label: "New invoice" }}
      />

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices"
          description="Create your first invoice to get started."
        />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border sm:hidden">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="block truncate font-medium text-foreground hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {invoice.clientName} · {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={invoice.status} />
                  <span className="text-sm font-medium">{formatCurrency(invoice.total)}</span>
                  <DeleteInvoiceButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteInvoiceButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
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
