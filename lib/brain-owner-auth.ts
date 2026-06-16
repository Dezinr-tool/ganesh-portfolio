import { NextRequest, NextResponse } from "next/server";

const OWNER_HEADER = "x-owner-token";

export function isBrainOwner(request: NextRequest): boolean {
  const token = process.env.BRAIN_OWNER_TOKEN;
  if (!token) return false;
  return request.headers.get(OWNER_HEADER) === token;
}

export function requireBrainOwner(request: NextRequest): NextResponse | null {
  if (!process.env.BRAIN_OWNER_TOKEN) {
    return NextResponse.json(
      { error: "Owner access is not configured." },
      { status: 503 },
    );
  }
  if (!isBrainOwner(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
