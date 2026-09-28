import assert from "node:assert/strict";
import test from "node:test";
import {
  findScalars,
  findTabularArrays,
  getByPath,
  inferSchema,
  kindOf,
  looksLikeDate,
  summariseRows,
} from "./infer-schema.ts";

const PRD_EXAMPLE = {
  summary: {
    totalOrders: 1250,
    revenue: 85400,
    currency: "USD",
  },
  orders: [
    { id: "ORD-1001", date: "2026-09-27", amount: 150, status: "completed" },
    { id: "ORD-1002", date: "2026-09-28", amount: 250, status: "pending" },
  ],
};

test("classifies scalar, object, and array shapes", () => {
  assert.equal(kindOf(42), "number");
  assert.equal(kindOf(Number.NaN), "null");
  assert.equal(kindOf("hello"), "string");
  assert.equal(kindOf("2026-09-28"), "date");
  assert.equal(kindOf(true), "boolean");
  assert.equal(kindOf(null), "null");
  assert.equal(kindOf({ a: 1 }), "object");
  assert.equal(kindOf([1, 2, 3]), "array");
  assert.equal(kindOf([{ a: 1 }]), "objectArray");
  assert.equal(kindOf([]), "array");
  assert.equal(kindOf([{ a: 1 }, 2]), "array");
});

test("recognises date-like strings without matching arbitrary text", () => {
  assert.ok(looksLikeDate("2026-09-28"));
  assert.ok(looksLikeDate("2026-09-28T10:30:00Z"));
  assert.ok(looksLikeDate("2026-09-28T10:30:00.123+02:00"));
  assert.equal(looksLikeDate("completed"), false);
  assert.equal(looksLikeDate("ORD-1001"), false);
  assert.equal(looksLikeDate("12"), false);
  assert.equal(looksLikeDate("2026-13-45"), false);
});

test("infers the PRD example into nested nodes and a tabular array", () => {
  const root = inferSchema(PRD_EXAMPLE);
  assert.equal(root.kind, "object");
  assert.deepEqual(
    root.children.map((child) => child.label),
    ["summary", "orders"],
  );

  const tables = findTabularArrays(root);
  assert.equal(tables.length, 1);
  assert.equal(tables[0].rowCount, 2);
  assert.deepEqual(tables[0].node.path, ["orders"]);
  assert.deepEqual(
    tables[0].fields.map((field) => [field.label, field.kind]),
    [
      ["id", "string"],
      ["date", "date"],
      ["amount", "number"],
      ["status", "string"],
    ],
  );
});

test("exposes only scalars outside arrays as KPI candidates", () => {
  const scalars = findScalars(inferSchema(PRD_EXAMPLE));
  assert.deepEqual(
    scalars.map((scalar) => scalar.label),
    ["summary.totalOrders", "summary.revenue", "summary.currency"],
  );
  assert.equal(scalars[0].value, 1250);
});

test("summarises row cardinality and numeric ranges", () => {
  const summaries = summariseRows([
    { status: "completed", amount: 100 },
    { status: "pending", amount: 300 },
    { status: "completed", amount: 200, note: null },
  ]);
  const status = summaries.find((field) => field.label === "status");
  const amount = summaries.find((field) => field.label === "amount");
  assert.equal(status?.distinctCount, 2);
  assert.equal(status?.filledCount, 3);
  assert.deepEqual(amount?.numeric, { min: 100, max: 300, sum: 600 });
  assert.equal(
    summaries.find((field) => field.label === "note")?.kind,
    "null",
  );
});

test("flattens nested row objects into addressable columns", () => {
  const summaries = summariseRows([
    { customer: { name: "Ada", tier: "gold" }, amount: 10 },
    { customer: { name: "Grace", tier: "gold" }, amount: 20 },
  ]);
  const labels = summaries.map((field) => field.label);
  assert.ok(labels.includes("customer.name"));
  assert.ok(labels.includes("customer.tier"));
  assert.equal(
    summaries.find((field) => field.label === "customer.tier")?.distinctCount,
    1,
  );
});

test("reads values by path, including array indices", () => {
  assert.equal(getByPath(PRD_EXAMPLE, ["summary", "revenue"]), 85400);
  assert.equal(getByPath(PRD_EXAMPLE, ["orders", "1", "status"]), "pending");
  assert.equal(getByPath(PRD_EXAMPLE, ["orders", "9", "status"]), undefined);
  assert.equal(getByPath(PRD_EXAMPLE, ["missing", "deep"]), undefined);
  assert.deepEqual(getByPath(PRD_EXAMPLE, []), PRD_EXAMPLE);
});
