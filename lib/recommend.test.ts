import assert from "node:assert/strict";
import test from "node:test";
import { inferSchema } from "./infer-schema.ts";
import { emptyConfigFor, recommendVisualizations } from "./recommend.ts";
import type { ChartConfig, KpiConfig, TableConfig } from "./types.ts";

const PRD_EXAMPLE = {
  summary: { totalOrders: 1250, revenue: 85400, currency: "USD" },
  orders: [
    { id: "ORD-1001", date: "2026-09-27", amount: 150, status: "completed" },
    { id: "ORD-1002", date: "2026-09-28", amount: 250, status: "pending" },
    { id: "ORD-1003", date: "2026-09-28", amount: 90, status: "completed" },
  ],
};

function recommend(payload: unknown) {
  return recommendVisualizations(inferSchema(payload));
}

test("suggests KPI cards, a table, and a bar chart for the PRD example", () => {
  const results = recommend(PRD_EXAMPLE);
  const kinds = results.map((result) => result.kind);
  assert.ok(kinds.includes("kpi"));
  assert.ok(kinds.includes("table"));
  assert.ok(
    results.some(
      (result) => result.kind === "chart" && result.chartType === "bar",
    ),
  );
  assert.equal(results[0].kind, "kpi", "KPI cards should rank first");
  assert.ok(
    results.every((result) => result.reason.length > 0),
    "every suggestion explains itself",
  );
});

test("KPI metrics take the numeric scalars and skip text fields", () => {
  const kpi = recommend(PRD_EXAMPLE).find((result) => result.kind === "kpi");
  const config = kpi?.config as KpiConfig;
  assert.deepEqual(
    config.metrics.map((metric) => metric.path),
    [
      ["summary", "totalOrders"],
      ["summary", "revenue"],
    ],
  );
  assert.deepEqual(config.metrics[1].format, {
    kind: "currency",
    currency: "USD",
    decimals: 2,
  });
});

test("the table suggestion maps every inferred column", () => {
  const table = recommend(PRD_EXAMPLE).find(
    (result) => result.kind === "table",
  );
  const config = table?.config as TableConfig;
  assert.deepEqual(config.sourcePath, ["orders"]);
  assert.deepEqual(
    config.columns.map((column) => column.label),
    ["Id", "Date", "Amount", "Status"],
  );
});

test("bar charts group by the lowest-cardinality dimension and sum measures", () => {
  const bar = recommend(PRD_EXAMPLE).find(
    (result) => result.kind === "chart" && result.chartType === "bar",
  );
  const config = bar?.config as ChartConfig;
  assert.deepEqual(config.dimension.path, ["status"]);
  assert.deepEqual(config.measures[0].path, ["amount"]);
  assert.equal(config.aggregation, "sum");
  assert.deepEqual(config.sort, { by: "measure", direction: "desc" });
});

test("a date field plus a measure yields an ascending time series", () => {
  const line = recommend(PRD_EXAMPLE).find(
    (result) => result.kind === "chart" && result.chartType === "line",
  );
  const config = line?.config as ChartConfig;
  assert.deepEqual(config.dimension.path, ["date"]);
  assert.deepEqual(config.sort, { by: "dimension", direction: "asc" });
});

test("identifier-looking fields are never offered as measures or dimensions", () => {
  const results = recommend({
    rows: [
      { id: 1, userId: 42, region: "North", total: 10 },
      { id: 2, userId: 43, region: "South", total: 20 },
    ],
  });
  for (const result of results) {
    if (result.kind !== "chart") continue;
    const config = result.config as ChartConfig;
    assert.ok(!config.measures.some((measure) => measure.path.includes("id")));
    assert.ok(!config.measures.some((measure) => measure.path.includes("userId")));
    assert.ok(!config.dimension.path.includes("id"));
  }
});

test("high-cardinality categories do not produce a bar chart", () => {
  const rows = Array.from({ length: 40 }, (_, index) => ({
    label: `item-${index}`,
    total: index,
  }));
  const results = recommend({ rows });
  assert.equal(
    results.some((result) => result.chartType === "bar"),
    false,
  );
  assert.ok(results.some((result) => result.kind === "table"));
});

test("a single-record response falls back to a card view", () => {
  const results = recommend({ name: "Service", uptime: 0.999, region: "eu" });
  assert.deepEqual(
    results.map((result) => result.kind),
    ["kpi", "cards"],
  );
});

test("an unsupported shape yields no recommendations", () => {
  assert.deepEqual(recommend([1, 2, 3]), []);
  assert.deepEqual(recommend("plain text"), []);
  assert.deepEqual(recommend(null), []);
});

test("manual view selection starts from a blank config of the right kind", () => {
  for (const kind of ["table", "kpi", "cards", "chart"] as const) {
    assert.equal(emptyConfigFor(kind).kind, kind);
  }
});
