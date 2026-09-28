import type { ApiConnection, CachedResponse } from "./types.ts";

export const MAX_BACKOFF_MULTIPLIER = 8;
export const MIN_RETRY_MS = 30_000;

/**
 * When the next scheduled run for a connection becomes due, in epoch
 * milliseconds. Failures back off exponentially so a broken endpoint is not
 * polled at its configured interval forever, and manual connections are never
 * due. `Infinity` means "only on request".
 */
export function nextDueAt(
  connection: Pick<ApiConnection, "refreshSeconds">,
  entry: Pick<CachedResponse, "lastAttemptAt" | "failureCount"> | undefined,
): number {
  if (connection.refreshSeconds === null) return Number.POSITIVE_INFINITY;

  const intervalMs = connection.refreshSeconds * 1000;
  if (!entry?.lastAttemptAt) return 0;

  const lastAttempt = Date.parse(entry.lastAttemptAt);
  if (Number.isNaN(lastAttempt)) return 0;

  if (entry.failureCount <= 0) return lastAttempt + intervalMs;

  const multiplier = Math.min(2 ** entry.failureCount, MAX_BACKOFF_MULTIPLIER);
  return lastAttempt + Math.max(intervalMs * multiplier, MIN_RETRY_MS);
}

export function isDue(
  connection: Pick<ApiConnection, "refreshSeconds">,
  entry: Pick<CachedResponse, "lastAttemptAt" | "failureCount"> | undefined,
  now = Date.now(),
): boolean {
  return now >= nextDueAt(connection, entry);
}
