import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/auth-service";
import { createSession } from "@/lib/session-service";
import { setSessionCookie } from "@/lib/ea-token-auth";
import { saveUserProfile } from "@/src/lib/ea/userProfile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const industry =
      typeof body.industry === "string" ? body.industry.trim() : "";

    if (!name || !email || !password || !role || !industry) {
      return NextResponse.json(
        { error: "Name, email, password, role, and industry are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const user = await createUser(email, password, name);
    const token = await createSession(user.id);

    try {
      await saveUserProfile(user.id, {
        name,
        role,
        industry,
        communicationStyle: "casual",
        timezone: "Asia/Kolkata",
      });
    } catch (err) {
      console.error("[ea/signup] profile seed failed:", err);
    }

    const response = NextResponse.json({ success: true, userId: user.id });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[ea/signup] error:", error);
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 },
    );
  }
}
