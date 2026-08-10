import { NextRequest, NextResponse } from "next/server";
import {
  MEMORY_VAULT_AUTH_COOKIE,
  createMemoryVaultAuthToken,
} from "@/lib/memory-vault-auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expected = process.env.MOODBOARD_MEMORY_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "Memory vault access is not configured." },
        { status: 500 },
      );
    }

    if (password !== expected) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token = await createMemoryVaultAuthToken(expected);
    const response = NextResponse.json({ success: true });
    response.cookies.set(MEMORY_VAULT_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("[memory-vault/auth] error:", error);
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}
