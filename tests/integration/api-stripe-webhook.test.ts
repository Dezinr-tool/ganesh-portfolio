import Stripe from "stripe";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ updateUserPlan: vi.fn() }));
vi.mock("@/lib/auth-service", () => auth);

const WEBHOOK_SECRET = "whsec_test_secret";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const { POST } = await import("@/app/api/webhooks/stripe/route");
const stripe = new Stripe("sk_test_dummy");

function signed(event: object, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": header },
    body: payload,
  });
}

const event = (type: string, object: object) => ({ id: "evt_1", object: "event", type, data: { object } });

beforeEach(() => {
  auth.updateUserPlan.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/webhooks/stripe", () => {
  it("rejects requests without a signature header", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" });
    expect((await POST(req)).status).toBe(400);
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const res = await POST(signed(event("checkout.session.completed", { metadata: { userId: "u1" } }), "whsec_wrong"));
    expect(res.status).toBe(400);
    expect(auth.updateUserPlan).not.toHaveBeenCalled();
  });

  it("activates the plan when checkout completes", async () => {
    const res = await POST(
      signed(event("checkout.session.completed", {
        metadata: { userId: "u1", plan: "starter" },
        customer: "cus_1",
        subscription: { id: "sub_1" },
      })),
    );
    expect(res.status).toBe(200);
    expect(auth.updateUserPlan).toHaveBeenCalledWith("u1", {
      plan: "starter",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      subscriptionStatus: "active",
    });
  });

  it("tracks subscription status changes and cancellations", async () => {
    await POST(signed(event("customer.subscription.updated", { metadata: { userId: "u1" }, status: "past_due" })));
    expect(auth.updateUserPlan).toHaveBeenLastCalledWith("u1", { subscriptionStatus: "past_due" });
    await POST(signed(event("customer.subscription.deleted", { metadata: { userId: "u1" } })));
    expect(auth.updateUserPlan).toHaveBeenLastCalledWith("u1", { plan: "pro", subscriptionStatus: "cancelled" });
  });

  it("ignores events without a user and unknown event types", async () => {
    expect((await POST(signed(event("checkout.session.completed", {})))).status).toBe(200);
    expect((await POST(signed(event("charge.refunded", {})))).status).toBe(200);
    expect(auth.updateUserPlan).not.toHaveBeenCalled();
  });

  it("returns 500 so Stripe retries when the DB write fails", async () => {
    auth.updateUserPlan.mockRejectedValue(new Error("db"));
    const res = await POST(signed(event("customer.subscription.updated", { metadata: { userId: "u1" }, status: "active" })));
    expect(res.status).toBe(500);
  });
});
