import { NextResponse } from "next/server";
import type { CreateInvoiceInput } from "@/app/dashboard/_lib/invoices";
import {
  createInvoice,
  getNextInvoiceNumber,
  readInvoices,
} from "@/lib/invoices-store";

export async function GET() {
  try {
    const invoices = await readInvoices();
    const nextInvoiceNumber = await getNextInvoiceNumber();
    return NextResponse.json({ invoices, nextInvoiceNumber });
  } catch {
    return NextResponse.json(
      { error: "Failed to load invoices." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateInvoiceInput;

    if (
      !body.issueDate ||
      !body.dueDate ||
      !body.clientName?.trim() ||
      !body.clientEmail?.trim() ||
      !Array.isArray(body.lineItems) ||
      body.lineItems.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required invoice fields." },
        { status: 400 },
      );
    }

    const hasValidLineItems = body.lineItems.every(
      (item) =>
        item.description?.trim() &&
        item.effortHrs > 0 &&
        item.rate >= 0 &&
        item.amount >= 0,
    );

    if (!hasValidLineItems) {
      return NextResponse.json(
        { error: "Each line item needs a description and effort (hrs)." },
        { status: 400 },
      );
    }

    const invoice = await createInvoice({
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      clientName: body.clientName.trim(),
      clientEmail: body.clientEmail.trim(),
      clientCompany: body.clientCompany?.trim() ?? "",
      clientAddress: body.clientAddress?.trim() ?? "",
      lineItems: body.lineItems,
      subtotal: body.subtotal,
      taxPercent: body.taxPercent ?? null,
      taxAmount: body.taxAmount,
      total: body.total,
      notes: body.notes?.trim() ?? "",
      status: body.status ?? "Unpaid",
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create invoice." },
      { status: 500 },
    );
  }
}
