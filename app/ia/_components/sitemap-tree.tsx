"use client";

import { useState } from "react";
import type { IaScreenNode, IaScreenPriority } from "@/lib/ia/types";

const PRIORITY_STYLES: Record<IaScreenPriority, string> = {
  P1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  P2: "bg-amber-100 text-amber-800 border-amber-200",
  P3: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

function PriorityBadge({ priority }: { priority: IaScreenPriority }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  depth = 0,
}: {
  node: IaScreenNode;
  selectedId: string | null;
  onSelect: (node: IaScreenNode) => void;
  depth?: number;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isSelected = selectedId === node.id;

  return (
    <li className="ia-tree-node">
      <div
        className="ia-tree-row"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <span className="ia-tree-connector" aria-hidden />
        ) : (
          <span className="ia-tree-leaf" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => onSelect(node)}
          className={`ia-tree-button ${isSelected ? "ia-tree-button--selected" : ""}`}
        >
          <span className="ia-tree-name">{node.screen_name}</span>
          <PriorityBadge priority={node.priority} />
        </button>
      </div>
      {hasChildren ? (
        <ul className="ia-tree-children">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function SitemapTree({ nodes }: { nodes: IaScreenNode[] }) {
  const [selected, setSelected] = useState<IaScreenNode | null>(null);

  if (!nodes.length) {
    return <p className="text-sm text-zinc-500">No screens in sitemap.</p>;
  }

  return (
    <div className="ia-sitemap-tree">
      <style jsx>{`
        .ia-sitemap-tree {
          --tree-line: #e4e4e7;
          --tree-accent: #18181b;
        }
        .ia-tree-node {
          list-style: none;
          position: relative;
        }
        .ia-tree-children {
          margin: 0;
          padding: 0;
          position: relative;
        }
        .ia-tree-children::before {
          content: "";
          position: absolute;
          left: 0.65rem;
          top: 0;
          bottom: 0.75rem;
          width: 1px;
          background: var(--tree-line);
        }
        .ia-tree-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0;
          position: relative;
        }
        .ia-tree-connector,
        .ia-tree-leaf {
          width: 0.75rem;
          height: 0.75rem;
          position: relative;
          flex-shrink: 0;
        }
        .ia-tree-connector::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 0.75rem;
          height: 1px;
          background: var(--tree-line);
        }
        .ia-tree-leaf::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 0.5rem;
          height: 1px;
          background: var(--tree-line);
        }
        .ia-tree-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          text-align: left;
          padding: 0.35rem 0.6rem;
          border-radius: 0.5rem;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .ia-tree-button:hover {
          background: #f4f4f5;
        }
        .ia-tree-button--selected {
          background: #fafafa;
          border-color: var(--tree-line);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .ia-tree-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--tree-accent);
        }
      `}</style>

      <ul className="m-0 p-0">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        ))}
      </ul>

      {selected ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">{selected.screen_name}</h4>
            <PriorityBadge priority={selected.priority} />
          </div>
          {selected.user_access.length > 0 ? (
            <p className="mt-2 text-xs text-zinc-600">
              <span className="font-medium text-zinc-700">Access:</span>{" "}
              {selected.user_access.join(", ")}
            </p>
          ) : null}
          {selected.primary_content.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-medium text-zinc-700">Primary content</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-600">
                {selected.primary_content.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selected.key_actions.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-medium text-zinc-700">Key actions</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-600">
                {selected.key_actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selected.notes ? (
            <p className="mt-2 text-xs italic text-zinc-500">{selected.notes}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
