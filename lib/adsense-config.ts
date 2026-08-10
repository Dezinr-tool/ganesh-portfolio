/** Google AdSense — ads stay hidden until client + slot IDs are set. */

export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";

const SLOT_BANNER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim() || "";
const SLOT_SIDEBAR =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR?.trim() || "";

export function getAdSlot(placement: "banner" | "sidebar"): string {
  return placement === "sidebar" ? SLOT_SIDEBAR : SLOT_BANNER;
}

export function isAdSenseConfigured(): boolean {
  return Boolean(ADSENSE_CLIENT_ID && (SLOT_BANNER || SLOT_SIDEBAR));
}
