"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatValue } from "@/lib/format";
import { useElementSize } from "./use-element-size";
import { resolveChart, toChartRows } from "@/lib/widget-data";
import type { ChartConfig, FieldFormat } from "@/lib/types";
import { WidgetIssues } from "./widget-issues";

const SERIES_COLORS = [
  "oklch(53% 0.2 272)",
  "oklch(64% 0.17 200)",
  "oklch(57% 0.14 158)",
  "oklch(69% 0.15 72)",
  "oklch(55% 0.2 24)",
  "oklch(58% 0.17 320)",
];

const GRID_COLOR = "oklch(92.8% 0.006 265)";
const AXIS_TICK = { fontSize: 11, fill: "oklch(63% 0.014 268)" } as const;
const LEGEND_STYLE = { fontSize: 11, paddingTop: 4 } as const;
const AXIS_LINE = { stroke: GRID_COLOR } as const;

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  measureFormats,
  fallbackFormat,
  dimensionFormat,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: unknown;
  /** Keyed by series label so each measure keeps its own formatting. */
  measureFormats?: Record<string, FieldFormat>;
  fallbackFormat: FieldFormat;
  dimensionFormat: FieldFormat;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="chart-tooltip-shell">
      <p className="mb-1 text-[11px] font-medium text-ink">
        {formatValue(label, dimensionFormat)}
      </p>
      <ul className="flex flex-col gap-0.5">
        {payload.map((entry, index) => (
          <li
            key={`${entry.name}-${index}`}
            className="flex items-center gap-2 text-[11px] text-ink-muted"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span>{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-ink">
              {formatValue(
                entry.value,
                measureFormats?.[String(entry.name)] ?? fallbackFormat,
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartWidget({
  config,
  data,
}: {
  config: ChartConfig;
  data: unknown;
}) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [chartRef, { width, height }] = useElementSize<HTMLDivElement>();
  const resolved = useMemo(() => resolveChart(config, data), [config, data]);

  if (resolved.error || !resolved.value) {
    return <WidgetIssues error={resolved.error} missing={resolved.missing} />;
  }

  const { points, measureLabels, truncated } = resolved.value;
  const rows = toChartRows(resolved.value);
  const measureFormat = config.measures[0]?.format ?? { kind: "auto" as const };
  const measureFormats = Object.fromEntries(
    measureLabels.map((label, index) => [
      label,
      config.measures[index]?.format ?? measureFormat,
    ]),
  );
  const dimensionFormat = config.dimension.format;
  // The shared y axis can only use one format, so it follows the first measure.
  const formatMeasure = (value: unknown) => formatValue(value, measureFormat);
  // Recharts hands back the stringified axis key, so the original value is
  // looked up again to format booleans, numbers, and dates properly.
  const rawByLabel = new Map(points.map((point) => [point.label, point.raw]));
  const formatDimension = (value: unknown) =>
    formatValue(
      rawByLabel.has(String(value)) ? rawByLabel.get(String(value)) : value,
      dimensionFormat,
    );

  if (points.length === 0) {
    return (
      <p className="text-xs text-ink-muted">
        The list is empty, so there is nothing to plot yet.
      </p>
    );
  }

  const tooltip = (
    <Tooltip
      cursor={{ fill: "oklch(53% 0.2 272 / 0.06)" }}
      content={
        <ChartTooltip
          measureFormats={measureFormats}
          fallbackFormat={measureFormat}
          dimensionFormat={dimensionFormat}
        />
      }
    />
  );

  const sharedAxes = (
    <>
      <CartesianGrid strokeDasharray="4 4" stroke={GRID_COLOR} vertical={false} />
      <XAxis
        dataKey="label"
        tick={AXIS_TICK}
        tickFormatter={formatDimension}
        tickLine={false}
        axisLine={AXIS_LINE}
        interval="preserveStartEnd"
        minTickGap={12}
      />
      <YAxis
        tick={AXIS_TICK}
        width={58}
        tickFormatter={formatMeasure}
        tickLine={false}
        axisLine={false}
      />
    </>
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <WidgetIssues missing={resolved.missing} />

      <div ref={chartRef} className="min-h-[11rem] flex-1">
        {width > 0 && height > 0 ? (
          config.chartType === "pie" ? (
            <PieChart width={width} height={height}>
              {tooltip}
              <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
              <Pie
                data={rows}
                dataKey={measureLabels[0]}
                nameKey="label"
                innerRadius="52%"
                outerRadius="80%"
                paddingAngle={2}
                stroke="oklch(100% 0 0)"
                strokeWidth={2}
              >
                {rows.map((row, index) => (
                  <Cell
                    key={row.label}
                    fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          ) : config.chartType === "bar" ? (
            <BarChart
              data={rows}
              width={width}
              height={height}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              {sharedAxes}
              {tooltip}
              {measureLabels.length > 1 ? (
                <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
              ) : null}
              {measureLabels.map((label, index) => (
                <Bar
                  key={label}
                  dataKey={label}
                  fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                  radius={[6, 6, 2, 2]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          ) : config.chartType === "area" ? (
            <AreaChart
              data={rows}
              width={width}
              height={height}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                {measureLabels.map((label, index) => (
                  <linearGradient
                    key={label}
                    id={`${gradientId}-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={SERIES_COLORS[index % SERIES_COLORS.length]}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={SERIES_COLORS[index % SERIES_COLORS.length]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              {sharedAxes}
              {tooltip}
              {measureLabels.length > 1 ? (
                <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
              ) : null}
              {measureLabels.map((label, index) => (
                <Area
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  fill={`url(#${gradientId}-${index})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart
              data={rows}
              width={width}
              height={height}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              {sharedAxes}
              {tooltip}
              {measureLabels.length > 1 ? (
                <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
              ) : null}
              {measureLabels.map((label, index) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          )
        ) : null}
      </div>

      {truncated ? (
        <p className="text-[11px] text-ink-subtle">
          Showing the first {config.maxPoints} points of {points.length}.
        </p>
      ) : null}
    </div>
  );
}
