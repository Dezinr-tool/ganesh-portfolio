import { NextRequest, NextResponse } from "next/server";
import { researchBrandName } from "@/lib/moodboard/brand-research";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brandName = typeof body.brandName === "string" ? body.brandName.trim() : "";
    if (!brandName) {
      return NextResponse.json({ error: "Brand name is required." }, { status: 400 });
    }

    const result = await researchBrandName(brandName);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[moodboard/research-brand] error:", error);
    return NextResponse.json({ error: "Brand research failed." }, { status: 500 });
  }
}
