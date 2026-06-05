import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const dashboardUrl = new URL("/ea/dashboard", baseUrl);

  if (error) {
    dashboardUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    await exchangeCodeForTokens(code);
    dashboardUrl.searchParams.set("calendar", "connected");
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    console.error("calendar callback error:", err);
    dashboardUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(dashboardUrl);
  }
}
