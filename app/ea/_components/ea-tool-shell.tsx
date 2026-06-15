"use client";

import { EANav } from "./ea-nav";
import { EA_TAB_ACTIVE, EA_TAB_INACTIVE } from "./ea-ui";

export function EAToolShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <EANav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function EATabNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav className="mb-8 flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1.5 text-sm transition ${
            active === tab.id ? EA_TAB_ACTIVE : EA_TAB_INACTIVE
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
