"use client";

import { DesignToolNav } from "@/app/_components/design-tool-nav";

export function DesignAuditNav() {
  return (
    <DesignToolNav
      title="Design Audit"
      links={[
        { href: "/tools", label: "All Tools" },
        { href: "/design-audit", label: "Audit", match: "exact" },
      ]}
    />
  );
}
