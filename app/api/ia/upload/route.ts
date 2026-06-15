import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractIaFromUpload } from "@/lib/ia/generator";
import {
  createIaSession,
  persistIaOutput,
  updateIaSession,
} from "@/lib/ia/db-store";
import {
  extractClientName,
  extractProductName,
  extractProductType,
} from "@/lib/ia/question-flow";
import type { IaModelId } from "@/lib/ia/types";

async function extractText(buffer: Buffer, mime: string, name: string): Promise<string> {
  const lower = name.toLowerCase();

  if (mime === "text/plain" || lower.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  if (mime === "application/json" || lower.endsWith(".json")) {
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

  if (mime.startsWith("image/")) {
    return `[Image upload: ${name}. Visual structure will be inferred from filename and any accompanying metadata.]`;
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, JSON, or image.");
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const modelId = (form.get("modelId") as IaModelId | null) ?? "claude-sonnet";

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

    const { answers, output } = await extractIaFromUpload({
      text: text.trim(),
      fileName: file.name,
      modelId,
    });

    const sessionId = randomUUID();
    await createIaSession(sessionId);
    await updateIaSession(sessionId, {
      answers,
      ia_output: output,
      status: "complete",
      client_name: extractClientName(answers),
      project_name: extractProductName(answers),
      product_type: extractProductType(answers),
    });
    await persistIaOutput(sessionId, output);

    return NextResponse.json({ sessionId, output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[ia/upload] error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
