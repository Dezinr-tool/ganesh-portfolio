import crypto from "crypto";
import { NextResponse } from "next/server";
import { updateInvoiceStatus } from "@/lib/invoices-store";

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

  // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
  }

  // Signature verified — mark the invoice as paid if invoice_id provided
  if (invoice_id) {
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
