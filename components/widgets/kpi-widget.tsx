"use client";

import { formatValue } from "@/lib/format";
import { resolveKpi } from "@/lib/widget-data";
import type { KpiConfig } from "@/lib/types";
import { WidgetIssues } from "./widget-issues";

export function KpiWidget({
  config,
  data,
}: {
  config: KpiConfig;
  data: unknown;
}) {
  const resolved = resolveKpi(config, data);

  if (resolved.error || !resolved.value) {
    return <WidgetIssues error={resolved.error} missing={resolved.missing} />;
  }

  if (resolved.value.length === 0) {
    return (
      <p className="text-xs text-ink-muted">
        Select one or more numeric fields to show as KPI cards.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <WidgetIssues missing={resolved.missing} />
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
        {resolved.value.map((metric) => (
          <div
            key={metric.mapping.path.join(".")}
            className="rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5"
          >
            <dt className="truncate text-[11px] text-ink-muted">
              {metric.mapping.label}
            </dt>
            <dd className="mt-1 truncate text-xl font-semibold tabular-nums">
              {formatValue(metric.value, metric.mapping.format)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
