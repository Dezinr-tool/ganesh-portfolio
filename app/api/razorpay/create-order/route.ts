import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/invoices-store";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  let invoiceId: string;
  try {
    const body = await req.json();
    invoiceId = body.invoiceId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "Paid") {
    return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
  }

  // Convert rupees → paise (Razorpay requires integer paise, minimum 100)
  const amountPaise = Math.round(invoice.total * 100);
  if (amountPaise < 100) {
    return NextResponse.json({ error: "Amount must be at least ₹1" }, { status: 400 });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: invoice.invoiceNumber,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      invoice_number: invoice.invoiceNumber,
      client_name: invoice.clientName,
      client_email: invoice.clientEmail ?? "",
    });
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 });
  }
}
