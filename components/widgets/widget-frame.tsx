"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Gauge,
  LayoutGrid,
  Loader2,
  Table2,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WidgetSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import {
  formatAbsoluteTime,
  formatRelativeTime,
  freshnessOf,
  type FreshnessStatus,
} from "@/lib/freshness";
import type { ApiConnection, CachedResponse, Widget } from "@/lib/types";
import { WidgetView } from "./widget-view";

const WIDTH_CLASSES: Record<Widget["width"], string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
};

const HEIGHT_CLASSES: Record<Widget["height"], string> = {
  sm: "min-h-44",
  md: "min-h-72",
  lg: "min-h-[26rem]",
};

const STATUS: Record<FreshnessStatus, { tone: BadgeTone; label: string }> = {
  empty: { tone: "neutral", label: "no data" },
  fresh: { tone: "positive", label: "fresh" },
  stale: { tone: "warning", label: "stale" },
  error: { tone: "danger", label: "error" },
};

const KIND_ICONS = {
  table: Table2,
  kpi: Gauge,
  cards: LayoutGrid,
  chart: BarChart3,
} as const;

/**
 * Wraps a widget with its per-source freshness, loading, and error state so a
 * cached value is never mistaken for a live one.
 */
export function WidgetFrame({
  widget,
  connection,
  entry,
  pending,
  actions,
}: {
  widget: Widget;
  connection: ApiConnection | undefined;
  entry: CachedResponse | undefined;
  pending: boolean;
  actions?: ReactNode;
}) {
  const status = connection ? freshnessOf(connection, entry) : "error";
  const hasData = entry?.data !== null && entry?.data !== undefined;
  const KindIcon = KIND_ICONS[widget.config.kind];

  return (
    <Card
      className={cn(
        "animate-in-fade flex flex-col overflow-hidden",
        WIDTH_CLASSES[widget.width],
        HEIGHT_CLASSES[widget.height],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line bg-gradient-to-b from-surface-muted/70 to-surface px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
            <KindIcon className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{widget.title}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-ink-subtle">
              <span className="truncate">
                {connection ? connection.name : "Connection missing"}
              </span>
              <span aria-hidden>·</span>
              <span
                className="inline-flex items-center gap-1 whitespace-nowrap"
                title={formatAbsoluteTime(entry?.fetchedAt ?? null)}
              >
                <Clock className="size-3" aria-hidden />
                {formatRelativeTime(entry?.fetchedAt ?? null)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {pending ? (
            <Loader2
              className="size-3.5 animate-spin text-ink-subtle"
              aria-label="Refreshing"
            />
          ) : null}
          <Badge tone={STATUS[status].tone} dot pulse={pending}>
            {STATUS[status].label}
          </Badge>
          {actions}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3">
        {!connection ? (
          <p className="flex items-start gap-1.5 text-xs text-danger">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            The connection behind this widget was deleted.
          </p>
        ) : entry?.error && !hasData ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-danger/25 bg-danger-soft px-2.5 py-2 text-xs text-danger">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {entry.error}
          </p>
        ) : !hasData ? (
          pending ? (
            <WidgetSkeleton />
          ) : (
            <p className="text-xs text-ink-muted">
              No data yet. Refresh to load this source.
            </p>
          )
        ) : (
          <div className="flex h-full flex-col gap-2">
            {entry?.error ? (
              <p className="flex items-start gap-1.5 rounded-lg border border-warning/30 bg-warning-soft px-2.5 py-1.5 text-[11px]">
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0 text-warning"
                  aria-hidden
                />
                <span>
                  Showing the last successful data. Latest refresh failed:{" "}
                  {entry.error}
                </span>
              </p>
            ) : null}
            <div className="min-h-0 flex-1">
              <WidgetView config={widget.config} data={entry?.data} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
