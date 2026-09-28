import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveCards,
  resolveChart,
  resolveKpi,
  resolveTable,
  toChartRows,
} from "./widget-data.ts";
import type {
  CardsConfig,
  ChartConfig,
  KpiConfig,
  TableConfig,
} from "./types.ts";

const PAYLOAD = {
  summary: { totalOrders: 3, revenue: 490 },
  orders: [
    { id: "A", status: "completed", region: "North", amount: 150 },
    { id: "B", status: "pending", region: "South", amount: 250 },
    { id: "C", status: "completed", region: "North", amount: 90 },
  ],
};

const auto = { kind: "auto" } as const;

const tableConfig: TableConfig = {
  kind: "table",
  sourcePath: ["orders"],
  columns: [
    { path: ["id"], label: "Id", format: auto },
    { path: ["amount"], label: "Amount", format: auto },
  ],
  sort: null,
  search: "",
  pageSize: 10,
};

const chartConfig: ChartConfig = {
  kind: "chart",
  chartType: "bar",
  sourcePath: ["orders"],
  dimension: { path: ["status"], label: "Status", format: auto },
  measures: [{ path: ["amount"], label: "Amount", format: auto }],
  aggregation: "sum",
  sort: { by: "measure", direction: "desc" },
  maxPoints: 50,
};

test("tables read rows, sort, and search across mapped columns", () => {
  const plain = resolveTable(tableConfig, PAYLOAD);
  assert.equal(plain.value?.rows.length, 3);
  assert.equal(plain.value?.totalRows, 3);

  const sorted = resolveTable(
    { ...tableConfig, sort: { path: ["amount"], direction: "desc" } },
    PAYLOAD,
  );
  assert.deepEqual(
    sorted.value?.rows.map((row) => row.amount),
    [250, 150, 90],
  );

  const searched = resolveTable({ ...tableConfig, search: "b" }, PAYLOAD);
  assert.equal(searched.value?.rows.length, 1);
  assert.equal(searched.value?.totalRows, 3);
});

test("a source that is no longer a list reports a clear error", () => {
  const missing = resolveTable({ ...tableConfig, sourcePath: ["nope"] }, PAYLOAD);
  assert.equal(missing.value, null);
  assert.match(missing.error ?? "", /no longer contains nope/);

  const notList = resolveTable({ ...tableConfig, sourcePath: ["summary"] }, PAYLOAD);
  assert.equal(notList.value, null);
  assert.match(notList.error ?? "", /is not a list/);
});

test("columns that vanished from the response are flagged, not dropped", () => {
  const resolved = resolveTable(
    {
      ...tableConfig,
      columns: [
        ...tableConfig.columns,
        { path: ["discount"], label: "Discount", format: auto },
      ],
    },
    PAYLOAD,
  );
  assert.deepEqual(
    resolved.missing.map((mapping) => mapping.label),
    ["Discount"],
  );
  assert.equal(resolved.value?.columns.length, 3, "mapping is preserved");
});

test("KPI metrics read absolute paths and report missing ones", () => {
  const config: KpiConfig = {
    kind: "kpi",
    metrics: [
      { path: ["summary", "revenue"], label: "Revenue", format: auto },
      { path: ["summary", "margin"], label: "Margin", format: auto },
    ],
  };
  const resolved = resolveKpi(config, PAYLOAD);
  assert.equal(resolved.value?.[0].value, 490);
  assert.equal(resolved.value?.[1].value, undefined);
  assert.deepEqual(
    resolved.missing.map((mapping) => mapping.label),
    ["Margin"],
  );
});

test("cards render one card per record, capped by maxCards", () => {
  const config: CardsConfig = {
    kind: "cards",
    sourcePath: ["orders"],
    fields: [{ path: ["status"], label: "Status", format: auto }],
    maxCards: 2,
  };
  const resolved = resolveCards(config, PAYLOAD);
  assert.equal(resolved.value?.length, 2);
  assert.equal(resolved.value?.[0].fields[0].value, "completed");
});

test("cards over a single object produce one card", () => {
  const resolved = resolveCards(
    {
      kind: "cards",
      sourcePath: ["summary"],
      fields: [{ path: ["totalOrders"], label: "Orders", format: auto }],
      maxCards: 6,
    },
    PAYLOAD,
  );
  assert.equal(resolved.value?.length, 1);
  assert.equal(resolved.value?.[0].fields[0].value, 3);
});

test("charts group repeated dimension values and sum the measure", () => {
  const resolved = resolveChart(chartConfig, PAYLOAD);
  assert.deepEqual(toChartRows(resolved.value!), [
    { label: "completed", Amount: 240 },
    { label: "pending", Amount: 250 },
  ].sort((a, b) => b.Amount - a.Amount));
});

test("each aggregation combines a repeated dimension differently", () => {
  const amountFor = (aggregation: ChartConfig["aggregation"]) => {
    const resolved = resolveChart({ ...chartConfig, aggregation, sort: null }, PAYLOAD);
    const completed = resolved.value?.points.find(
      (point) => point.label === "completed",
    );
    return completed?.values.Amount;
  };

  assert.equal(amountFor("sum"), 240);
  assert.equal(amountFor("avg"), 120);
  assert.equal(amountFor("count"), 2);
  assert.equal(amountFor("min"), 90);
  assert.equal(amountFor("max"), 150);
});

test("aggregation none keeps every row as its own point", () => {
  const resolved = resolveChart(
    { ...chartConfig, aggregation: "none", sort: null },
    PAYLOAD,
  );
  assert.equal(resolved.value?.points.length, 3);
});

test("charts without a dimension or measure explain what is missing", () => {
  const noDimension = resolveChart(
    { ...chartConfig, dimension: { path: [], label: "", format: auto } },
    PAYLOAD,
  );
  assert.equal(noDimension.value, null);
  assert.match(noDimension.error ?? "", /dimension and at least one measure/);

  const noMeasure = resolveChart({ ...chartConfig, measures: [] }, PAYLOAD);
  assert.equal(noMeasure.value, null);
});

test("charts flag points beyond the configured maximum", () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    status: `s${index}`,
    amount: index,
  }));
  const resolved = resolveChart(
    { ...chartConfig, maxPoints: 5, sort: null },
    { orders: rows },
  );
  assert.equal(resolved.value?.points.length, 5);
  assert.equal(resolved.value?.truncated, true);
});

test("duplicate measure labels stay distinct so series do not collide", () => {
  const resolved = resolveChart(
    {
      ...chartConfig,
      measures: [
        { path: ["amount"], label: "Amount", format: auto },
        { path: ["id"], label: "Amount", format: auto },
      ],
    },
    PAYLOAD,
  );
  assert.equal(new Set(resolved.value?.measureLabels).size, 2);
});
