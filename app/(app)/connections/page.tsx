"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Clock,
  KeyRound,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, MethodBadge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { describeAuth, describeRefresh } from "@/lib/connection";
import { formatRelativeTime, freshnessOf } from "@/lib/freshness";
import { useRefresh } from "@/lib/store/refresh";
import { useWorkspace } from "@/lib/store/workspace";

const STATUS_TONES: Record<string, BadgeTone> = {
  empty: "neutral",
  fresh: "positive",
  stale: "warning",
  error: "danger",
};

export default function ConnectionsPage() {
  const { state, deleteConnection } = useWorkspace();
  const { pending, refresh } = useRefresh();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const widgetCountFor = (connectionId: string) =>
    state.widgets.filter((widget) => widget.connectionId === connectionId).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="API connections"
        description="Every connection is fetched server-side on its own schedule and shared by all widgets that use it."
        actions={
          <Link
            href="/connections/new"
            className={buttonClasses({ variant: "primary" })}
          >
            <Plus className="size-4" aria-hidden />
            Add connection
          </Link>
        }
      />

      {state.connections.length === 0 ? (
        <EmptyState
          icon={<Plug className="size-5" aria-hidden />}
          title="No connections yet"
          description="Add a REST or GraphQL endpoint, test it, and Fetchboard will suggest views for whatever it returns."
          action={
            <Link
              href="/connections/new"
              className={buttonClasses({ variant: "primary" })}
            >
              <Plus className="size-4" aria-hidden />
              Add connection
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {state.connections.map((connection) => {
            const entry = state.cache[connection.id];
            const status = freshnessOf(connection, entry);
            const isPending = Boolean(pending[connection.id]);
            const widgetCount = widgetCountFor(connection.id);
            return (
              <Card key={connection.id} interactive className="animate-in-fade">
                <li className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <MethodBadge
                          method={
                            connection.apiType === "graphql"
                              ? "POST"
                              : connection.method
                          }
                        />
                        <Link
                          href={`/connections/${connection.id}`}
                          className="truncate text-sm font-semibold hover:underline"
                        >
                          {connection.name}
                        </Link>
                        <Badge tone="brand">
                          {connection.apiType === "graphql" ? "GraphQL" : "REST"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-ink-subtle">
                        {connection.url}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONES[status]} dot pulse={isPending}>
                      {status === "empty" ? "never fetched" : status}
                    </Badge>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-line bg-surface-muted/50 px-3 py-2.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-ink-subtle" aria-hidden />
                      <dt className="sr-only">Last success</dt>
                      <dd className="text-ink-muted">
                        {formatRelativeTime(entry?.fetchedAt ?? null)}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="size-3 text-ink-subtle" aria-hidden />
                      <dt className="sr-only">Schedule</dt>
                      <dd className="text-ink-muted">
                        {describeRefresh(connection.refreshSeconds)}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="size-3 text-ink-subtle" aria-hidden />
                      <dt className="sr-only">Auth</dt>
                      <dd className="text-ink-muted">
                        {describeAuth(connection.auth)}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="size-3 text-ink-subtle" aria-hidden />
                      <dt className="sr-only">Widgets</dt>
                      <dd className="text-ink-muted">
                        {widgetCount} widget{widgetCount === 1 ? "" : "s"}
                      </dd>
                    </div>
                  </dl>

                  {entry?.error ? (
                    <p className="rounded-lg border border-danger/25 bg-danger-soft px-2.5 py-1.5 text-[11px] leading-relaxed text-danger">
                      {entry.error}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => void refresh(connection.id)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw className="size-3.5" aria-hidden />
                      )}
                      Refresh
                    </Button>
                    <Link
                      href={`/connections/${connection.id}`}
                      className={buttonClasses({ size: "sm" })}
                    >
                      Edit and explore
                    </Link>
                    {confirmingId === connection.id ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            deleteConnection(connection.id);
                            setConfirmingId(null);
                          }}
                        >
                          Delete with {widgetCount} widget
                          {widgetCount === 1 ? "" : "s"}
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
                        aria-label={`Delete ${connection.name}`}
                        className="ml-auto hover:text-danger"
                        onClick={() => setConfirmingId(connection.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
