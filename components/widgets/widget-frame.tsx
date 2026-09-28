"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatRelativeTime, freshnessOf } from "@/lib/freshness";
import type { ApiConnection, CachedResponse, Widget } from "@/lib/types";
import { WidgetView } from "./widget-view";

const WIDTH_CLASSES: Record<Widget["width"], string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
};

const HEIGHT_CLASSES: Record<Widget["height"], string> = {
  sm: "min-h-40",
  md: "min-h-64",
  lg: "min-h-96",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  empty: "neutral",
  fresh: "positive",
  stale: "warning",
  error: "danger",
};

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

  return (
    <Card
      className={cn(
        "flex flex-col",
        WIDTH_CLASSES[widget.width],
        HEIGHT_CLASSES[widget.height],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{widget.title}</h3>
          <p className="truncate text-[11px] text-ink-subtle">
            {connection ? connection.name : "Connection missing"}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {formatRelativeTime(entry?.fetchedAt ?? null)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {pending ? (
            <Loader2 className="size-3.5 animate-spin text-ink-subtle" aria-label="Refreshing" />
          ) : null}
          <Badge tone={STATUS_TONES[status]}>
            {status === "empty" ? "no data" : status}
          </Badge>
          {actions}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3">
        {!connection ? (
          <p className="text-xs text-danger">
            The connection behind this widget was deleted.
          </p>
        ) : entry?.error && !hasData ? (
          <p className="flex items-start gap-1.5 text-xs text-danger">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {entry.error}
          </p>
        ) : !hasData ? (
          <p className="text-xs text-ink-muted">
            {pending ? "Fetching data…" : "No data yet. Refresh to load this source."}
          </p>
        ) : (
          <>
            {entry?.error ? (
              <p className="mb-2 rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-[11px]">
                Showing the last successful data. Latest refresh failed:{" "}
                {entry.error}
              </p>
            ) : null}
            <WidgetView config={widget.config} data={entry?.data} />
          </>
        )}
      </div>
    </Card>
  );
}
