import { NextRequest, NextResponse } from "next/server";
import {
  MB_ADMIN_AUTH_COOKIE,
  MB_ADMIN_SESSION_VALUE,
} from "@/lib/mb-admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { password, from } = await request.json();
    const expected = process.env.EA_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "Admin access is not configured." },
        { status: 500 },
      );
    }

    if (password !== expected) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const redirectTo =
      typeof from === "string" &&
      (from.startsWith("/moodboard/admin") ||
        from.startsWith("/tools") ||
        from.startsWith("/knowledge-admin") ||
        from.startsWith("/moodboard/sessions"))
        ? from
        : "/moodboard/admin";

    const response = NextResponse.json({ success: true, redirect: redirectTo });
    response.cookies.set(MB_ADMIN_AUTH_COOKIE, MB_ADMIN_SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("[moodboard/admin/auth] error:", error);
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}
