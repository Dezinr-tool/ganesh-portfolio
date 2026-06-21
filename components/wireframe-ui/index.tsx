import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export function Button({
  children,
  variant = "default",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  const variants = {
    default: "bg-[var(--color-bg)] text-[var(--color-bg)] hover:bg-[var(--color-bg)]",
    outline: "border border-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg)]",
    ghost: "hover:bg-[var(--color-bg)]",
    secondary: "bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg)]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-text)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn("text-sm font-medium text-[var(--color-text)]", className)}>{children}</label>;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-text)]",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-1.5 p-6 pb-3", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none", className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}) {
  const variants = {
    default: "bg-[var(--color-bg)] text-[var(--color-bg)]",
    secondary: "bg-[var(--color-bg)] text-[var(--color-text)]",
    outline: "border border-[var(--color-text)] text-[var(--color-text)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Separator({ className }: { className?: string }) {
  return <hr className={cn("border-[var(--color-text)]", className)} />;
}

export function Avatar({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text)]",
        className,
      )}
    >
      {children ?? "U"}
    </div>
  );
}

export function Tabs({
  tabs,
  className,
}: {
  tabs: { label: string; content: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-[var(--color-text)]">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-medium",
              i === 0 ? "border-b-2 border-[var(--color-text)] text-[var(--color-text)]" : "text-[var(--color-text)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs[0]?.content}</div>
    </div>
  );
}

export function ScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}

export function Alert({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent)]"
          : "border-[var(--color-text)] bg-[var(--color-bg)] text-[var(--color-text)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[var(--color-bg)]", className)} />;
}

export function Breadcrumb({ items, className }: { items: string[]; className?: string }) {
  return (
    <nav className={cn("flex items-center gap-2 text-sm text-[var(--color-text)]", className)}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center gap-2">
          {i > 0 ? <span>/</span> : null}
          <span className={i === items.length - 1 ? "text-[var(--color-text)]" : ""}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function Select({
  options,
  className,
  placeholder = "Select…",
}: {
  options: string[];
  className?: string;
  placeholder?: string;
}) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 text-sm",
        className,
      )}
      defaultValue=""
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Table({
  headers,
  rows,
  className,
}: {
  headers: string[];
  rows: string[][];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-[var(--color-text)]", className)}>
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-bg)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left font-medium text-[var(--color-text)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--color-text)]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-[var(--color-text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Progress({ value = 60, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]", className)}>
      <div className="h-full rounded-full bg-[var(--color-bg)]" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Checkbox({ label, className }: { label: string; className?: string }) {
  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <input type="checkbox" className="rounded border-[var(--color-text)]" />
      {label}
    </label>
  );
}

export function Switch({ label, className }: { label: string; className?: string }) {
  return (
    <label className={cn("flex items-center justify-between gap-4 text-sm", className)}>
      {label}
      <span className="relative inline-flex h-6 w-11 rounded-full bg-[var(--color-bg)]">
        <span className="m-0.5 h-5 w-5 rounded-full bg-[var(--color-bg)] shadow" />
      </span>
    </label>
  );
}

export function Accordion({
  items,
  className,
}: {
  items: { title: string; content: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-[var(--color-text)] rounded-md border border-[var(--color-text)]", className)}>
      {items.map((item) => (
        <details key={item.title} className="group p-4">
          <summary className="cursor-pointer font-medium">{item.title}</summary>
          <div className="mt-2 text-sm text-[var(--color-text)]">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

export function NavigationMenu({
  items,
  className,
}: {
  items: { label: string; active?: boolean }[];
  className?: string;
}) {
  return (
    <nav className={cn("flex gap-4 border-b border-[var(--color-text)] pb-2", className)}>
      {items.map((item) => (
        <a
          key={item.label}
          href="#"
          className={cn(
            "text-sm font-medium",
            item.active ? "text-[var(--color-text)]" : "text-[var(--color-text)] hover:text-[var(--color-text)]",
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function Form({ children, className }: { children: ReactNode; className?: string }) {
  return <form className={cn("space-y-4", className)}>{children}</form>;
}

export function DropdownMenu({
  trigger,
  items,
  className,
}: {
  trigger: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("relative inline-block", className)}>
      <Button variant="outline">{trigger}</Button>
      <div className="mt-1 min-w-[140px] rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] py-1 shadow-lg">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-bg)]"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Pagination({ pages, className }: { pages: number; className?: string }) {
  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          type="button"
          className={cn(
            "h-8 w-8 rounded-md text-sm",
            i === 0 ? "bg-[var(--color-bg)] text-[var(--color-bg)]" : "hover:bg-[var(--color-bg)]",
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

export function Dialog({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6 shadow-xl", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function Sheet({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("w-80 border-l border-[var(--color-text)] bg-[var(--color-bg)] p-6", className)}>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </aside>
  );
}

export function Tooltip({
  children,
  tip,
}: {
  children: ReactNode;
  tip: string;
}) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-bg)] group-hover:block">
        {tip}
      </span>
    </span>
  );
}

export function Popover({
  trigger,
  content,
}: {
  trigger: string;
  content: ReactNode;
}) {
  return (
    <div className="inline-flex flex-col gap-2">
      <Button variant="outline">{trigger}</Button>
      <div className="rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] p-3 shadow-md">{content}</div>
    </div>
  );
}

export function RadioGroup({
  options,
  name,
  className,
}: {
  options: string[];
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm">
          <input type="radio" name={name} />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function Slider({ className }: { className?: string }) {
  return (
    <input type="range" className={cn("w-full accent-[var(--color-text)]", className)} defaultValue={50} />
  );
}

export function Calendar({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-7 gap-1 rounded-md border border-[var(--color-text)] p-3 text-center text-xs", className)}>
      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
        <div key={d} className="font-medium text-[var(--color-text)]">{d}</div>
      ))}
      {Array.from({ length: 28 }, (_, i) => (
        <button key={i} type="button" className="rounded p-1 hover:bg-[var(--color-bg)]">
          {i + 1}
        </button>
      ))}
    </div>
  );
}

export function AlertDialog({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6 shadow-lg", className)}>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text)]">{description}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Continue</Button>
      </div>
    </div>
  );
}

export function Drawer({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("fixed bottom-0 left-0 right-0 rounded-t-xl border border-[var(--color-text)] bg-[var(--color-bg)] p-6 shadow-2xl", className)}>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function Command({
  placeholder = "Search…",
  items,
  className,
}: {
  placeholder?: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-[var(--color-text)] bg-[var(--color-bg)]", className)}>
      <Input placeholder={placeholder} className="border-0 border-b rounded-none" />
      <div className="max-h-48 overflow-auto p-2">
        {items.map((item) => (
          <button key={item} type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--color-bg)]">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Combobox({
  options,
  placeholder = "Select…",
  className,
}: {
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input placeholder={placeholder} />
      <div className="absolute z-10 mt-1 w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] shadow-lg">
        {options.map((o) => (
          <div key={o} className="px-3 py-2 text-sm hover:bg-[var(--color-bg)]">{o}</div>
        ))}
      </div>
    </div>
  );
}

export function ContextMenu({ items, className }: { items: string[]; className?: string }) {
  return (
    <div className={cn("rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] py-1 shadow-lg", className)}>
      {items.map((item) => (
        <button key={item} type="button" className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-bg)]">
          {item}
        </button>
      ))}
    </div>
  );
}

export function Menubar({ items, className }: { items: string[]; className?: string }) {
  return (
    <div className={cn("flex gap-1 rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] p-1", className)}>
      {items.map((item) => (
        <button key={item} type="button" className="rounded px-3 py-1 text-sm hover:bg-[var(--color-bg)]">
          {item}
        </button>
      ))}
    </div>
  );
}

export function HoverCard({
  trigger,
  content,
}: {
  trigger: string;
  content: ReactNode;
}) {
  return (
    <div className="group relative inline-block">
      <span className="cursor-pointer text-sm font-medium text-[var(--color-text)] underline">{trigger}</span>
      <div className="absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] p-3 shadow-lg group-hover:block">
        {content}
      </div>
    </div>
  );
}

export function Collapsible({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("rounded-md border border-[var(--color-text)] p-4", className)}>
      <summary className="cursor-pointer font-medium">{title}</summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

export function DataTable({
  headers,
  rows,
  className,
}: {
  headers: string[];
  rows: string[][];
  className?: string;
}) {
  return <Table headers={headers} rows={rows} className={className} />;
}

export function DatePicker({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2", className)}>
      <Input type="date" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-text)] border-t-[var(--color-accent)]",
        className,
      )}
    />
  );
}

export function Toast({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("rounded-md bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-bg)] shadow-lg", className)}>
      {message}
    </div>
  );
}

export function Sonner({ message }: { message: string }) {
  return <Toast message={message} />;
}
