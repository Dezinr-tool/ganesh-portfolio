import Script from "next/script";
import { ADSENSE_CLIENT_ID, isAdSenseConfigured } from "@/lib/adsense-config";

type AdSenseScriptProps = {
  id?: string;
};

export function AdSenseScript({ id = "adsense" }: AdSenseScriptProps) {
  if (!isAdSenseConfigured()) return null;

  return (
    <Script
      id={id}
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
