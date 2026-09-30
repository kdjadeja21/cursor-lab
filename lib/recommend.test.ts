import assert from "node:assert/strict";
import test from "node:test";
import { inferSchema } from "./infer-schema.ts";
import { emptyConfigFor, recommendVisualizations } from "./recommend.ts";
import type {
  CardsConfig,
  ChartConfig,
  KpiConfig,
  TableConfig,
} from "./types.ts";

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

test("a response carrying image URLs leads with an image card view", () => {
  const results = recommend({
    products: [
      {
        sku: "MN-27",
        name: "Monitor",
        image: "https://cdn.example.com/monitor.jpg",
        price: 329,
        category: "Displays",
      },
      {
        sku: "KB-01",
        name: "Keyboard",
        image: "https://cdn.example.com/keyboard.jpg",
        price: 89,
        category: "Peripherals",
      },
    ],
  });

  const top = results[0];
  assert.equal(top.kind, "cards", "the gallery outranks the table and charts");
  assert.match(top.title, /gallery/i);
  assert.match(top.reason, /image/i);

  const config = top.config as CardsConfig;
  assert.deepEqual(config.imagePath, ["image"]);
  assert.deepEqual(config.titlePath, ["name"]);
  assert.ok(
    !config.fields.some((field) => field.path[0] === "image"),
    "the image is the card header, not a text row",
  );
  assert.ok(
    !config.fields.some((field) => field.path[0] === "name"),
    "the title is the card heading, not a repeated row",
  );
  assert.deepEqual(
    config.fields.map((field) => field.path[0]),
    ["sku", "price", "category"],
  );
});

test("a table including an image column formats it as an image", () => {
  const table = recommend({
    rows: [{ label: "a", thumb: "https://cdn.example.com/a.png", total: 1 }],
  }).find((result) => result.kind === "table");
  const config = table?.config as TableConfig;
  assert.equal(
    config.columns.find((column) => column.path[0] === "thumb")?.format.kind,
    "image",
  );
});

test("a single record with an image is offered as a card with its picture", () => {
  const results = recommend({
    name: "Acme",
    logo: "https://cdn.example.com/acme-logo.svg",
    employees: 240,
  });
  const cards = results.find((result) => result.kind === "cards");
  assert.equal(results[0].id, "cards-root");
  assert.deepEqual((cards?.config as CardsConfig).imagePath, ["logo"]);
});

test("cards without any image keep their plain framing", () => {
  const cards = recommend({
    rows: [{ region: "North", total: 5 }],
  }).find((result) => result.kind === "cards");
  assert.equal((cards?.config as CardsConfig).imagePath, null);
  assert.match(cards?.title ?? "", /cards$/);
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
