import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-service";
import { EA_TOKEN_COOKIE } from "@/lib/ea-token-auth";
import { createCheckoutSession } from "@/lib/stripe-service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(EA_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await getSessionUser(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { plan } = await request.json();
    if (plan !== "starter" && plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      plan,
      successUrl: `${siteUrl}/ea/settings?billing=success`,
      cancelUrl: `${siteUrl}/ea/settings?billing=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[billing/checkout] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 500 },
    );
  }
}
