import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const EXTENSION_DIR = path.join(process.cwd(), "chrome-extension", "voice-notes");

const TEXT_FILES = ["manifest.json", "background.js", "sidepanel.html", "sidepanel.js"];
const ICON_FILES = ["icon16.png", "icon48.png", "icon128.png"];

export async function GET() {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const name of TEXT_FILES) {
      const content = await readFile(path.join(EXTENSION_DIR, name), "utf8");
      zip.file(name, content);
    }

    const icons = zip.folder("icons");
    for (const name of ICON_FILES) {
      const content = await readFile(path.join(EXTENSION_DIR, "icons", name));
      icons?.file(name, content);
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="voice-notes-extension.zip"',
      },
    });
  } catch (error) {
    console.error("[voice-notes/download] error:", error);
    return NextResponse.json({ error: "Could not package the extension." }, { status: 500 });
  }
}
