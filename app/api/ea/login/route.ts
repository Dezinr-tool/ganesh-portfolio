import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-service";
import { createSession } from "@/lib/session-service";
import { setSessionCookie } from "@/lib/ea-token-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await verifyUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createSession(user.id);
    const response = NextResponse.json({ success: true, userId: user.id });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[ea/login] error:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
