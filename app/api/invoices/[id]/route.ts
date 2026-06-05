import { NextResponse } from "next/server";
import type { InvoiceStatus } from "@/app/dashboard/_lib/invoices";
import {
  deleteInvoice,
  getInvoiceById,
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
