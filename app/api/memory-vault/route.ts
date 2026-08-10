import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MEMORY_VAULT_AUTH_COOKIE,
  verifyMemoryVaultAuthCookie,
} from "@/lib/memory-vault-auth";
import { getMemoryCorpus } from "@/lib/moodboard/memory-corpus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get(MEMORY_VAULT_AUTH_COOKIE)?.value;
  if (!(await verifyMemoryVaultAuthCookie(auth))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "1000");
    const corpus = await getMemoryCorpus(limit);
    return NextResponse.json(corpus);
  } catch (error) {
    console.error("[memory-vault] GET error:", error);
    return NextResponse.json({ error: "Failed to load memory corpus." }, { status: 500 });
  }
}
