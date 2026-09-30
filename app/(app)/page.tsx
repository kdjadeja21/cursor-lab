"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Copy,
  LayoutDashboard,
  Layers,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextField } from "@/components/ui/field";
import { describeRefresh } from "@/lib/connection";
import { formatRelativeTime, freshnessOf } from "@/lib/freshness";
import { useRefresh } from "@/lib/store/refresh";
import { useWorkspace } from "@/lib/store/workspace";

type SortKey = "updated" | "name";

const STATUS_TONES: Record<string, BadgeTone> = {
  empty: "neutral",
  fresh: "positive",
  stale: "warning",
  error: "danger",
};

export default function DashboardListPage() {
  const { state, deleteDashboard, duplicateDashboard } = useWorkspace();
  const { pending, refresh } = useRefresh();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const dashboards = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? state.dashboards.filter(
          (dashboard) =>
            dashboard.name.toLowerCase().includes(term) ||
            dashboard.description.toLowerCase().includes(term),
        )
      : state.dashboards;
    return [...filtered].sort((a, b) =>
      sortKey === "name"
        ? a.name.localeCompare(b.name)
        : Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
  }, [query, sortKey, state.dashboards]);

  const connectionsById = useMemo(
    () =>
      new Map(state.connections.map((connection) => [connection.id, connection])),
    [state.connections],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboards"
        description="Connect the APIs you already use, pick the views that fit what they return, and keep everything in sync."
        actions={
          <>
            <Link href="/connections" className={buttonClasses()}>
              <Plug className="size-4" aria-hidden />
              Connections
            </Link>
            <Link
              href="/dashboards/new"
              className={buttonClasses({ variant: "primary" })}
            >
              <Plus className="size-4" aria-hidden />
              New dashboard
            </Link>
          </>
        }
      />

      {state.connections.length > 0 ? (
        <Card className="flex flex-wrap items-center gap-x-5 gap-y-2.5 px-4 py-3">
          <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Sources
          </span>
          {state.connections.map((connection) => {
            const entry = state.cache[connection.id];
            const status = freshnessOf(connection, entry);
            return (
              <Link
                key={connection.id}
                href={`/connections/${connection.id}`}
                className="group flex items-center gap-2 text-xs"
              >
                <Badge
                  tone={STATUS_TONES[status]}
                  dot
                  pulse={Boolean(pending[connection.id])}
                >
                  {status === "empty" ? "no data" : status}
                </Badge>
                <span className="font-medium text-ink group-hover:underline">
                  {connection.name}
                </span>
                <span className="text-ink-subtle">
                  {formatRelativeTime(entry?.fetchedAt ?? null)} ·{" "}
                  {describeRefresh(connection.refreshSeconds)}
                </span>
              </Link>
            );
          })}
        </Card>
      ) : null}

      {state.dashboards.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="size-5" aria-hidden />}
          title="No dashboards yet"
          description="Create a dashboard, connect a REST or GraphQL endpoint, and combine the widgets you need into one view."
          action={
            <Link
              href="/dashboards/new"
              className={buttonClasses({ variant: "primary" })}
            >
              <Plus className="size-4" aria-hidden />
              New dashboard
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
            <TextField
              label="Search dashboards"
              placeholder="Search by name or description"
              adornment={<Search className="size-3.5" aria-hidden />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <SelectField
              label="Sort by"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name</option>
            </SelectField>
          </div>

          {dashboards.length === 0 ? (
            <EmptyState
              title="No matches"
              description="No dashboard matches that search."
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboards.map((dashboard) => {
                const widgets = state.widgets.filter(
                  (widget) => widget.dashboardId === dashboard.id,
                );
                const connectionIds = [
                  ...new Set(widgets.map((widget) => widget.connectionId)),
                ];
                const sources = connectionIds
                  .map((connectionId) => connectionsById.get(connectionId))
                  .filter((connection) => connection !== undefined);
                const refreshing = connectionIds.some(
                  (connectionId) => pending[connectionId],
                );
                const lastUpdated =
                  sources
                    .map((connection) => state.cache[connection.id]?.fetchedAt)
                    .filter((value): value is string => Boolean(value))
                    .sort()
                    .at(-1) ?? null;

                return (
                  <Card
                    key={dashboard.id}
                    interactive
                    className="animate-in-fade overflow-hidden"
                  >
                    <li className="flex h-full flex-col">
                      <span
                        className="block h-1 bg-gradient-to-r from-brand via-accent to-brand/30"
                        aria-hidden
                      />
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div>
                          <Link
                            href={`/dashboards/${dashboard.id}`}
                            className="text-sm font-semibold hover:underline"
                          >
                            {dashboard.name}
                          </Link>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                            {dashboard.description || "No description"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="brand">
                            <Layers className="size-3" aria-hidden />
                            {widgets.length} widget
                            {widgets.length === 1 ? "" : "s"}
                          </Badge>
                          <Badge>
                            <Plug className="size-3" aria-hidden />
                            {sources.length} source
                            {sources.length === 1 ? "" : "s"}
                          </Badge>
                          <span className="text-[11px] text-ink-subtle">
                            data {formatRelativeTime(lastUpdated)}
                          </span>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                          <Link
                            href={`/dashboards/${dashboard.id}`}
                            className={buttonClasses({
                              size: "sm",
                              variant: "subtle",
                            })}
                          >
                            Open
                          </Link>
                          <Link
                            href={`/dashboards/${dashboard.id}/edit`}
                            className={buttonClasses({ size: "sm" })}
                          >
                            Edit
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Refresh sources for ${dashboard.name}`}
                            disabled={connectionIds.length === 0 || refreshing}
                            onClick={() => {
                              for (const connectionId of connectionIds) {
                                void refresh(connectionId);
                              }
                            }}
                          >
                            <RefreshCw
                              className={
                                refreshing ? "size-3.5 animate-spin" : "size-3.5"
                              }
                              aria-hidden
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Duplicate ${dashboard.name}`}
                            onClick={() => duplicateDashboard(dashboard.id)}
                          >
                            <Copy className="size-3.5" aria-hidden />
                          </Button>
                          {confirmingId === dashboard.id ? (
                            <span className="ml-auto flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  deleteDashboard(dashboard.id);
                                  setConfirmingId(null);
                                }}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmingId(null)}
                              >
                                Cancel
                              </Button>
                            </span>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Delete ${dashboard.name}`}
                              className="ml-auto hover:text-danger"
                              onClick={() => setConfirmingId(dashboard.id)}
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  </Card>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
