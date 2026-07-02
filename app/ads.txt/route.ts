import { ADSENSE_CLIENT_ID } from "@/lib/adsense-config";

export function GET() {
  const publisherId = ADSENSE_CLIENT_ID.replace(/^ca-pub-/i, "");
  if (!publisherId) {
    return new Response("Not configured", { status: 404 });
  }

  const body = `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
