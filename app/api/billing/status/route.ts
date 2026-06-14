import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isOnTrial, publicUser } from "@/lib/auth-service";
import { EA_TOKEN_COOKIE } from "@/lib/ea-token-auth";
import { DEFAULT_PLAN } from "@/lib/plan-limits";
import { getDailyUsage } from "@/lib/usage-tracker";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(EA_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const user = await getSessionUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const messagesToday = await getDailyUsage(user.id);

    return NextResponse.json({
      plan: DEFAULT_PLAN,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      isOnTrial: isOnTrial(user),
      messagesToday,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("[billing/status] error:", error);
    return NextResponse.json(
      { error: "Failed to load billing status." },
      { status: 500 },
    );
  }
}
