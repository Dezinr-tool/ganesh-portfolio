import { NextResponse } from "next/server";
import type {
  CreateInvoiceInput,
  InvoiceStatus,
} from "@/app/dashboard/_lib/invoices";
import { buildInvoiceInput, validateInvoiceLineItems } from "@/app/dashboard/_lib/invoices";
import { hasValidClientEmails } from "@/app/dashboard/_lib/client-emails";
import { upsertClientFromForm } from "@/lib/clients-store";
import {
  deleteInvoice,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
} from "@/lib/invoices-store";

function normalizeStatus(value: string | undefined): InvoiceStatus | null {
  if (!value) return null;
  const status = value.toLowerCase();
  if (status === "paid") return "Paid";
  if (status === "unpaid") return "Unpaid";
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json(
      { error: "Failed to load invoice." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status = normalizeStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { error: "Status must be paid or unpaid." },
        { status: 400 },
      );
    }

    const invoice = await updateInvoiceStatus(id, status);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json(
      { error: "Failed to update invoice." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as CreateInvoiceInput & {
      isDraft?: boolean;
    };
    const billingMode = body.billingMode ?? "hourly";

    if (
      !body.isDraft &&
      (!body.issueDate ||
        !body.clientName?.trim() ||
        !hasValidClientEmails(body.clientEmails, body.clientEmail) ||
        !Array.isArray(body.lineItems) ||
        body.lineItems.length === 0)
    ) {
      return NextResponse.json(
        { error: "Missing required invoice fields." },
        { status: 400 },
      );
    }

    if (!body.isDraft) {
      const hasValidLineItems = validateInvoiceLineItems(body.lineItems, billingMode);

      if (!hasValidLineItems) {
        return NextResponse.json(
          {
            error:
              billingMode === "hourly"
                ? "Each line item needs a description and effort (hrs)."
                : "Each line item needs a description and amount.",
          },
          { status: 400 },
        );
      }
    }

    const input = buildInvoiceInput({
      ...body,
      billingMode,
      issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
      clientName: body.clientName ?? "",
      lineItems: Array.isArray(body.lineItems) && body.lineItems.length > 0
        ? body.lineItems
        : [
            {
              id: crypto.randomUUID(),
              description: "",
              effortHrs: 0,
              rate: 0,
              amount: 0,
            },
          ],
      status: body.isDraft ? "Draft" : body.status,
    });
    const invoice = await updateInvoice(id, input);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    await upsertClientFromForm({
      name: input.clientName,
      email: input.clientEmail,
      phone: body.clientPhone,
      company: body.clientCompany,
      address: body.clientAddress,
      gstNumber: body.clientGstNumber,
    }).catch(() => null);

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json(
      { error: "Failed to update invoice." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteInvoice(id);

    if (!deleted) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete invoice." },
      { status: 500 },
    );
  }
}
