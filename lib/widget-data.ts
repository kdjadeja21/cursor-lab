import { toNumber } from "./format.ts";
import {
  getByPath,
  isPlainObject,
  looksLikeImageUrl,
  pathLabel,
} from "./infer-schema.ts";
import type {
  CardsConfig,
  ChartConfig,
  FieldMapping,
  KpiConfig,
  TableConfig,
} from "./types.ts";

export interface Resolved<T> {
  value: T | null;
  /** Mapped fields the current payload no longer contains. */
  missing: FieldMapping[];
  error: string | null;
}

const MAX_TABLE_ROWS = 2_000;

function rowsAt(data: unknown, sourcePath: string[]) {
  const source = getByPath(data, sourcePath);
  if (source === undefined) {
    return {
      rows: null,
      error: `The response no longer contains ${pathLabel(sourcePath)}.`,
    };
  }
  if (!Array.isArray(source)) {
    return {
      rows: null,
      error: `${pathLabel(sourcePath)} is not a list, so it cannot fill this widget.`,
    };
  }
  return { rows: source.filter(isPlainObject).slice(0, MAX_TABLE_ROWS), error: null };
}

function findMissing(
  rows: Record<string, unknown>[],
  mappings: FieldMapping[],
): FieldMapping[] {
  const sample = rows.slice(0, 50);
  return mappings.filter((mapping) =>
    sample.every((row) => getByPath(row, mapping.path) === undefined),
  );
}

function compareValues(a: unknown, b: unknown) {
  const numericA = toNumber(a);
  const numericB = toNumber(b);
  if (numericA !== null && numericB !== null) return numericA - numericB;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

export interface TableData {
  columns: FieldMapping[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export function resolveTable(
  config: TableConfig,
  data: unknown,
): Resolved<TableData> {
  const { rows, error } = rowsAt(data, config.sourcePath);
  if (!rows) return { value: null, missing: [], error };

  const query = config.search.trim().toLowerCase();
  const filtered = query
    ? rows.filter((row) =>
        config.columns.some((column) =>
          String(getByPath(row, column.path) ?? "")
            .toLowerCase()
            .includes(query),
        ),
      )
    : rows;

  const sorted = config.sort
    ? [...filtered].sort((a, b) => {
        const order = compareValues(
          getByPath(a, config.sort!.path),
          getByPath(b, config.sort!.path),
        );
        return config.sort!.direction === "asc" ? order : -order;
      })
    : filtered;

  return {
    value: { columns: config.columns, rows: sorted, totalRows: rows.length },
    missing: findMissing(rows, config.columns),
    error: null,
  };
}

export interface KpiMetric {
  mapping: FieldMapping;
  value: unknown;
}

export function resolveKpi(
  config: KpiConfig,
  data: unknown,
): Resolved<KpiMetric[]> {
  if (config.metrics.length === 0) {
    return { value: [], missing: [], error: null };
  }
  const metrics = config.metrics.map((mapping) => ({
    mapping,
    value: getByPath(data, mapping.path),
  }));
  return {
    value: metrics,
    missing: config.metrics.filter(
      (mapping) => getByPath(data, mapping.path) === undefined,
    ),
    error: null,
  };
}

export interface CardRecord {
  imageUrl: string | null;
  title: string | null;
  fields: { mapping: FieldMapping; value: unknown }[];
}

export function resolveCards(
  config: CardsConfig,
  data: unknown,
): Resolved<CardRecord[]> {
  const source = getByPath(data, config.sourcePath);
  if (source === undefined) {
    return {
      value: null,
      missing: [],
      error: `The response no longer contains ${pathLabel(config.sourcePath)}.`,
    };
  }

  const records = Array.isArray(source)
    ? source.filter(isPlainObject).slice(0, config.maxCards)
    : isPlainObject(source)
      ? [source]
      : null;

  if (!records) {
    return {
      value: null,
      missing: [],
      error: `${pathLabel(config.sourcePath)} is a single value, so it cannot be shown as cards.`,
    };
  }

  // Absolute paths are used when the source is the response root itself.
  const relative = Array.isArray(source) || config.sourcePath.length > 0;
  const read = (record: Record<string, unknown>, path: string[]) =>
    relative ? getByPath(record, path) : getByPath(data, path);

  return {
    value: records.map((record) => {
      const imageValue = config.imagePath
        ? read(record, config.imagePath)
        : undefined;
      const titleValue = config.titlePath
        ? read(record, config.titlePath)
        : undefined;
      return {
        imageUrl: looksLikeImageUrl(imageValue) ? String(imageValue) : null,
        title:
          titleValue === undefined || titleValue === null
            ? null
            : String(titleValue),
        fields: config.fields.map((mapping) => ({
          mapping,
          value: read(record, mapping.path),
        })),
      };
    }),
    missing: relative ? findMissing(records, config.fields) : [],
    error: null,
  };
}

export interface ChartPoint {
  label: string;
  /** Measure label to aggregated numeric value. */
  values: Record<string, number>;
}

export interface ChartData {
  points: ChartPoint[];
  measureLabels: string[];
  truncated: boolean;
}

function aggregate(values: number[], mode: ChartConfig["aggregation"]): number {
  switch (mode) {
    case "none":
      return values[values.length - 1] ?? 0;
    case "sum":
      return values.reduce((total, value) => total + value, 0);
    case "avg":
      return values.length === 0
        ? 0
        : values.reduce((total, value) => total + value, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return values.length === 0 ? 0 : Math.min(...values);
    case "max":
      return values.length === 0 ? 0 : Math.max(...values);
    default: {
      const exhaustive: never = mode;
      throw new Error(`Unsupported aggregation: ${String(exhaustive)}`);
    }
  }
}

/**
 * Groups rows by the dimension value and combines each measure. With
 * aggregation "none" every row stays its own point, which suits series that are
 * already one row per period.
 */
export function resolveChart(
  config: ChartConfig,
  data: unknown,
): Resolved<ChartData> {
  const { rows, error } = rowsAt(data, config.sourcePath);
  if (!rows) return { value: null, missing: [], error };
  if (config.dimension.path.length === 0 || config.measures.length === 0) {
    return {
      value: null,
      missing: [],
      error: "Choose a dimension and at least one measure for this chart.",
    };
  }

  const measureLabels: string[] = [];
  for (const measure of config.measures) {
    let label = measure.label || pathLabel(measure.path);
    while (measureLabels.includes(label)) label = `${label} `;
    measureLabels.push(label);
  }

  const groups = new Map<string, { label: string; series: number[][] }>();
  for (const [rowIndex, row] of rows.entries()) {
    const rawLabel = getByPath(row, config.dimension.path);
    const label = rawLabel === undefined || rawLabel === null ? "—" : String(rawLabel);
    const key = config.aggregation === "none" ? `${label}\u0000${rowIndex}` : label;
    const group =
      groups.get(key) ??
      ({ label, series: config.measures.map(() => []) } satisfies {
        label: string;
        series: number[][];
      });
    config.measures.forEach((measure, index) => {
      const numeric = toNumber(getByPath(row, measure.path));
      if (numeric !== null) group.series[index].push(numeric);
    });
    groups.set(key, group);
  }

  let points: ChartPoint[] = [...groups.values()].map((group) => ({
    label: group.label,
    values: Object.fromEntries(
      group.series.map((values, index) => [
        measureLabels[index],
        aggregate(values, config.aggregation),
      ]),
    ),
  }));

  if (config.sort) {
    const primary = measureLabels[0];
    points = [...points].sort((a, b) => {
      const order =
        config.sort!.by === "dimension"
          ? compareValues(a.label, b.label)
          : (a.values[primary] ?? 0) - (b.values[primary] ?? 0);
      return config.sort!.direction === "asc" ? order : -order;
    });
  }

  const truncated = points.length > config.maxPoints;

  return {
    value: {
      points: truncated ? points.slice(0, config.maxPoints) : points,
      measureLabels,
      truncated,
    },
    missing: findMissing(rows, [config.dimension, ...config.measures]),
    error: null,
  };
}

/** Recharts needs flat objects, so points are converted at render time. */
export function toChartRows(data: ChartData) {
  return data.points.map((point) => ({ label: point.label, ...point.values }));
}
