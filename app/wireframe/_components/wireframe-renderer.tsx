"use client";

import { type ReactNode } from "react";
import type { WireframeElement } from "@/lib/wireframe/types";
import * as UI from "@/components/wireframe-ui";

const REGISTRY: Record<string, React.ComponentType<Record<string, unknown>>> = {
  Button: UI.Button as React.ComponentType<Record<string, unknown>>,
  Input: UI.Input as React.ComponentType<Record<string, unknown>>,
  Label: UI.Label as React.ComponentType<Record<string, unknown>>,
  Textarea: UI.Textarea as React.ComponentType<Record<string, unknown>>,
  Card: UI.Card as React.ComponentType<Record<string, unknown>>,
  CardHeader: UI.CardHeader as React.ComponentType<Record<string, unknown>>,
  CardTitle: UI.CardTitle as React.ComponentType<Record<string, unknown>>,
  CardContent: UI.CardContent as React.ComponentType<Record<string, unknown>>,
  Badge: UI.Badge as React.ComponentType<Record<string, unknown>>,
  Separator: UI.Separator as React.ComponentType<Record<string, unknown>>,
  Avatar: UI.Avatar as React.ComponentType<Record<string, unknown>>,
  Alert: UI.Alert as React.ComponentType<Record<string, unknown>>,
  Skeleton: UI.Skeleton as React.ComponentType<Record<string, unknown>>,
  Breadcrumb: UI.Breadcrumb as React.ComponentType<Record<string, unknown>>,
  Select: UI.Select as React.ComponentType<Record<string, unknown>>,
  Table: UI.Table as React.ComponentType<Record<string, unknown>>,
  Progress: UI.Progress as React.ComponentType<Record<string, unknown>>,
  Checkbox: UI.Checkbox as React.ComponentType<Record<string, unknown>>,
  Switch: UI.Switch as React.ComponentType<Record<string, unknown>>,
  Accordion: UI.Accordion as React.ComponentType<Record<string, unknown>>,
  NavigationMenu: UI.NavigationMenu as React.ComponentType<Record<string, unknown>>,
  Form: UI.Form as React.ComponentType<Record<string, unknown>>,
  DropdownMenu: UI.DropdownMenu as React.ComponentType<Record<string, unknown>>,
  Pagination: UI.Pagination as React.ComponentType<Record<string, unknown>>,
  Dialog: UI.Dialog as React.ComponentType<Record<string, unknown>>,
  Sheet: UI.Sheet as React.ComponentType<Record<string, unknown>>,
  Tabs: UI.Tabs as React.ComponentType<Record<string, unknown>>,
  ScrollArea: UI.ScrollArea as React.ComponentType<Record<string, unknown>>,
  Tooltip: UI.Tooltip as React.ComponentType<Record<string, unknown>>,
  Popover: UI.Popover as React.ComponentType<Record<string, unknown>>,
  RadioGroup: UI.RadioGroup as React.ComponentType<Record<string, unknown>>,
  Slider: UI.Slider as React.ComponentType<Record<string, unknown>>,
  Calendar: UI.Calendar as React.ComponentType<Record<string, unknown>>,
  AlertDialog: UI.AlertDialog as React.ComponentType<Record<string, unknown>>,
  Drawer: UI.Drawer as React.ComponentType<Record<string, unknown>>,
  Command: UI.Command as React.ComponentType<Record<string, unknown>>,
  Combobox: UI.Combobox as React.ComponentType<Record<string, unknown>>,
  ContextMenu: UI.ContextMenu as React.ComponentType<Record<string, unknown>>,
  Menubar: UI.Menubar as React.ComponentType<Record<string, unknown>>,
  HoverCard: UI.HoverCard as React.ComponentType<Record<string, unknown>>,
  Collapsible: UI.Collapsible as React.ComponentType<Record<string, unknown>>,
  DataTable: UI.DataTable as React.ComponentType<Record<string, unknown>>,
  DatePicker: UI.DatePicker as React.ComponentType<Record<string, unknown>>,
  Spinner: UI.Spinner as React.ComponentType<Record<string, unknown>>,
  Toast: UI.Toast as React.ComponentType<Record<string, unknown>>,
  div: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  header: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <header className={className}>{children}</header>
  ),
  main: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <main className={className}>{children}</main>
  ),
  section: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <section className={className}>{children}</section>
  ),
  h1: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <h1 className={className}>{children}</h1>
  ),
  h2: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  p: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <p className={className}>{children}</p>
  ),
};

function RenderElement({
  el,
  onSelect,
  selectedId,
}: {
  el: WireframeElement;
  onSelect?: (id: string, component: string) => void;
  selectedId?: string | null;
}) {
  const Comp = REGISTRY[el.component] ?? REGISTRY.div;
  const props = { ...(el.props ?? {}), className: el.props?.className as string | undefined };

  const content =
    typeof el.children === "string"
      ? el.children
      : Array.isArray(el.children)
        ? el.children.map((child) => (
            <RenderElement key={child.id} el={child} onSelect={onSelect} selectedId={selectedId} />
          ))
        : null;

  return (
    <div
      className={`relative ${selectedId === el.id ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${onSelect ? "cursor-pointer" : ""}`}
      onClick={
        onSelect
          ? (e) => {
              e.stopPropagation();
              onSelect(el.id, el.component);
            }
          : undefined
      }
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <Comp {...props}>{content}</Comp>
    </div>
  );
}

export function WireframeRenderer({
  elements,
  layout,
  onSelectElement,
  selectedElementId,
}: {
  elements: WireframeElement[];
  layout?: string;
  onSelectElement?: (id: string, component: string) => void;
  selectedElementId?: string | null;
}) {
  const layoutClass =
    layout === "sidebar"
      ? "grid min-h-[480px] grid-cols-[240px_1fr] gap-0"
      : layout === "split"
        ? "grid min-h-[480px] grid-cols-2 gap-4"
        : layout === "dashboard"
          ? "grid min-h-[480px] grid-cols-[200px_1fr] gap-4"
          : "flex min-h-[480px] flex-col gap-4";

  return (
    <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 ${layoutClass}`}>
      {elements.map((el) => (
        <RenderElement
          key={el.id}
          el={el}
          onSelect={onSelectElement}
          selectedId={selectedElementId}
        />
      ))}
    </div>
  );
}

export { REGISTRY as WIREFRAME_COMPONENT_REGISTRY };
