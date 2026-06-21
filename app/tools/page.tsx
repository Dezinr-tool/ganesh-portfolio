import Link from "next/link";

const TOOLS = [
  {
    href: "/ea/dashboard",
    name: "Virtual EA",
    description: "Meeting prep, follow-ups, client intelligence, and chat assistant.",
    tag: "Productivity",
  },
  {
    href: "/moodboard",
    name: "Moodboard",
    description: "Brand mood board generator with three visual directions.",
    tag: "Design",
  },
  {
    href: "/design-audit",
    name: "Design Audit",
    description: "UX critique from Figma links, websites, or screenshots.",
    tag: "Design",
  },
  {
    href: "/ia",
    name: "Information Architecture",
    description: "Structured IA sessions with screen inventory and UX recommendations.",
    tag: "Design",
  },
  {
    href: "/dashboard",
    name: "Invoices & Agreements",
    description: "Create, send, and track client invoices and agreements.",
    tag: "Business",
  },
  {
    href: "/knowledge-admin",
    name: "Knowledge Admin",
    description: "Manage UX and design knowledge used across AI tools.",
    tag: "Internal",
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-text)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text)]">
              designbyganesh
            </p>
            <h1 className="text-lg font-medium">Tools</h1>
          </div>
          <Link
            href="/"
            className="text-sm text-[var(--color-text)] transition hover:text-[var(--color-text)]"
          >
            Portfolio →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text)]">
          Standalone tools for design, client work, and internal knowledge. Each tool has its own
          focused workspace.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col rounded-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-5 transition hover:border-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-medium group-hover:text-[var(--color-text)]">
                    {tool.name}
                  </h2>
                  <span className="shrink-0 rounded-full border border-[var(--color-text)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text)]">
                    {tool.tag}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-text)]">
                  {tool.description}
                </p>
                <span className="mt-4 text-xs text-[var(--color-text)] group-hover:text-[var(--color-text)]">
                  Open tool →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
