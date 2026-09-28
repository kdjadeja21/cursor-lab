"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { executeConnection } from "../runner.ts";
import { getSnapshot, putCache } from "./store.ts";
import type { ApiConnection, CachedResponse } from "../types.ts";

const TICK_MS = 5_000;
const MAX_BACKOFF_MULTIPLIER = 8;
const MIN_RETRY_MS = 30_000;

interface RefreshContextValue {
  pending: Record<string, boolean>;
  refresh: (connectionId: string) => Promise<void>;
  refreshMany: (connectionIds: string[]) => Promise<void>;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

/**
 * Failed connections back off exponentially so a broken endpoint is not polled
 * at its configured interval forever.
 */
function nextDueAt(connection: ApiConnection, entry: CachedResponse | undefined) {
  if (connection.refreshSeconds === null) return Number.POSITIVE_INFINITY;
  const intervalMs = connection.refreshSeconds * 1000;
  if (!entry?.lastAttemptAt) return 0;
  const lastAttempt = Date.parse(entry.lastAttemptAt);
  if (Number.isNaN(lastAttempt)) return 0;
  const multiplier = Math.min(
    2 ** Math.max(0, entry.failureCount),
    MAX_BACKOFF_MULTIPLIER,
  );
  const delay =
    entry.failureCount > 0
      ? Math.max(intervalMs * multiplier, MIN_RETRY_MS)
      : intervalMs;
  return lastAttempt + delay;
}

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async (connectionId: string) => {
    const connection = getSnapshot().state.connections.find(
      (item) => item.id === connectionId,
    );
    if (!connection) return;

    const previous = getSnapshot().state.cache[connectionId];
    setPending((current) => ({ ...current, [connectionId]: true }));

    // Stamped before the request so the scheduler cannot queue a second run.
    putCache({
      connectionId,
      data: previous?.data ?? null,
      status: previous?.status ?? null,
      durationMs: previous?.durationMs ?? null,
      fetchedAt: previous?.fetchedAt ?? null,
      lastAttemptAt: new Date().toISOString(),
      error: previous?.error ?? null,
      failureCount: previous?.failureCount ?? 0,
    });

    const result = await executeConnection(connection);
    const attemptedAt = new Date().toISOString();

    if (result.ok) {
      putCache({
        connectionId,
        data: result.data,
        status: result.status,
        durationMs: result.durationMs,
        fetchedAt: attemptedAt,
        lastAttemptAt: attemptedAt,
        error: null,
        failureCount: 0,
      });
    } else {
      // The last good payload is kept so widgets show stale data, not nothing.
      putCache({
        connectionId,
        data: previous?.data ?? null,
        status: result.status,
        durationMs: result.durationMs,
        fetchedAt: previous?.fetchedAt ?? null,
        lastAttemptAt: attemptedAt,
        error: result.error ?? "Request failed",
        failureCount: (previous?.failureCount ?? 0) + 1,
      });
    }

    setPending((current) => {
      const next = { ...current };
      delete next[connectionId];
      return next;
    });
  }, []);

  const refreshMany = useCallback(
    async (connectionIds: string[]) => {
      await Promise.all([...new Set(connectionIds)].map((id) => refresh(id)));
    },
    [refresh],
  );

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      const { state } = getSnapshot();
      const now = Date.now();
      for (const connection of state.connections) {
        if (connection.refreshSeconds === null) continue;
        if (now >= nextDueAt(connection, state.cache[connection.id])) {
          void refresh(connection.id);
        }
      }
    };

    const timer = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo<RefreshContextValue>(
    () => ({ pending, refresh, refreshMany }),
    [pending, refresh, refreshMany],
  );

  return (
    <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used inside a RefreshProvider");
  }
  return context;
}
