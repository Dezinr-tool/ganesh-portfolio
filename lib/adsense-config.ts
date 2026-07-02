export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? "";

export const ADSENSE_SLOT_BANNER =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim() ?? "";

export const ADSENSE_SLOT_SIDEBAR =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR?.trim() ?? "";

export function isAdSenseConfigured(): boolean {
  return ADSENSE_CLIENT_ID.length > 0;
}

export function getAdSlot(placement: "banner" | "sidebar"): string {
  return placement === "banner" ? ADSENSE_SLOT_BANNER : ADSENSE_SLOT_SIDEBAR;
}
