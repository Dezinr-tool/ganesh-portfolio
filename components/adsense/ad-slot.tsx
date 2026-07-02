"use client";

import { ADSENSE_CLIENT_ID, getAdSlot } from "@/lib/adsense-config";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import "./ad-slot.css";

type AdSlotProps = {
  placement: "banner" | "sidebar";
  theme?: "default" | "ea";
  className?: string;
};

export function AdSlot({ placement, theme = "default", className }: AdSlotProps) {
  const slot = getAdSlot(placement);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!slot || pushedRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      /* ad blockers / script not ready */
    }
  }, [slot]);

  if (!ADSENSE_CLIENT_ID || !slot) return null;

  const isSidebar = placement === "sidebar";

  return (
    <aside
      className={cn(
        "adsense-ad",
        theme === "ea" ? "adsense-ad--ea" : "adsense-ad--default",
        isSidebar && "adsense-ad--sidebar",
        className,
      )}
      aria-label="Advertisement"
    >
      <p className="adsense-ad__label">Sponsored</p>
      <ins
        className="adsbygoogle adsense-ad__slot"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={isSidebar ? "vertical" : "horizontal"}
        data-full-width-responsive={isSidebar ? "false" : "true"}
      />
    </aside>
  );
}
