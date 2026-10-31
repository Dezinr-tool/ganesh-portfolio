import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  getInvoiceById: vi.fn(),
  updateInvoiceStatus: vi.fn(),
}));
const rzp = vi.hoisted(() => ({
  ordersCreate: vi.fn(),
  ordersFetch: vi.fn(),
}));

vi.mock("@/lib/invoices-store", () => store);
vi.mock("razorpay", () => ({
  default: class {
    orders = { create: rzp.ordersCreate, fetch: rzp.ordersFetch };
  },
}));

const SECRET = "rzp_test_secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = SECRET;

const { POST: createOrder } = await import("@/app/api/razorpay/create-order/route");
const { POST: verifyPayment } = await import("@/app/api/razorpay/verify-payment/route");

function post(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function sign(orderId: string, paymentId: string) {
  return crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

const invoice = {
  id: "inv-1",
  invoiceNumber: "INV-001",
  clientName: "Acme",
  clientEmail: "billing@acme.test",
  total: 1499.5,
  status: "Sent",
};

beforeEach(() => {
  store.getInvoiceById.mockResolvedValue(invoice);
  store.updateInvoiceStatus.mockResolvedValue(undefined);
  rzp.ordersCreate.mockResolvedValue({ id: "order_1", amount: 149950, currency: "INR" });
  rzp.ordersFetch.mockResolvedValue({ id: "order_1", notes: { invoice_id: "inv-1" } });
});

describe("POST /api/razorpay/create-order", () => {
  it("rejects malformed JSON", async () => {
    const res = await createOrder(post("{not json"));
    expect(res.status).toBe(400);
  });

  it("requires an invoiceId", async () => {
    const res = await createOrder(post({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown invoice", async () => {
    store.getInvoiceById.mockResolvedValue(null);
    const res = await createOrder(post({ invoiceId: "nope" }));
    expect(res.status).toBe(404);
  });

  it("refuses to charge an already-paid invoice", async () => {
    store.getInvoiceById.mockResolvedValue({ ...invoice, status: "Paid" });
    const res = await createOrder(post({ invoiceId: "inv-1" }));
    expect(res.status).toBe(400);
    expect(rzp.ordersCreate).not.toHaveBeenCalled();
  });

  it("refuses amounts below ₹1", async () => {
    store.getInvoiceById.mockResolvedValue({ ...invoice, total: 0.5 });
    const res = await createOrder(post({ invoiceId: "inv-1" }));
    expect(res.status).toBe(400);
  });

  it("creates an order in paise, tagged with the invoice it pays", async () => {
    const res = await createOrder(post({ invoiceId: "inv-1" }));
    expect(res.status).toBe(200);
    expect(rzp.ordersCreate).toHaveBeenCalledWith({
      amount: 149950,
      currency: "INR",
      receipt: "INV-001",
      notes: { invoice_id: "inv-1" },
    });
    await expect(res.json()).resolves.toMatchObject({ order_id: "order_1", amount: 149950 });
  });

  it("returns 500 when Razorpay fails", async () => {
    rzp.ordersCreate.mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await createOrder(post({ invoiceId: "inv-1" }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/razorpay/verify-payment", () => {
  const valid = {
    razorpay_order_id: "order_1",
    razorpay_payment_id: "pay_1",
    razorpay_signature: sign("order_1", "pay_1"),
    invoice_id: "inv-1",
  };

  it("requires all Razorpay fields", async () => {
    const res = await verifyPayment(post({ razorpay_order_id: "order_1" }));
    expect(res.status).toBe(400);
  });

  it("rejects a bad signature without touching the invoice", async () => {
    const res = await verifyPayment(post({ ...valid, razorpay_signature: "0".repeat(64) }));
    expect(res.status).toBe(400);
    expect(store.updateInvoiceStatus).not.toHaveBeenCalled();
  });

  it("rejects a signature of the wrong length", async () => {
    const res = await verifyPayment(post({ ...valid, razorpay_signature: "abc" }));
    expect(res.status).toBe(400);
  });

  it("marks the invoice paid for a valid payment on its own order", async () => {
    const res = await verifyPayment(post(valid));
    expect(res.status).toBe(200);
    expect(store.updateInvoiceStatus).toHaveBeenCalledWith("inv-1", "Paid");
  });

  it("refuses to mark a different invoice paid with another order's payment", async () => {
    const res = await verifyPayment(post({ ...valid, invoice_id: "inv-expensive" }));
    expect(res.status).toBe(400);
    expect(store.updateInvoiceStatus).not.toHaveBeenCalled();
  });
});
