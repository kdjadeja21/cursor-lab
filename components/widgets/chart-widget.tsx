"use client";

import { useMemo } from "react";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatValue } from "@/lib/format";
import { resolveChart, toChartRows } from "@/lib/widget-data";
import type { ChartConfig } from "@/lib/types";
import { WidgetIssues } from "./widget-issues";

const SERIES_COLORS = [
  "oklch(53% 0.19 262)",
  "oklch(58% 0.14 155)",
  "oklch(72% 0.15 75)",
  "oklch(56% 0.19 25)",
  "oklch(55% 0.17 300)",
  "oklch(60% 0.12 210)",
];

const AXIS_STYLE = { fontSize: 11, fill: "oklch(50.5% 0.015 260)" } as const;

export function ChartWidget({
  config,
  data,
}: {
  config: ChartConfig;
  data: unknown;
}) {
  const resolved = useMemo(() => resolveChart(config, data), [config, data]);

  if (resolved.error || !resolved.value) {
    return <WidgetIssues error={resolved.error} missing={resolved.missing} />;
  }

  const { points, measureLabels, truncated } = resolved.value;
  const rows = toChartRows(resolved.value);
  const primaryFormat = config.measures[0]?.format ?? { kind: "auto" as const };
  const formatMeasure = (value: unknown) => formatValue(value, primaryFormat);
  const formatDimension = (value: unknown) =>
    formatValue(value, config.dimension.format);

  if (points.length === 0) {
    return (
      <p className="text-xs text-ink-muted">
        The list is empty, so there is nothing to plot yet.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <WidgetIssues missing={resolved.missing} />

      <div className="min-h-[12rem] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {config.chartType === "pie" ? (
            <PieChart>
              <Tooltip
                wrapperClassName="chart-tooltip"
                formatter={(value: unknown) => formatMeasure(value)}
              />
              <Legend wrapperStyle={AXIS_STYLE} />
              <Pie
                data={rows}
                dataKey={measureLabels[0]}
                nameKey="label"
                innerRadius="45%"
                outerRadius="75%"
                paddingAngle={1}
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
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(92.4% 0.006 250)" />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickFormatter={formatDimension}
                interval="preserveStartEnd"
              />
              <YAxis tick={AXIS_STYLE} width={56} tickFormatter={formatMeasure} />
              <Tooltip
                wrapperClassName="chart-tooltip"
                formatter={(value: unknown) => formatMeasure(value)}
                labelFormatter={formatDimension}
              />
              {measureLabels.length > 1 ? <Legend wrapperStyle={AXIS_STYLE} /> : null}
              {measureLabels.map((label, index) => (
                <Bar
                  key={label}
                  dataKey={label}
                  fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : config.chartType === "area" ? (
            <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(92.4% 0.006 250)" />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickFormatter={formatDimension}
                interval="preserveStartEnd"
              />
              <YAxis tick={AXIS_STYLE} width={56} tickFormatter={formatMeasure} />
              <Tooltip
                wrapperClassName="chart-tooltip"
                formatter={(value: unknown) => formatMeasure(value)}
                labelFormatter={formatDimension}
              />
              {measureLabels.length > 1 ? <Legend wrapperStyle={AXIS_STYLE} /> : null}
              {measureLabels.map((label, index) => (
                <Area
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(92.4% 0.006 250)" />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickFormatter={formatDimension}
                interval="preserveStartEnd"
              />
              <YAxis tick={AXIS_STYLE} width={56} tickFormatter={formatMeasure} />
              <Tooltip
                wrapperClassName="chart-tooltip"
                formatter={(value: unknown) => formatMeasure(value)}
                labelFormatter={formatDimension}
              />
              {measureLabels.length > 1 ? <Legend wrapperStyle={AXIS_STYLE} /> : null}
              {measureLabels.map((label, index) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {truncated ? (
        <p className="text-[11px] text-ink-subtle">
          Showing the first {config.maxPoints} points of {points.length}.
        </p>
      ) : null}
    </div>
  );
}
