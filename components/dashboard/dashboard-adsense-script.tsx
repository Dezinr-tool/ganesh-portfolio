import Script from "next/script";
import { ADSENSE_CLIENT_ID, isAdSenseConfigured } from "@/lib/adsense-config";

export function DashboardAdSenseScript() {
  if (!isAdSenseConfigured()) return null;

  return (
    <Script
      id="adsense-dashboard"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
