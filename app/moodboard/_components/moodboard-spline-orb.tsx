"use client";

import Script from "next/script";

/** Public Spline community orb — tinted red via CSS filter. */
const SPLINE_SCENE =
  "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

export function MoodboardSplineOrb() {
  return (
    <div className="moodboard-spline-orb" aria-hidden>
      <Script
        src="https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js"
        type="module"
        strategy="afterInteractive"
      />
      {/* Spline web component — loaded after viewer script */}
      <spline-viewer
        url={SPLINE_SCENE}
        loading="eager"
        events-target="global"
      />
    </div>
  );
}
