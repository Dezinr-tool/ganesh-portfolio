"use client";

import { DesignToolNav } from "@/app/_components/design-tool-nav";

export function WireframeNav() {
  return (
    <DesignToolNav
      title="Wireframe"
      links={[
        { href: "/tools", label: "All Tools" },
        { href: "/ia", label: "IA", match: "prefix" },
      ]}
    />
  );
}
