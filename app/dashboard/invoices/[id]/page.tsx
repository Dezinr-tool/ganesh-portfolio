import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatClientEmails } from "@/app/dashboard/_lib/client-emails";
import { getInvoiceById } from "@/lib/invoices-store";
import { BackLink } from "../../_components/back-link";
import { formatCurrency, formatDate } from "../../_lib/invoices";
import { DeleteInvoiceButton } from "../delete-invoice-button";
import { InvoiceStatusButton } from "../invoice-status-button";
import { DownloadPdfButton } from "./download-pdf-button";
import { RazorpayCheckout } from "@/components/dashboard/RazorpayCheckout";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: "Paid" | "Unpaid" }) {
  const label = status === "Paid" ? "Paid" : "Pending";
  return (
    <Badge variant={status === "Paid" ? "default" : "outline"}>{label}</Badge>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink href="/dashboard/invoices" label="Back to invoices" />
        <div className="flex items-center gap-2 overflow-x-auto">
          <DownloadPdfButton invoice={invoice} />
          <InvoiceStatusButton invoiceId={invoice.id} status={invoice.status} />
          <DeleteInvoiceButton
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            redirectTo="/dashboard/invoices"
          />
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <Card>
        <CardHeader className="gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardDescription>Invoice</CardDescription>
            <CardTitle className="text-3xl">{invoice.invoiceNumber}</CardTitle>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
            <p>
              Issue date:{" "}
              <span className="text-foreground">{formatDate(invoice.issueDate)}</span>
            </p>
            <p>
              Due date:{" "}
              <span className="text-foreground">{formatDate(invoice.dueDate)}</span>
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bill to
              </p>
              <p className="text-lg font-medium">{invoice.clientName}</p>
              {invoice.clientCompany ? (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientCompany}
                </p>
              ) : null}
              {invoice.clientAddress ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {invoice.clientAddress}
                </p>
              ) : null}
              <p className="text-sm">{formatClientEmails(invoice.clientEmails)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount due
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatCurrency(invoice.total)}
              </p>
            </div>
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Effort (hrs)</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.effortHrs}</TableCell>
                  <TableCell>{formatCurrency(item.rate)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxPercent !== null && invoice.taxPercent > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax ({invoice.taxPercent}%)
                </span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            ) : null}
            {invoice.processingFeePercent > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Payment processing ({invoice.processingFeePercent}%)
                </span>
                <span>{formatCurrency(invoice.processingFeeAmount)}</span>
              </div>
            ) : null}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes ? (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
              </div>
            </>
          ) : null}

          {invoice.status === "Unpaid" ? (
            <>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Share this invoice — client can pay online via Razorpay
                </p>
                <RazorpayCheckout
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                  amount={invoice.total}
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
