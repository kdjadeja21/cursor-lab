import type { FieldPath } from "./types.ts";

export type ValueKind =
  | "number"
  | "string"
  | "date"
  | "boolean"
  | "null"
  | "object"
  | "array"
  | "objectArray"
  | "mixed";

export interface FieldSummary {
  /** Path relative to the containing row. */
  path: FieldPath;
  label: string;
  kind: ValueKind;
  distinctCount: number;
  filledCount: number;
  numeric: { min: number; max: number; sum: number } | null;
}

export interface SchemaNode {
  path: FieldPath;
  label: string;
  kind: ValueKind;
  sample: unknown;
  children: SchemaNode[];
  /** Item count for arrays. */
  itemCount: number | null;
  /** Row field summaries, present only for arrays of objects. */
  fields: FieldSummary[] | null;
}

const MAX_DEPTH = 6;
const MAX_CHILDREN = 120;
const MAX_SAMPLED_ROWS = 300;
const MAX_ROW_FLATTEN_DEPTH = 2;

const DATE_PATTERN =
  /^\d{4}-\d{2}(-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?)?$/;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function looksLikeDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 6 || trimmed.length > 40) return false;
  if (!DATE_PATTERN.test(trimmed)) return false;
  return !Number.isNaN(Date.parse(trimmed));
}

export function kindOf(value: unknown): ValueKind {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    const objectItems = value.filter(isPlainObject);
    if (value.length > 0 && objectItems.length === value.length) {
      return "objectArray";
    }
    return "array";
  }
  if (isPlainObject(value)) return "object";
  if (typeof value === "number") return Number.isFinite(value) ? "number" : "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return looksLikeDate(value) ? "date" : "string";
  return "mixed";
}

export function pathLabel(path: FieldPath): string {
  return path.length === 0 ? "response" : path.join(".");
}

/** Reads a value out of a payload, treating numeric segments as array indices. */
export function getByPath(source: unknown, path: FieldPath): unknown {
  let current: unknown = source;
  for (const segment of path) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (!isPlainObject(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function flattenRow(
  row: Record<string, unknown>,
  prefix: FieldPath,
  depth: number,
  out: Map<string, FieldPath>,
) {
  for (const [key, value] of Object.entries(row)) {
    const path = [...prefix, key];
    if (isPlainObject(value) && depth < MAX_ROW_FLATTEN_DEPTH) {
      flattenRow(value, path, depth + 1, out);
      continue;
    }
    if (isPlainObject(value) || Array.isArray(value)) continue;
    out.set(path.join("\u0000"), path);
  }
}

/**
 * Summarises the columns of an array of objects: which paths exist, their type,
 * how many distinct values they hold, and numeric ranges. Cardinality drives
 * chart recommendations, so it is measured rather than guessed.
 */
export function summariseRows(rows: Record<string, unknown>[]): FieldSummary[] {
  const sampled = rows.slice(0, MAX_SAMPLED_ROWS);
  const paths = new Map<string, FieldPath>();
  for (const row of sampled) flattenRow(row, [], 0, paths);

  const summaries: FieldSummary[] = [];
  for (const path of paths.values()) {
    const distinct = new Set<string>();
    const kinds = new Set<ValueKind>();
    let filled = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let sum = 0;
    let numericCount = 0;

    for (const row of sampled) {
      const value = getByPath(row, path);
      if (value === null || value === undefined) continue;
      filled += 1;
      const kind = kindOf(value);
      kinds.add(kind);
      if (distinct.size < 200) distinct.add(JSON.stringify(value));
      if (typeof value === "number" && Number.isFinite(value)) {
        numericCount += 1;
        min = Math.min(min, value);
        max = Math.max(max, value);
        sum += value;
      }
    }

    const kind: ValueKind =
      kinds.size === 0 ? "null" : kinds.size === 1 ? [...kinds][0] : "mixed";

    summaries.push({
      path,
      label: pathLabel(path),
      kind,
      distinctCount: distinct.size,
      filledCount: filled,
      numeric:
        numericCount > 0 && kind === "number" ? { min, max, sum } : null,
    });
  }

  return summaries;
}

function buildNode(
  value: unknown,
  path: FieldPath,
  depth: number,
): SchemaNode {
  const kind = kindOf(value);
  const node: SchemaNode = {
    path,
    label: pathLabel(path),
    kind,
    sample: kind === "object" || kind === "array" || kind === "objectArray"
      ? null
      : value,
    children: [],
    itemCount: Array.isArray(value) ? value.length : null,
    fields: null,
  };

  if (depth >= MAX_DEPTH) return node;

  switch (kind) {
    case "object": {
      const entries = Object.entries(value as Record<string, unknown>).slice(
        0,
        MAX_CHILDREN,
      );
      node.children = entries.map(([key, child]) =>
        buildNode(child, [...path, key], depth + 1),
      );
      break;
    }
    case "objectArray": {
      const rows = value as Record<string, unknown>[];
      node.fields = summariseRows(rows);
      if (rows.length > 0) {
        node.children = [buildNode(rows[0], [...path, "0"], depth + 1)];
      }
      break;
    }
    case "array": {
      const items = (value as unknown[]).slice(0, MAX_CHILDREN);
      node.children = items.map((item, index) =>
        buildNode(item, [...path, String(index)], depth + 1),
      );
      break;
    }
    default:
      break;
  }

  return node;
}

export function inferSchema(data: unknown): SchemaNode {
  return buildNode(data, [], 0);
}

export interface TabularCandidate {
  node: SchemaNode;
  rowCount: number;
  fields: FieldSummary[];
}

/** Arrays of objects, largest first, that can back a table or chart. */
export function findTabularArrays(root: SchemaNode): TabularCandidate[] {
  const found: TabularCandidate[] = [];
  const visit = (node: SchemaNode) => {
    if (node.kind === "objectArray" && node.fields && node.fields.length > 0) {
      found.push({
        node,
        rowCount: node.itemCount ?? 0,
        fields: node.fields,
      });
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
  return found.sort((a, b) => b.rowCount - a.rowCount);
}

export interface ScalarCandidate {
  path: FieldPath;
  label: string;
  kind: ValueKind;
  value: unknown;
}

/**
 * Scalars reachable without indexing into an array, which are the values that
 * make sense as KPI cards or single-record card fields.
 */
export function findScalars(root: SchemaNode): ScalarCandidate[] {
  const found: ScalarCandidate[] = [];
  const visit = (node: SchemaNode) => {
    switch (node.kind) {
      case "number":
      case "string":
      case "date":
      case "boolean":
        found.push({
          path: node.path,
          label: node.label,
          kind: node.kind,
          value: node.sample,
        });
        break;
      case "object":
        for (const child of node.children) visit(child);
        break;
      default:
        break;
    }
  };
  visit(root);
  return found;
}

export function findNode(root: SchemaNode, path: FieldPath): SchemaNode | null {
  if (path.length === 0) return root;
  let current: SchemaNode | null = root;
  for (const segment of path) {
    const next: SchemaNode | undefined = current?.children.find(
      (child) => child.path[child.path.length - 1] === segment,
    );
    if (!next) return null;
    current = next;
  }
  return current;
}

/**
 * Fields that can be mapped under a node: row columns for a list of records,
 * or scalar keys for an object.
 */
export function candidateFields(node: SchemaNode | null): FieldSummary[] {
  if (!node) return [];
  if (node.kind === "objectArray") return node.fields ?? [];
  if (node.kind === "object") {
    return node.children
      .filter((child) =>
        ["number", "string", "date", "boolean"].includes(child.kind),
      )
      .map((child) => ({
        path: [child.path[child.path.length - 1]],
        label: child.path[child.path.length - 1],
        kind: child.kind,
        distinctCount: 1,
        filledCount: 1,
        numeric:
          typeof child.sample === "number"
            ? { min: child.sample, max: child.sample, sum: child.sample }
            : null,
      }));
  }
  return [];
}

export function countNodes(root: SchemaNode): number {
  return 1 + root.children.reduce((total, child) => total + countNodes(child), 0);
}
