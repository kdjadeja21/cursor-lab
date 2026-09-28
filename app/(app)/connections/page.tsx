"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Plug, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">API connections</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every connection is fetched server-side on its own schedule and shared
            by all widgets that use it.
          </p>
        </div>
        <Link
          href="/connections/new"
          className={buttonClasses({ variant: "primary" })}
        >
          <Plus className="size-4" aria-hidden />
          Add connection
        </Link>
      </div>

      {state.connections.length === 0 ? (
        <EmptyState
          icon={<Plug className="size-6" aria-hidden />}
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
        <ul className="grid gap-3 md:grid-cols-2">
          {state.connections.map((connection) => {
            const entry = state.cache[connection.id];
            const status = freshnessOf(connection, entry);
            const isPending = Boolean(pending[connection.id]);
            return (
              <Card key={connection.id} className="p-4">
                <li className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/connections/${connection.id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {connection.name}
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-ink-subtle">
                        {connection.apiType === "graphql"
                          ? "POST"
                          : connection.method}{" "}
                        {connection.url}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONES[status]}>
                      {status === "empty" ? "never fetched" : status}
                    </Badge>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-[11px] text-ink-muted">
                    <div>
                      <dt className="text-ink-subtle">Last success</dt>
                      <dd>{formatRelativeTime(entry?.fetchedAt ?? null)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-subtle">Schedule</dt>
                      <dd>{describeRefresh(connection.refreshSeconds)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-subtle">Auth</dt>
                      <dd>{describeAuth(connection.auth)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-subtle">Widgets</dt>
                      <dd>{widgetCountFor(connection.id)}</dd>
                    </div>
                  </dl>

                  {entry?.error ? (
                    <p className="rounded-md border border-danger/25 bg-danger-soft px-2 py-1.5 text-[11px] text-danger">
                      {entry.error}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
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
                      Edit
                    </Link>
                    {confirmingId === connection.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            deleteConnection(connection.id);
                            setConfirmingId(null);
                          }}
                        >
                          Delete connection and {widgetCountFor(connection.id)}{" "}
                          widget(s)
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmingId(connection.id)}
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
    </div>
  );
}
