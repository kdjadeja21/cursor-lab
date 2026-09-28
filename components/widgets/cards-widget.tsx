"use client";

import { formatValue } from "@/lib/format";
import { resolveCards } from "@/lib/widget-data";
import type { CardsConfig } from "@/lib/types";
import { WidgetIssues } from "./widget-issues";

export function CardsWidget({
  config,
  data,
}: {
  config: CardsConfig;
  data: unknown;
}) {
  const resolved = resolveCards(config, data);

  if (resolved.error || !resolved.value) {
    return <WidgetIssues error={resolved.error} missing={resolved.missing} />;
  }

  if (resolved.value.length === 0) {
    return <p className="text-xs text-ink-muted">No records to show yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <WidgetIssues missing={resolved.missing} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-2">
        {resolved.value.map((record, index) => (
          <dl
            key={index}
            className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-muted/40 p-3"
          >
            {record.fields.map((field) => (
              <div
                key={field.mapping.path.join(".")}
                className="flex items-baseline justify-between gap-2"
              >
                <dt className="text-[11px] text-ink-muted">
                  {field.mapping.label}
                </dt>
                <dd className="truncate text-right text-xs font-medium">
                  {formatValue(field.value, field.mapping.format)}
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </div>
  );
}
