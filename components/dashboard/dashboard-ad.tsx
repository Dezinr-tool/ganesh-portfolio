"use client";

import { ADSENSE_CLIENT_ID, getAdSlot } from "@/lib/adsense-config";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import "./dashboard-ad.css";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type DashboardAdProps = {
  placement: "banner" | "sidebar";
  className?: string;
};

export function DashboardAd({ placement, className }: DashboardAdProps) {
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
      className={cn("dashboard-ad", isSidebar && "dashboard-ad--sidebar", className)}
      aria-label="Advertisement"
    >
      <p className="dashboard-ad__label">Sponsored</p>
      <ins
        className="adsbygoogle dashboard-ad__slot"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={isSidebar ? "vertical" : "horizontal"}
        data-full-width-responsive={isSidebar ? "false" : "true"}
      />
    </aside>
  );
}
