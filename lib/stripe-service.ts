import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const PLANS = {
  starter: {
    name: "Starter",
    price: "$29/month",
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    features: [
      "Virtual EA AI assistant",
      "Google Calendar sync",
      "Voice input + output",
      "100 messages/day",
      "Meeting summaries",
    ],
  },
  pro: {
    name: "Pro",
    price: "$79/month",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    features: [
      "Everything in Starter",
      "Auto follow-up emails",
      "AI memory",
      "Unlimited messages",
      "Priority support",
    ],
  },
} as const;

export async function createCheckoutSession(options: {
  userId: string;
  email: string;
  plan: "starter" | "pro";
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const priceId = PLANS[options.plan].priceId;
  if (!priceId) {
    throw new Error(`Stripe price ID for ${options.plan} is not configured.`);
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: options.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: { userId: options.userId, plan: options.plan },
  });
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string,
) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
