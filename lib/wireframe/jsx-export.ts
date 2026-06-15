import type { WireframeElement, WireframeScreenSpec } from "./types";
import { SHADCN_COMPONENTS } from "./types";

export function specToJsx(spec: WireframeScreenSpec): string {
  const lines: string[] = [
    `// ${spec.screen_name} — ${spec.description}`,
    `// Layout: ${spec.layout}`,
    `import { Button, Input, Label, Card, Badge, Tabs, Separator, Avatar, ScrollArea } from "@/components/wireframe-ui";`,
    "",
    `export function ${toComponentName(spec.screen_name)}() {`,
    `  return (`,
    `    <div className="min-h-screen bg-background p-6">`,
  ];

  for (const el of spec.elements) {
    lines.push(...renderElement(el, 3));
  }

  lines.push(`    </div>`, `  );`, `}`, "");
  return lines.join("\n");
}

function toComponentName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ").map((w, i) =>
    i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1),
  ).join("");
}

function renderElement(el: WireframeElement, indent: number): string[] {
  const pad = "  ".repeat(indent);
  const props = el.props ?? {};
  const propStr = Object.entries(props)
    .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : `{${JSON.stringify(v)}}`}`)
    .join(" ");

  if (typeof el.children === "string") {
    return [`${pad}<${el.component}${propStr ? ` ${propStr}` : ""}>${el.children}</${el.component}>`];
  }

  const lines = [`${pad}<${el.component}${propStr ? ` ${propStr}` : ""}>`];
  if (el.children) {
    for (const child of el.children) {
      lines.push(...renderElement(child, indent + 1));
    }
  }
  lines.push(`${pad}</${el.component}>`);
  return lines;
}

export function collectComponents(spec: WireframeScreenSpec): string[] {
  const found = new Set<string>();
  function walk(els: WireframeElement[]) {
    for (const el of els) {
      if (SHADCN_COMPONENTS.includes(el.component as (typeof SHADCN_COMPONENTS)[number])) {
        found.add(el.component);
      }
      if (Array.isArray(el.children)) walk(el.children);
    }
  }
  walk(spec.elements);
  return [...found];
}

export function replaceComponent(
  spec: WireframeScreenSpec,
  elementId: string,
  newComponent: string,
): WireframeScreenSpec {
  function walk(els: WireframeElement[]): WireframeElement[] {
    return els.map((el) => {
      if (el.id === elementId) {
        return { ...el, component: newComponent };
      }
      if (Array.isArray(el.children)) {
        return { ...el, children: walk(el.children) };
      }
      return el;
    });
  }
  return { ...spec, elements: walk(spec.elements) };
}
