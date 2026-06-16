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
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">designbyganesh</p>
            <h1 className="text-lg font-medium text-white">Tools</h1>
          </div>
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
            Portfolio →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Standalone tools for design, client work, and internal knowledge. Each tool has its own
          focused workspace.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition hover:border-zinc-700 hover:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-medium text-white group-hover:text-zinc-100">
                    {tool.name}
                  </h2>
                  <span className="shrink-0 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                    {tool.tag}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                  {tool.description}
                </p>
                <span className="mt-4 text-xs text-zinc-600 group-hover:text-zinc-400">
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
