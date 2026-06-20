const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const PPT_MIME = "application/vnd.ms-powerpoint";

let pdfWorkerReady: Promise<void> | null = null;

function ensurePdfWorker(): Promise<void> {
  if (!pdfWorkerReady) {
    pdfWorkerReady = import("pdf-parse/worker").then(() => undefined);
  }
  return pdfWorkerReady;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractXmlTextRuns(xml: string): string[] {
  return [...xml.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)]
    .map((match) => decodeXmlEntities(match[1].trim()))
    .filter(Boolean);
}

function isZipArchive(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function isPdfArchive(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString() === "%PDF";
}

function isOleCompound(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

async function detectZipOfficeKind(buffer: Buffer): Promise<"pptx" | "docx" | null> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files);
  if (names.some((path) => path.startsWith("ppt/slides/"))) return "pptx";
  if (names.some((path) => path === "word/document.xml")) return "docx";
  return null;
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const slideA = Number(a.match(/slide(\d+)/i)?.[1] ?? 0);
      const slideB = Number(b.match(/slide(\d+)/i)?.[1] ?? 0);
      return slideA - slideB;
    });

  const parts: string[] = [];

  for (const path of slidePaths) {
    const xml = await zip.file(path)!.async("string");
    const runs = extractXmlTextRuns(xml);
    if (runs.length > 0) {
      parts.push(runs.join(" "));
    }
  }

  const notePaths = Object.keys(zip.files).filter((path) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(path),
  );
  for (const path of notePaths) {
    const xml = await zip.file(path)!.async("string");
    const runs = extractXmlTextRuns(xml);
    if (runs.length > 0) {
      parts.push(`Notes: ${runs.join(" ")}`);
    }
  }

  return parts.join("\n\n");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    await ensurePdfWorker();
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = result.text?.trim() ?? "";
      if (!text) {
        throw new Error(
          "No text found in this PDF. It may be image-only — upload the .pptx file or paste the text instead.",
        );
      }
      return text;
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No text found")) {
      throw error;
    }
    throw new Error(
      "Could not read this PDF. Upload the original .pptx, or export the deck as .txt and try again.",
    );
  }
}

export async function extractDocumentText(
  buffer: Buffer,
  mime: string,
  name: string,
): Promise<string> {
  const lower = name.toLowerCase();

  if (mime === "text/plain" || lower.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  if (isZipArchive(buffer)) {
    const zipKind = await detectZipOfficeKind(buffer);
    if (zipKind === "pptx") {
      return extractPptxText(buffer).then((text) => {
        if (!text.trim()) {
          throw new Error(
            "No text found in this PowerPoint. Add speaker notes or paste the content as text.",
          );
        }
        return text.trim();
      });
    }
    if (zipKind === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim() ?? "";
      if (!text) {
        throw new Error("No text could be extracted from this DOCX.");
      }
      return text;
    }
  }

  if (isOleCompound(buffer)) {
    throw new Error(
      "Legacy .ppt/.doc files aren't supported. Save as .pptx or export to PDF and upload again.",
    );
  }

  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    if (!isPdfArchive(buffer)) {
      throw new Error(
        "This file doesn't look like a valid PDF. Upload the original .pptx instead.",
      );
    }
    return extractPdfText(buffer);
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim() ?? "";
      if (!text) {
        throw new Error("No text could be extracted from this DOCX.");
      }
      return text;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("No text")) {
        throw error;
      }
      throw new Error("Could not read DOCX. Try a .txt export or paste the text.");
    }
  }

  if (mime === PPTX_MIME || lower.endsWith(".pptx")) {
    try {
      const text = await extractPptxText(buffer);
      if (!text.trim()) {
        throw new Error(
          "No text found in this PowerPoint. Add speaker notes or paste the content as text.",
        );
      }
      return text.trim();
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("No text found")) {
        throw error;
      }
      throw new Error(
        "Could not read this PowerPoint file. Save as .pptx and try again, or paste the text.",
      );
    }
  }

  if (mime === PPT_MIME || (lower.endsWith(".ppt") && !lower.endsWith(".pptx"))) {
    throw new Error(
      "Legacy .ppt files aren't supported. Save as .pptx or export to PDF and upload again.",
    );
  }

  throw new Error("Unsupported file type. Upload PDF, PPTX, DOCX, or TXT.");
}
