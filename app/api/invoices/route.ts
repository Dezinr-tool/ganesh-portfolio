import { NextResponse } from "next/server";
import type { CreateInvoiceInput } from "@/app/dashboard/_lib/invoices";
import { buildInvoiceInput } from "@/app/dashboard/_lib/invoices";
import { hasValidClientEmails } from "@/app/dashboard/_lib/client-emails";
import { upsertClientFromForm } from "@/lib/clients-store";
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
      !hasValidClientEmails(body.clientEmails, body.clientEmail) ||
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

    const input = buildInvoiceInput(body);
    const invoice = await createInvoice(input);

    await upsertClientFromForm({
      name: input.clientName,
      email: input.clientEmail,
      phone: body.clientPhone,
      company: body.clientCompany,
      address: body.clientAddress,
      gstNumber: body.clientGstNumber,
    }).catch(() => null);

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create invoice." },
      { status: 500 },
    );
  }
}
