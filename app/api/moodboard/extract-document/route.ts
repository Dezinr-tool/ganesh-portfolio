import { NextRequest, NextResponse } from "next/server";
import { extractDocumentText } from "@/lib/document-extract";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractDocumentText(buffer, file.type, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from this file." },
        { status: 400 },
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract document.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
