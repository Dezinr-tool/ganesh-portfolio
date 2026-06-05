import { NextRequest, NextResponse } from "next/server";
import {
  EA_AUTH_COOKIE,
  getEaSessionValue,
} from "@/lib/ea-auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const eaPassword = process.env.EA_PASSWORD;

  if (!eaPassword) {
    return NextResponse.json(
      { error: "EA password not configured." },
      { status: 500 },
    );
  }

  if (password === eaPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(EA_AUTH_COOKIE, getEaSessionValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
