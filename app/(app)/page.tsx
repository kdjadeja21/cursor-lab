"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Copy,
  LayoutDashboard,
  Plug,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
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
    () => new Map(state.connections.map((connection) => [connection.id, connection])),
    [state.connections],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboards</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Connect APIs. Build your dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {state.connections.length > 0 ? (
        <Card className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
          <span className="text-xs font-medium text-ink-muted">
            Connection status
          </span>
          {state.connections.map((connection) => {
            const entry = state.cache[connection.id];
            const status = freshnessOf(connection, entry);
            return (
              <Link
                key={connection.id}
                href={`/connections/${connection.id}`}
                className="flex items-center gap-1.5 text-xs hover:underline"
              >
                <Badge tone={STATUS_TONES[status]}>
                  {status === "empty" ? "no data" : status}
                </Badge>
                <span className="text-ink">{connection.name}</span>
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
          icon={<LayoutDashboard className="size-6" aria-hidden />}
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
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <TextField
              label="Search dashboards"
              placeholder="Search by name or description"
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
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboards.map((dashboard) => {
                const widgets = state.widgets.filter(
                  (widget) => widget.dashboardId === dashboard.id,
                );
                const connectionIds = [
                  ...new Set(widgets.map((widget) => widget.connectionId)),
                ];
                const sources = connectionIds
                  .map((id) => connectionsById.get(id))
                  .filter((connection) => connection !== undefined);
                const refreshing = connectionIds.some((id) => pending[id]);
                const lastUpdated = sources
                  .map((connection) => state.cache[connection.id]?.fetchedAt)
                  .filter((value): value is string => Boolean(value))
                  .sort()
                  .at(-1) ?? null;

                return (
                  <Card key={dashboard.id} className="p-4">
                    <li className="flex h-full flex-col gap-3">
                      <div>
                        <Link
                          href={`/dashboards/${dashboard.id}`}
                          className="font-medium hover:underline"
                        >
                          {dashboard.name}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                          {dashboard.description || "No description"}
                        </p>
                      </div>

                      <p className="text-[11px] text-ink-subtle">
                        {widgets.length} widget{widgets.length === 1 ? "" : "s"} ·{" "}
                        {sources.length} source{sources.length === 1 ? "" : "s"} ·
                        data {formatRelativeTime(lastUpdated)}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboards/${dashboard.id}`}
                          className={buttonClasses({ size: "sm" })}
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
                          size="sm"
                          variant="ghost"
                          disabled={connectionIds.length === 0 || refreshing}
                          onClick={() => {
                            for (const id of connectionIds) void refresh(id);
                          }}
                        >
                          <RefreshCw className="size-3.5" aria-hidden />
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateDashboard(dashboard.id)}
                        >
                          <Copy className="size-3.5" aria-hidden />
                          Duplicate
                        </Button>
                        {confirmingId === dashboard.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                deleteDashboard(dashboard.id);
                                setConfirmingId(null);
                              }}
                            >
                              Confirm delete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingId(dashboard.id)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </Button>
                        )}
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
