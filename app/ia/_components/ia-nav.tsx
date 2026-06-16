"use client";

import { DesignToolNav } from "@/app/_components/design-tool-nav";

export function IaNav() {
  return (
    <DesignToolNav
      title="IA Tool"
      links={[
        { href: "/tools", label: "All Tools" },
        { href: "/ia", label: "Session", match: "exact" },
        { href: "/ia/upload", label: "Upload", match: "prefix" },
      ]}
    />
  );
}
