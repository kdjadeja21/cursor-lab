import {
  findScalars,
  findTabularArrays,
  pathLabel,
  type FieldSummary,
  type SchemaNode,
} from "./infer-schema.ts";
import type {
  CardsConfig,
  ChartConfig,
  ChartType,
  FieldFormat,
  FieldMapping,
  FieldPath,
  KpiConfig,
  TableConfig,
  WidgetConfig,
  WidgetKind,
} from "./types.ts";

export interface Recommendation {
  id: string;
  kind: WidgetKind;
  chartType: ChartType | null;
  title: string;
  /** Why this view was suggested, shown next to the preview. */
  reason: string;
  score: number;
  config: WidgetConfig;
}

const MAX_KPI_METRICS = 4;
const MAX_TABLE_COLUMNS = 8;
const MAX_CARD_FIELDS = 6;
const LOW_CARDINALITY_LIMIT = 12;
const PIE_CARDINALITY_LIMIT = 6;
const CURRENCY_HINT = /(amount|revenue|price|cost|total|sales|value|spend)/i;
const PERCENT_HINT = /(rate|ratio|percent|pct|share)/i;
/** Matches `id`, `order_id`, and `userId` without catching words like `monkey`. */
const ID_HINT = /(^|[._-])(id|ids|uuid|guid|key)$|[a-z0-9](Id|Ids|Uuid|Guid|Key)$/;

function humanize(path: FieldPath): string {
  const last = path[path.length - 1] ?? "value";
  const spaced = last
    .replace(/[_-]+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatFor(field: {
  path: FieldPath;
  kind: FieldSummary["kind"];
}): FieldFormat {
  const label = pathLabel(field.path);
  switch (field.kind) {
    case "date":
      return { kind: "date" };
    case "number":
      if (PERCENT_HINT.test(label)) return { kind: "percent", decimals: 1 };
      if (CURRENCY_HINT.test(label)) {
        return { kind: "currency", currency: "USD", decimals: 2 };
      }
      return { kind: "number" };
    default:
      return { kind: "auto" };
  }
}

function toMapping(field: {
  path: FieldPath;
  kind: FieldSummary["kind"];
}): FieldMapping {
  return {
    path: field.path,
    label: humanize(field.path),
    format: formatFor(field),
  };
}

function isMeasure(field: FieldSummary) {
  return (
    field.kind === "number" &&
    field.filledCount > 0 &&
    !ID_HINT.test(pathLabel(field.path))
  );
}

function isDimension(field: FieldSummary) {
  return (
    (field.kind === "string" || field.kind === "boolean") &&
    field.filledCount > 0 &&
    !ID_HINT.test(pathLabel(field.path))
  );
}

function tableConfig(
  sourcePath: FieldPath,
  fields: FieldSummary[],
): TableConfig {
  return {
    kind: "table",
    sourcePath,
    columns: fields.slice(0, MAX_TABLE_COLUMNS).map(toMapping),
    sort: null,
    search: "",
    pageSize: 10,
  };
}

function kpiConfig(
  metrics: { path: FieldPath; kind: FieldSummary["kind"] }[],
): KpiConfig {
  return { kind: "kpi", metrics: metrics.map(toMapping) };
}

function cardsConfig(
  sourcePath: FieldPath,
  fields: { path: FieldPath; kind: FieldSummary["kind"] }[],
): CardsConfig {
  return {
    kind: "cards",
    sourcePath,
    fields: fields.slice(0, MAX_CARD_FIELDS).map(toMapping),
    maxCards: 6,
  };
}

function chartConfig(
  chartType: ChartType,
  sourcePath: FieldPath,
  dimension: FieldSummary,
  measures: FieldSummary[],
  aggregation: ChartConfig["aggregation"],
): ChartConfig {
  return {
    kind: "chart",
    chartType,
    sourcePath,
    dimension: toMapping(dimension),
    measures: measures.map(toMapping),
    aggregation,
    sort:
      dimension.kind === "date"
        ? { by: "dimension", direction: "asc" }
        : { by: "measure", direction: "desc" },
    maxPoints: 50,
  };
}

/**
 * Ranks the views that fit the inferred response. Recommendations are ordered
 * suggestions with prefilled field mappings; nothing is applied until the user
 * picks one.
 */
export function recommendVisualizations(root: SchemaNode): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const scalars = findScalars(root);
  const tables = findTabularArrays(root);

  const numericScalars = scalars.filter(
    (scalar) => scalar.kind === "number" && !ID_HINT.test(scalar.label),
  );
  if (numericScalars.length > 0) {
    const metrics = numericScalars.slice(0, MAX_KPI_METRICS);
    recommendations.push({
      id: "kpi-scalars",
      kind: "kpi",
      chartType: null,
      title: "Key metrics",
      reason: `${numericScalars.length} numeric value${
        numericScalars.length === 1 ? "" : "s"
      } sit outside any list, which is the shape KPI cards are for.`,
      score: 90,
      config: kpiConfig(metrics),
    });
  }

  for (const [index, candidate] of tables.entries()) {
    const { node, rowCount, fields } = candidate;
    const source = node.path;
    const label = pathLabel(source);
    const measures = fields.filter(isMeasure);
    const dimensions = fields.filter(isDimension);
    const dates = fields.filter((field) => field.kind === "date");

    recommendations.push({
      id: `table-${label}`,
      kind: "table",
      chartType: null,
      title: `${humanize(source)} table`,
      reason: `${label} holds ${rowCount} record${
        rowCount === 1 ? "" : "s"
      } with ${fields.length} consistent field${
        fields.length === 1 ? "" : "s"
      }.`,
      score: 85 - index * 5,
      config: tableConfig(source, fields),
    });

    if (dates.length > 0 && measures.length > 0) {
      const dimension = dates[0];
      const distinctDates = dimension.distinctCount;
      recommendations.push({
        id: `line-${label}`,
        kind: "chart",
        chartType: "line",
        title: `${humanize(measures[0].path)} over time`,
        reason: `${pathLabel(dimension.path)} parses as a date and ${pathLabel(
          measures[0].path,
        )} is numeric, so a time series is available.`,
        score: 80 - index * 5,
        config: chartConfig(
          "line",
          source,
          dimension,
          measures.slice(0, 2),
          distinctDates < rowCount ? "sum" : "none",
        ),
      });
    }

    const groupable = dimensions
      .filter(
        (field) =>
          field.distinctCount > 1 && field.distinctCount <= LOW_CARDINALITY_LIMIT,
      )
      .sort((a, b) => a.distinctCount - b.distinctCount);

    if (groupable.length > 0 && measures.length > 0) {
      const dimension = groupable[0];
      recommendations.push({
        id: `bar-${label}-${pathLabel(dimension.path)}`,
        kind: "chart",
        chartType: "bar",
        title: `${humanize(measures[0].path)} by ${humanize(dimension.path)}`,
        reason: `${pathLabel(dimension.path)} has only ${
          dimension.distinctCount
        } distinct values across ${rowCount} records, so totals group cleanly.`,
        score: 75 - index * 5,
        config: chartConfig(
          "bar",
          source,
          dimension,
          measures.slice(0, 2),
          "sum",
        ),
      });

      if (dimension.distinctCount <= PIE_CARDINALITY_LIMIT) {
        recommendations.push({
          id: `pie-${label}-${pathLabel(dimension.path)}`,
          kind: "chart",
          chartType: "pie",
          title: `${humanize(measures[0].path)} share by ${humanize(
            dimension.path,
          )}`,
          reason: `Few enough categories (${dimension.distinctCount}) for a share-of-total view.`,
          score: 60 - index * 5,
          config: chartConfig(
            "pie",
            source,
            dimension,
            measures.slice(0, 1),
            "sum",
          ),
        });
      }
    }

    recommendations.push({
      id: `cards-${label}`,
      kind: "cards",
      chartType: null,
      title: `${humanize(source)} cards`,
      reason: `Shows the first records from ${label} one card at a time.`,
      score: 55 - index * 5,
      config: cardsConfig(source, fields),
    });
  }

  if (tables.length === 0 && scalars.length > 1) {
    recommendations.push({
      id: "cards-root",
      kind: "cards",
      chartType: null,
      title: "Response fields",
      reason:
        "The response is a single record, so its fields are shown as a card.",
      score: 50,
      config: cardsConfig([], scalars),
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/** Blank configuration used when a user picks a view manually. */
export function emptyConfigFor(kind: WidgetKind): WidgetConfig {
  switch (kind) {
    case "table":
      return {
        kind: "table",
        sourcePath: [],
        columns: [],
        sort: null,
        search: "",
        pageSize: 10,
      };
    case "kpi":
      return { kind: "kpi", metrics: [] };
    case "cards":
      return { kind: "cards", sourcePath: [], fields: [], maxCards: 6 };
    case "chart":
      return {
        kind: "chart",
        chartType: "bar",
        sourcePath: [],
        dimension: { path: [], label: "", format: { kind: "auto" } },
        measures: [],
        aggregation: "sum",
        sort: null,
        maxPoints: 50,
      };
    default: {
      const exhaustive: never = kind;
      throw new Error(`Unsupported widget kind: ${String(exhaustive)}`);
    }
  }
}
