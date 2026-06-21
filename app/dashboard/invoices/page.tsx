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
import { DeleteInvoiceButton } from "./delete-invoice-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: "Paid" | "Unpaid" }) {
  return (
    <Badge variant={status === "Paid" ? "default" : "outline"}>{status}</Badge>
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
        <div className="rounded-xl border border-border">
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
      )}
    </div>
  );
}
