"use client";

import { DesignToolNav } from "@/app/_components/design-tool-nav";

export function MoodboardNav() {
  return (
    <DesignToolNav
      title="Moodboard"
      links={[
        { href: "/tools", label: "All Tools" },
        { href: "/moodboard", label: "Session", match: "exact" },
        { href: "/moodboard/admin", label: "Admin", match: "prefix" },
      ]}
    />
  );
}
