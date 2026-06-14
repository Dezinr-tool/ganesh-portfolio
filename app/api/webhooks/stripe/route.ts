import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-service";
import { updateUserPlan } from "@/lib/auth-service";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook config." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature error:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: { userId?: string; plan?: string };
          customer?: string | { id: string } | null;
          subscription?: string | { id: string } | null;
        };
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan ?? "pro";
        if (userId) {
          await updateUserPlan(userId, {
            plan,
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id,
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id,
            subscriptionStatus: "active",
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as {
          metadata?: { userId?: string };
          status: string;
        };
        const userId = sub.metadata?.userId;
        if (userId) {
          await updateUserPlan(userId, { subscriptionStatus: sub.status });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as { metadata?: { userId?: string } };
        const userId = sub.metadata?.userId;
        if (userId) {
          await updateUserPlan(userId, {
            plan: "pro",
            subscriptionStatus: "cancelled",
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        break;
      }
    }
  } catch (error) {
    console.error("[stripe webhook] handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
