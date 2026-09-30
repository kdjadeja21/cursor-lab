"use client";

import { formatValue } from "@/lib/format";
import { resolveKpi } from "@/lib/widget-data";
import type { KpiConfig } from "@/lib/types";
import { WidgetIssues } from "./widget-issues";

const ACCENTS = [
  "from-brand/70 to-brand/20",
  "from-accent/70 to-accent/20",
  "from-positive/70 to-positive/20",
  "from-warning/70 to-warning/20",
];

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
    <div className="flex flex-col gap-2.5">
      <WidgetIssues missing={resolved.missing} />
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2.5">
        {resolved.value.map((metric, index) => (
          <div
            key={metric.mapping.path.join(".")}
            className="animate-in-fade relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-surface to-surface-muted/70 px-3.5 py-3 shadow-xs"
          >
            <span
              className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${
                ACCENTS[index % ACCENTS.length]
              }`}
              aria-hidden
            />
            <dt className="truncate text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              {metric.mapping.label}
            </dt>
            <dd className="mt-1.5 truncate text-2xl leading-tight font-semibold tabular-nums text-ink">
              {formatValue(metric.value, metric.mapping.format)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
