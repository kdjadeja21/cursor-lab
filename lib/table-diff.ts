import { getByPath, isPlainObject } from "./infer-schema.ts";
import type { FieldMapping, FieldPath } from "./types.ts";

const IDENTITY_HINT =
  /(^|[._-])(id|uuid|guid|sku|key)$|[a-z0-9](Id|Uuid|Guid|Key|Sku)$/;

export interface RowIdentity {
  /** Path used as the stable row key, or null when we fall back to index. */
  path: FieldPath | null;
}

export interface TableSnapshot {
  identity: RowIdentity;
  /** Row id → column key → serialized cell value. */
  cells: Map<string, Map<string, string>>;
}

export interface TableDiff {
  changedCells: Set<string>;
  addedRows: Set<string>;
  removedRows: Set<string>;
}

export const EMPTY_TABLE_DIFF: TableDiff = {
  changedCells: new Set(),
  addedRows: new Set(),
  removedRows: new Set(),
};

export function columnKey(path: FieldPath) {
  return path.join("\u0000");
}

export function cellKey(rowId: string, path: FieldPath) {
  return `${rowId}\u001f${columnKey(path)}`;
}

function serializeCell(value: unknown): string {
  if (value === undefined) return "\u0000undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function uniqueStringValues(
  rows: Record<string, unknown>[],
  path: FieldPath,
): boolean {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = getByPath(row, path);
    if (value === null || value === undefined) return false;
    if (typeof value !== "string" && typeof value !== "number") return false;
    const key = String(value);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return seen.size === rows.length && rows.length > 0;
}

/**
 * Picks a stable identity from mapped columns: an `id`-like field that is unique
 * across the current rows. Without one, rows are keyed by index, which is
 * enough to highlight in-place cell changes but not reorder-safe.
 */
export function chooseRowIdentity(
  rows: Record<string, unknown>[],
  columns: FieldMapping[],
): RowIdentity {
  const sampled = rows.slice(0, Math.min(rows.length, 200));
  if (sampled.length === 0) return { path: null };

  const named = columns.filter((column) =>
    IDENTITY_HINT.test(column.path[column.path.length - 1] ?? ""),
  );
  for (const column of named) {
    if (uniqueStringValues(sampled, column.path)) return { path: column.path };
  }
  for (const column of columns) {
    if (named.includes(column)) continue;
    if (uniqueStringValues(sampled, column.path)) return { path: column.path };
  }
  return { path: null };
}

export function rowIdAt(
  row: Record<string, unknown>,
  index: number,
  identity: RowIdentity,
): string {
  if (!identity.path) return `#${index}`;
  const value = getByPath(row, identity.path);
  return value === null || value === undefined ? `#${index}` : String(value);
}

/**
 * Captures every mapped cell against a stable row id. Search and sort are
 * ignored so filtering the table does not look like a data change.
 */
export function snapshotTable(
  rows: Record<string, unknown>[],
  columns: FieldMapping[],
): TableSnapshot {
  const identity = chooseRowIdentity(rows, columns);
  const cells = new Map<string, Map<string, string>>();
  for (const [index, row] of rows.entries()) {
    const id = rowIdAt(row, index, identity);
    const values = new Map<string, string>();
    for (const column of columns) {
      values.set(columnKey(column.path), serializeCell(getByPath(row, column.path)));
    }
    cells.set(id, values);
  }
  return { identity, cells };
}

/**
 * Compares two snapshots. The first snapshot of a table is treated as the
 * baseline, so the initial load does not flash every cell.
 */
export function diffTableSnapshots(
  previous: TableSnapshot | null,
  next: TableSnapshot,
): TableDiff {
  const changedCells = new Set<string>();
  const addedRows = new Set<string>();
  const removedRows = new Set<string>();

  if (!previous || previous.cells.size === 0) {
    return { changedCells, addedRows, removedRows };
  }

  for (const [rowId, nextValues] of next.cells) {
    const previousValues = previous.cells.get(rowId);
    if (!previousValues) {
      addedRows.add(rowId);
      continue;
    }
    for (const [column, value] of nextValues) {
      if (previousValues.get(column) !== value) {
        changedCells.add(`${rowId}\u001f${column}`);
      }
    }
  }

  for (const rowId of previous.cells.keys()) {
    if (!next.cells.has(rowId)) removedRows.add(rowId);
  }

  return { changedCells, addedRows, removedRows };
}

export function tabularRows(source: unknown): Record<string, unknown>[] {
  if (!Array.isArray(source)) return [];
  return source.filter(isPlainObject);
}

export function isStatusField(label: string) {
  return /(status|state|stage|phase)/i.test(label);
}

export function statusColumnKeys(columns: FieldMapping[]): Set<string> {
  return new Set(
    columns
      .filter((column) => isStatusField(column.label))
      .map((column) => columnKey(column.path)),
  );
}

export function countStatusChanges(diff: TableDiff, columns: FieldMapping[]) {
  const statusKeys = statusColumnKeys(columns);
  if (statusKeys.size === 0) return 0;
  let count = 0;
  for (const key of diff.changedCells) {
    const column = key.slice(key.indexOf("\u001f") + 1);
    if (statusKeys.has(column)) count += 1;
  }
  return count;
}

/** Spoken summary for a polite live region. Empty when nothing changed. */
export function describeTableDiff(
  diff: TableDiff,
  columns: FieldMapping[],
): string {
  const statusChanges = countStatusChanges(diff, columns);
  const otherChanges = diff.changedCells.size - statusChanges;
  const parts: string[] = [];

  if (statusChanges === 1) parts.push("1 status updated");
  else if (statusChanges > 1) parts.push(`${statusChanges} statuses updated`);

  if (otherChanges === 1) {
    parts.push(statusChanges > 0 ? "1 other value updated" : "1 value updated");
  } else if (otherChanges > 1) {
    parts.push(
      statusChanges > 0
        ? `${otherChanges} other values updated`
        : `${otherChanges} values updated`,
    );
  }

  if (diff.addedRows.size === 1) parts.push("1 new row");
  else if (diff.addedRows.size > 1) parts.push(`${diff.addedRows.size} new rows`);

  return parts.join(", ");
}

export function statusTone(
  value: unknown,
): "positive" | "warning" | "danger" | "neutral" {
  const text = String(value).toLowerCase();
  if (
    /^(completed|complete|success|successful|paid|active|approved|done|shipped|delivered|true|yes|in[_-]?stock)$/.test(
      text,
    )
  ) {
    return "positive";
  }
  if (
    /^(pending|processing|open|queued|hold|waiting|progress|partial)$/.test(text)
  ) {
    return "warning";
  }
  if (
    /^(cancelled|canceled|failed|error|refunded|rejected|declined|inactive|false|no|out[_-]?of[_-]?stock)$/.test(
      text,
    )
  ) {
    return "danger";
  }
  return "neutral";
}
