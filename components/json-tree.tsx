"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SchemaNode, ValueKind } from "@/lib/infer-schema";
import type { FieldPath } from "@/lib/types";

const KIND_LABELS: Record<ValueKind, string> = {
  number: "number",
  string: "string",
  date: "date",
  boolean: "boolean",
  null: "null",
  object: "object",
  array: "list",
  objectArray: "list of records",
  mixed: "mixed",
};

const DEFAULT_OPEN_DEPTH = 2;

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
    case "date": {
      const text = String(node.sample);
      return `"${text.length > 48 ? `${text.slice(0, 48)}…` : text}"`;
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
  const name = node.path.length === 0 ? "response" : node.path[node.path.length - 1];
  const selected = selectedKey !== null && selectedKey === pathKey(node.path);
  const selectable = Boolean(onSelect) && isSelectable(node);

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md py-0.5 pr-2 font-mono text-xs",
          selected && "bg-brand-soft",
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${name}`}
            className="text-ink-subtle hover:text-ink"
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
        <span className="text-ink-subtle">{previewValue(node)}</span>
        <span className="text-[10px] text-ink-subtle">{KIND_LABELS[node.kind]}</span>

        {selectable ? (
          <button
            type="button"
            onClick={() => onSelect?.(node)}
            className={cn(
              "ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium",
              selected
                ? "bg-brand text-white"
                : "border border-line-strong text-ink-muted hover:bg-surface-muted",
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
        "overflow-auto rounded-lg border border-line bg-surface-muted/50 p-2",
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
