"use client";

import Link from "next/link";
import { use } from "react";
import { Clock, Layers, Loader2, Pencil, Plug, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WidgetFrame } from "@/components/widgets/widget-frame";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/freshness";
import { useRefresh } from "@/lib/store/refresh";
import { useDashboard, useWorkspace } from "@/lib/store/workspace";

export default function DashboardViewerPage({
  params,
}: PageProps<"/dashboards/[id]">) {
  const { id } = use(params);
  const { ready, dashboard, widgets, connections } = useDashboard(id);
  const { state } = useWorkspace();
  const { pending, refreshMany } = useRefresh();

  if (!dashboard) {
    return ready ? (
      <EmptyState
        title="Dashboard not found"
        description="It may have been deleted, or saved in a different browser."
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
  const lastUpdated =
    connectionIds
      .map((connectionId) => state.cache[connectionId]?.fetchedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/", label: "Dashboards" }}
        title={dashboard.name}
        description={dashboard.description || undefined}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              tone={refreshing ? "brand" : "neutral"}
              dot
              pulse={refreshing}
              className="gap-1.5"
            >
              <Clock className="size-3" aria-hidden />
              <span title={formatAbsoluteTime(lastUpdated)}>
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            </Badge>
            <Badge>
              <Layers className="size-3" aria-hidden />
              {widgets.length} widget{widgets.length === 1 ? "" : "s"}
            </Badge>
            <Badge>
              <Plug className="size-3" aria-hidden />
              {connections.length} source{connections.length === 1 ? "" : "s"}
            </Badge>
          </div>
        }
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
            <Link
              href={`/dashboards/${id}/edit`}
              className={buttonClasses({ variant: "primary" })}
            >
              <Pencil className="size-4" aria-hidden />
              Edit
            </Link>
          </>
        }
      />

      {widgets.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-5" aria-hidden />}
          title="This dashboard is empty"
          description="Add a widget to start showing data from one of your API connections."
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
          {widgets.map((widget) => (
            <WidgetFrame
              key={widget.id}
              widget={widget}
              connection={connections.find(
                (connection) => connection.id === widget.connectionId,
              )}
              entry={state.cache[widget.connectionId]}
              pending={Boolean(pending[widget.connectionId])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
