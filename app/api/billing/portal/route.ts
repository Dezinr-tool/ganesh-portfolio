import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-service";
import { EA_TOKEN_COOKIE } from "@/lib/ea-token-auth";
import { createCustomerPortalSession } from "@/lib/stripe-service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(EA_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await getSessionUser(token);
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found." },
      { status: 400 },
    );
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await createCustomerPortalSession(
      user.stripeCustomerId,
      `${siteUrl}/ea/settings`,
    );
    return NextResponse.json({ portalUrl: session.url });
  } catch (error) {
    console.error("[billing/portal] error:", error);
    return NextResponse.json({ error: "Portal failed." }, { status: 500 });
  }
}
