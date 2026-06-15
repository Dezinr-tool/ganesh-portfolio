import { NextRequest, NextResponse } from "next/server";

async function extractText(buffer: Buffer, mime: string, name: string): Promise<string> {
  const lower = name.toLowerCase();

  if (mime === "text/plain" || lower.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text ?? "";
    } catch {
      throw new Error("Could not read PDF. Try a .txt export or paste the text.");
    }
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value ?? "";
    } catch {
      throw new Error("Could not read DOCX. Try a .txt export or paste the text.");
    }
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.type, file.name);

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
