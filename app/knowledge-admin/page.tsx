import { KnowledgeAdminPanel } from "./_components/knowledge-admin-panel";
import { DesignToolNav } from "@/app/_components/design-tool-nav";

export default function KnowledgeAdminPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
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
