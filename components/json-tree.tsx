"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SchemaNode, ValueKind } from "@/lib/infer-schema";
import type { FieldPath } from "@/lib/types";

const KIND_META: Record<ValueKind, { label: string; className: string }> = {
  number: { label: "number", className: "text-accent" },
  string: { label: "string", className: "text-ink-muted" },
  date: { label: "date", className: "text-positive" },
  boolean: { label: "bool", className: "text-warning" },
  image: { label: "image", className: "text-brand-strong" },
  url: { label: "url", className: "text-brand-strong" },
  null: { label: "null", className: "text-ink-subtle" },
  object: { label: "object", className: "text-ink-subtle" },
  array: { label: "list", className: "text-ink-subtle" },
  objectArray: { label: "records", className: "text-ink-subtle" },
  mixed: { label: "mixed", className: "text-ink-subtle" },
};

const DEFAULT_OPEN_DEPTH = 3;

function previewValue(node: SchemaNode): string {
  switch (node.kind) {
    case "object":
      return `{ ${node.children.length} field${node.children.length === 1 ? "" : "s"} }`;
    case "array":
    case "objectArray":
      return `[ ${node.itemCount ?? 0} item${node.itemCount === 1 ? "" : "s"} ]`;
    case "null":
      return "null";
    case "string":
    case "date":
    case "url":
    case "image": {
      const text = String(node.sample);
      return `"${text.length > 44 ? `${text.slice(0, 44)}…` : text}"`;
    }
    default:
      return String(node.sample);
  }
}

function isSelectable(node: SchemaNode) {
  return node.kind === "objectArray" || node.kind === "object";
}

function pathKey(path: FieldPath) {
  return path.join("\u0000");
}

function TreeRow({
  node,
  depth,
  selectedKey,
  onSelect,
}: {
  node: SchemaNode;
  depth: number;
  selectedKey: string | null;
  onSelect?: (node: SchemaNode) => void;
}) {
  const [open, setOpen] = useState(depth < DEFAULT_OPEN_DEPTH);
  const hasChildren = node.children.length > 0;
  const name =
    node.path.length === 0 ? "response" : node.path[node.path.length - 1];
  const selected = selectedKey !== null && selectedKey === pathKey(node.path);
  const selectable = Boolean(onSelect) && isSelectable(node);
  const meta = KIND_META[node.kind];

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-md py-1 pr-1.5 font-mono text-[11px] transition-colors",
          selected ? "bg-brand-soft ring-1 ring-brand/25" : "hover:bg-surface",
        )}
        style={{ paddingLeft: `${depth * 12 + 2}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${name}`}
            className="text-ink-subtle transition-colors hover:text-ink"
          >
            {open ? (
              <ChevronDown className="size-3.5" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="inline-block size-3.5" />
        )}

        <span className="font-medium text-ink">{name}</span>
        <span className={cn("truncate", meta.className)}>
          {previewValue(node)}
        </span>
        {node.kind === "image" ? (
          <ImageIcon className="size-3 shrink-0 text-brand-strong" aria-hidden />
        ) : null}
        <span className="ml-1 shrink-0 rounded-full border border-line bg-surface-muted px-1.5 text-[9px] tracking-wide text-ink-subtle uppercase">
          {meta.label}
        </span>

        {selectable ? (
          <button
            type="button"
            onClick={() => onSelect?.(node)}
            className={cn(
              "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              selected
                ? "bg-brand text-white"
                : "border border-line-strong bg-surface text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-surface-muted focus-visible:opacity-100",
            )}
          >
            {selected ? "Selected" : "Select"}
          </button>
        ) : null}
      </div>

      {open && hasChildren ? (
        <ul>
          {node.children.map((child) => (
            <TreeRow
              key={pathKey(child.path)}
              node={child}
              depth={depth + 1}
              selectedKey={selectedKey}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Collapsible view of an inferred response. When `onSelect` is supplied, object
 * and list nodes can be picked as a widget's data source.
 */
export function JsonTree({
  schema,
  selectedPath,
  onSelect,
  className,
}: {
  schema: SchemaNode;
  selectedPath?: FieldPath | null;
  onSelect?: (node: SchemaNode) => void;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "scroll-slim overflow-auto rounded-xl border border-line bg-surface-muted/60 p-2",
        className,
      )}
    >
      <TreeRow
        node={schema}
        depth={0}
        selectedKey={selectedPath ? pathKey(selectedPath) : null}
        onSelect={onSelect}
      />
    </ul>
  );
}
