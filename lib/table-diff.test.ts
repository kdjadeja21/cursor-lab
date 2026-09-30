import assert from "node:assert/strict";
import test from "node:test";
import type { FieldMapping } from "./types.ts";
import {
  cellKey,
  chooseRowIdentity,
  countStatusChanges,
  describeTableDiff,
  diffTableSnapshots,
  snapshotTable,
  statusTone,
} from "./table-diff.ts";

const auto = { kind: "auto" } as const;

const columns: FieldMapping[] = [
  { path: ["id"], label: "Id", format: auto },
  { path: ["status"], label: "Status", format: auto },
  { path: ["amount"], label: "Amount", format: auto },
];

const rows = [
  { id: "ORD-1", status: "pending", amount: 10 },
  { id: "ORD-2", status: "completed", amount: 20 },
];

test("identity prefers a unique id-like column", () => {
  assert.deepEqual(chooseRowIdentity(rows, columns).path, ["id"]);
});

test("the first snapshot is a baseline and does not flash cells", () => {
  const next = snapshotTable(rows, columns);
  const diff = diffTableSnapshots(null, next);
  assert.equal(diff.changedCells.size, 0);
  assert.equal(diff.addedRows.size, 0);
});

test("only changed cells are marked when the same order updates", () => {
  const previous = snapshotTable(rows, columns);
  const next = snapshotTable(
    [
      { id: "ORD-1", status: "completed", amount: 10 },
      { id: "ORD-2", status: "completed", amount: 21 },
    ],
    columns,
  );
  const diff = diffTableSnapshots(previous, next);

  assert.equal(diff.changedCells.has(cellKey("ORD-1", ["status"])), true);
  assert.equal(diff.changedCells.has(cellKey("ORD-1", ["amount"])), false);
  assert.equal(diff.changedCells.has(cellKey("ORD-1", ["id"])), false);
  assert.equal(diff.changedCells.has(cellKey("ORD-2", ["amount"])), true);
  assert.equal(diff.changedCells.has(cellKey("ORD-2", ["status"])), false);
  assert.equal(diff.addedRows.size, 0);
  assert.equal(countStatusChanges(diff, columns), 1);
});

test("search-irrelevant snapshots still key rows by identity, not page order", () => {
  const previous = snapshotTable(rows, columns);
  const reordered = snapshotTable(
    [
      { id: "ORD-2", status: "completed", amount: 20 },
      { id: "ORD-1", status: "refunded", amount: 10 },
    ],
    columns,
  );
  const diff = diffTableSnapshots(previous, reordered);
  assert.equal(diff.changedCells.has(cellKey("ORD-1", ["status"])), true);
  assert.equal(diff.changedCells.size, 1);
  assert.equal(diff.addedRows.size, 0);
});

test("new and removed orders are tracked separately from cell edits", () => {
  const previous = snapshotTable(rows, columns);
  const next = snapshotTable(
    [
      { id: "ORD-2", status: "completed", amount: 20 },
      { id: "ORD-3", status: "pending", amount: 5 },
    ],
    columns,
  );
  const diff = diffTableSnapshots(previous, next);
  assert.equal(diff.addedRows.has("ORD-3"), true);
  assert.equal(diff.removedRows.has("ORD-1"), true);
  assert.equal(diff.changedCells.size, 0);
});

test("status tones and spoken summaries stay specific", () => {
  assert.equal(statusTone("completed"), "positive");
  assert.equal(statusTone("pending"), "warning");
  assert.equal(statusTone("cancelled"), "danger");
  assert.equal(statusTone("mystery"), "neutral");

  const previous = snapshotTable(rows, columns);
  const next = snapshotTable(
    [
      { id: "ORD-1", status: "completed", amount: 10 },
      { id: "ORD-2", status: "completed", amount: 20 },
      { id: "ORD-9", status: "pending", amount: 1 },
    ],
    columns,
  );
  const diff = diffTableSnapshots(previous, next);
  assert.equal(
    describeTableDiff(diff, columns),
    "1 status updated, 1 new row",
  );
});
