import { KnowledgeAdminPanel } from "./_components/knowledge-admin-panel";
import { DesignToolNav } from "@/app/_components/design-tool-nav";

export default function KnowledgeAdminPage() {
  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <DesignToolNav
        title="Knowledge Admin"
        links={[
          { href: "/tools", label: "All Tools" },
          { href: "/knowledge-admin", label: "Admin", match: "exact" },
        ]}
      />
      <KnowledgeAdminPanel />
    </div>
  );
}
