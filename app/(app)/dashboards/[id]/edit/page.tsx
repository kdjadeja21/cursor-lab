"use client";

import Link from "next/link";
import { use, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { WidgetFrame } from "@/components/widgets/widget-frame";
import { describeRefresh, REFRESH_PRESETS } from "@/lib/connection";
import { formatRelativeTime, freshnessOf } from "@/lib/freshness";
import { useRefresh } from "@/lib/store/refresh";
import { useDashboard, useWorkspace } from "@/lib/store/workspace";
import type { Widget } from "@/lib/types";

const STATUS_TONES: Record<string, BadgeTone> = {
  empty: "neutral",
  fresh: "positive",
  stale: "warning",
  error: "danger",
};

const WIDTH_LABELS: Record<Widget["width"], string> = {
  1: "1/4",
  2: "2/4",
  3: "3/4",
  4: "Full",
};

export default function DashboardEditorPage({
  params,
}: PageProps<"/dashboards/[id]/edit">) {
  const { id } = use(params);
  const { ready, dashboard, widgets, connections } = useDashboard(id);
  const {
    state,
    updateDashboard,
    updateWidget,
    deleteWidget,
    duplicateWidget,
    moveWidget,
    saveConnection,
  } = useWorkspace();
  const { pending, refresh, refreshMany } = useRefresh();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!dashboard) {
    return ready ? (
      <EmptyState
        title="Dashboard not found"
        action={
          <Link href="/" className={buttonClasses()}>
            Back to dashboards
          </Link>
        }
      />
    ) : null;
  }

  const connectionIds = connections.map((connection) => connection.id);
  const refreshing = connectionIds.some((connectionId) => pending[connectionId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/", label: "Dashboards" }}
        title={`Edit ${dashboard.name}`}
        description="Arrange widgets on the four-column grid and set how each source refreshes."
        actions={
          <>
            <Button
              onClick={() => void refreshMany(connectionIds)}
              disabled={refreshing || connectionIds.length === 0}
            >
              {refreshing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              Refresh all
            </Button>
            <Link href={`/dashboards/${id}`} className={buttonClasses()}>
              <Eye className="size-4" aria-hidden />
              Preview
            </Link>
            <Link
              href={`/dashboards/${id}/widgets/new`}
              className={buttonClasses({ variant: "primary" })}
            >
              <Plus className="size-4" aria-hidden />
              Add widget
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4">
          {widgets.length === 0 ? (
            <EmptyState
              icon={<Plus className="size-5" aria-hidden />}
              title="No widgets yet"
              description="Add a widget from one of your API connections to start building this dashboard."
              action={
                <Link
                  href={`/dashboards/${id}/widgets/new`}
                  className={buttonClasses({ variant: "primary" })}
                >
                  <Plus className="size-4" aria-hidden />
                  Add widget
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {widgets.map((widget, index) => (
                <WidgetFrame
                  key={widget.id}
                  widget={widget}
                  connection={connections.find(
                    (connection) => connection.id === widget.connectionId,
                  )}
                  entry={state.cache[widget.connectionId]}
                  pending={Boolean(pending[widget.connectionId])}
                  actions={
                    <span className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${widget.title} earlier`}
                        className="rounded p-1 text-ink-subtle hover:text-ink disabled:opacity-40"
                      >
                        <ChevronLeft className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, 1)}
                        disabled={index === widgets.length - 1}
                        aria-label={`Move ${widget.title} later`}
                        className="rounded p-1 text-ink-subtle hover:text-ink disabled:opacity-40"
                      >
                        <ChevronRight className="size-3.5" aria-hidden />
                      </button>
                      <select
                        aria-label={`Width of ${widget.title}`}
                        value={String(widget.width)}
                        onChange={(event) =>
                          updateWidget(widget.id, {
                            width: Number(event.target.value) as Widget["width"],
                          })
                        }
                        className="rounded-md border border-line-strong bg-surface px-1 py-0.5 text-[11px] text-ink-muted"
                      >
                        {([1, 2, 3, 4] as Widget["width"][]).map((value) => (
                          <option key={value} value={value}>
                            {WIDTH_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={`Height of ${widget.title}`}
                        value={widget.height}
                        onChange={(event) =>
                          updateWidget(widget.id, {
                            height: event.target.value as Widget["height"],
                          })
                        }
                        className="rounded-md border border-line-strong bg-surface px-1 py-0.5 text-[11px] text-ink-muted"
                      >
                        <option value="sm">S</option>
                        <option value="md">M</option>
                        <option value="lg">L</option>
                      </select>
                      <Link
                        href={`/dashboards/${id}/widgets/${widget.id}`}
                        aria-label={`Edit ${widget.title}`}
                        className="rounded p-1 text-ink-subtle hover:text-ink"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => duplicateWidget(widget.id)}
                        aria-label={`Duplicate ${widget.title}`}
                        className="rounded p-1 text-ink-subtle hover:text-ink"
                      >
                        <Copy className="size-3.5" aria-hidden />
                      </button>
                      {confirmingId === widget.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteWidget(widget.id);
                            setConfirmingId(null);
                          }}
                          className="rounded bg-danger px-1.5 py-0.5 text-[11px] text-white"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(widget.id)}
                          aria-label={`Remove ${widget.title}`}
                          className="rounded p-1 text-ink-subtle hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:order-2">
          <Card>
            <CardHeader
              icon={<Pencil className="size-3.5" aria-hidden />}
              title="Dashboard"
            />
            <div className="flex flex-col gap-3 p-4">
              <TextField
                label="Name"
                value={dashboard.name}
                onChange={(event) =>
                  updateDashboard(id, { name: event.target.value })
                }
              />
              <TextAreaField
                label="Description"
                rows={3}
                className="font-sans text-sm"
                value={dashboard.description}
                onChange={(event) =>
                  updateDashboard(id, { description: event.target.value })
                }
              />
              <p className="text-[11px] text-ink-subtle">
                Changes save to this browser as you type.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={<RefreshCw className="size-3.5" aria-hidden />}
              title="Refresh behaviour"
              description="Each connection keeps its own schedule and is fetched once per interval, however many widgets use it."
            />
            <div className="flex flex-col gap-4 p-4">
              {connections.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  No sources on this dashboard yet.
                </p>
              ) : (
                connections.map((connection) => {
                  const entry = state.cache[connection.id];
                  const status = freshnessOf(connection, entry);
                  const widgetCount = widgets.filter(
                    (widget) => widget.connectionId === connection.id,
                  ).length;
                  return (
                    <div
                      key={connection.id}
                      className="flex flex-col gap-2 border-b border-line pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/connections/${connection.id}`}
                          className="truncate text-xs font-medium hover:underline"
                        >
                          {connection.name}
                        </Link>
                        <Badge tone={STATUS_TONES[status]}>
                          {status === "empty" ? "no data" : status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-ink-subtle">
                        {widgetCount} widget{widgetCount === 1 ? "" : "s"} · last
                        success {formatRelativeTime(entry?.fetchedAt ?? null)} ·{" "}
                        {describeRefresh(connection.refreshSeconds)}
                      </p>
                      {entry?.error ? (
                        <p className="rounded border border-danger/25 bg-danger-soft px-2 py-1 text-[11px] text-danger">
                          {entry.error}
                        </p>
                      ) : null}
                      <SelectField
                        label="Schedule"
                        value={
                          connection.refreshSeconds === null
                            ? "manual"
                            : String(connection.refreshSeconds)
                        }
                        onChange={(event) =>
                          saveConnection({
                            ...connection,
                            refreshSeconds:
                              event.target.value === "manual"
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      >
                        {REFRESH_PRESETS.map((preset) => (
                          <option
                            key={preset.label}
                            value={
                              preset.seconds === null
                                ? "manual"
                                : String(preset.seconds)
                            }
                          >
                            {preset.label}
                          </option>
                        ))}
                      </SelectField>
                      <Button
                        size="sm"
                        className="self-start"
                        disabled={Boolean(pending[connection.id])}
                        onClick={() => void refresh(connection.id)}
                      >
                        {pending[connection.id] ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <RefreshCw className="size-3.5" aria-hidden />
                        )}
                        Refresh now
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
