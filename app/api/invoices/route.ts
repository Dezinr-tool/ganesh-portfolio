import { NextResponse } from "next/server";
import type { CreateInvoiceInput } from "@/app/dashboard/_lib/invoices";
import { buildInvoiceInput, validateInvoiceLineItems } from "@/app/dashboard/_lib/invoices";
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

    const billingMode = body.billingMode ?? "hourly";

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

    const input = buildInvoiceInput({ ...body, billingMode });
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
