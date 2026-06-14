import type { AuditImage, FigmaInputMeta } from "./types";

function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("figma.com")) return null;

    const pathMatch = parsed.pathname.match(
      /\/(?:design|file|proto|board)\/([a-zA-Z0-9]+)/,
    );
    if (!pathMatch) return null;

    const fileKey = pathMatch[1];
    const nodeParam = parsed.searchParams.get("node-id");
    const nodeId = nodeParam ? nodeParam.replace(/-/g, ":") : "0:1";

    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

function collectFromNode(
  node: Record<string, unknown>,
  fonts: Set<string>,
  colors: Set<string>,
  components: Set<string>,
  depth = 0,
): string[] {
  const lines: string[] = [];
  if (depth > 4) return lines;

  const name = typeof node.name === "string" ? node.name : "Layer";
  const type = typeof node.type === "string" ? node.type : "NODE";

  if (type === "COMPONENT" || type === "INSTANCE") {
    components.add(name);
  }

  if (type === "TEXT" && typeof node.style === "object" && node.style) {
    const style = node.style as Record<string, unknown>;
    if (typeof style.fontFamily === "string") fonts.add(style.fontFamily);
  }

  if (typeof node.fills === "object" && Array.isArray(node.fills)) {
    for (const fill of node.fills as Array<Record<string, unknown>>) {
      if (fill.type === "SOLID" && typeof fill.color === "object") {
        const c = fill.color as { r: number; g: number; b: number };
        const hex = rgbToHex(c.r, c.g, c.b);
        colors.add(hex);
      }
    }
  }

  lines.push(`${"  ".repeat(depth)}${type}: ${name}`);

  if (Array.isArray(node.children)) {
    for (const child of node.children.slice(0, 20)) {
      if (child && typeof child === "object") {
        lines.push(
          ...collectFromNode(
            child as Record<string, unknown>,
            fonts,
            colors,
            components,
            depth + 1,
          ),
        );
      }
    }
  }

  return lines;
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export async function fetchFigmaAuditInput(url: string): Promise<{
  meta: FigmaInputMeta;
  image: AuditImage | null;
  error?: string;
}> {
  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    throw new Error("Invalid Figma URL. Use a design/file link with node-id.");
  }

  const token =
    process.env.FIGMA_API_TOKEN ?? process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return {
      meta: {
        fileKey: parsed.fileKey,
        nodeId: parsed.nodeId,
        components: [],
        fonts: [],
        colors: [],
        layerSummary: "FIGMA_ACCESS_TOKEN not configured — metadata limited.",
      },
      image: null,
      error: "Figma API token not configured.",
    };
  }

  const headers = { "X-Figma-Token": token };

  const [fileRes, nodesRes, imagesRes] = await Promise.all([
    fetch(`https://api.figma.com/v1/files/${parsed.fileKey}?depth=1`, {
      headers,
    }),
    fetch(
      `https://api.figma.com/v1/files/${parsed.fileKey}/nodes?ids=${encodeURIComponent(parsed.nodeId)}`,
      { headers },
    ),
    fetch(
      `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${encodeURIComponent(parsed.nodeId)}&format=png&scale=2`,
      { headers },
    ),
  ]);

  const fileData = (await fileRes.json()) as { name?: string };
  const nodesData = (await nodesRes.json()) as {
    nodes?: Record<string, { document?: Record<string, unknown> }>;
  };
  const imagesData = (await imagesRes.json()) as {
    images?: Record<string, string>;
  };

  const fonts = new Set<string>();
  const colors = new Set<string>();
  const components = new Set<string>();
  const nodeDoc = nodesData.nodes?.[parsed.nodeId]?.document;
  const layerLines = nodeDoc
    ? collectFromNode(nodeDoc, fonts, colors, components)
    : [];

  let image: AuditImage | null = null;
  const imageUrl = imagesData.images?.[parsed.nodeId];
  if (imageUrl) {
    const imgRes = await fetch(imageUrl);
    if (imgRes.ok) {
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      image = {
        base64: buffer.toString("base64"),
        mediaType: "image/png",
        label: "Figma frame",
      };
    }
  }

  return {
    meta: {
      fileKey: parsed.fileKey,
      nodeId: parsed.nodeId,
      fileName: fileData.name,
      components: [...components].slice(0, 30),
      fonts: [...fonts].slice(0, 20),
      colors: [...colors].slice(0, 20),
      layerSummary: layerLines.slice(0, 40).join("\n"),
    },
    image,
  };
}
