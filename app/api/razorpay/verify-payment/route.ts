import { NextResponse } from "next/server";
import { updateInvoiceStatus } from "@/lib/invoices-store";
import { getRazorpay, isValidPaymentSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    invoice_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" },
      { status: 400 },
    );
  }

  if (!isValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
  }

  // Signature verified — mark the invoice as paid if invoice_id provided
  if (invoice_id) {
    // The signature only covers order + payment, so confirm the order was created for this invoice.
    let orderInvoiceId: unknown;
    try {
      const order = await getRazorpay().orders.fetch(razorpay_order_id);
      orderInvoiceId = order.notes?.invoice_id;
    } catch (err) {
      console.error("[razorpay/verify-payment] Failed to fetch order:", err);
      return NextResponse.json({ error: "Could not confirm the payment order" }, { status: 502 });
    }
    if (orderInvoiceId !== invoice_id) {
      return NextResponse.json({ error: "Payment does not belong to this invoice" }, { status: 400 });
    }

    try {
      await updateInvoiceStatus(invoice_id, "Paid");
    } catch (err) {
      console.error("[razorpay/verify-payment] Failed to mark invoice paid:", err);
      // Payment is verified — don't fail the response over a DB write error
    }
  }

  return NextResponse.json({
    success: true,
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
  });
}
