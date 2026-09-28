import type { ApiConnection, CachedResponse } from "@/lib/types";

export type FreshnessStatus = "empty" | "fresh" | "stale" | "error";

/**
 * "Stale" means the data is older than two refresh intervals, which is the
 * signal users need so cached numbers are never mistaken for live ones.
 */
export function freshnessOf(
  connection: ApiConnection,
  entry: CachedResponse | undefined,
): FreshnessStatus {
  if (!entry || entry.fetchedAt === null) {
    return entry?.error ? "error" : "empty";
  }
  if (entry.error) return "error";
  if (connection.refreshSeconds === null) return "fresh";
  const age = Date.now() - Date.parse(entry.fetchedAt);
  return age > connection.refreshSeconds * 2000 ? "stale" : "fresh";
}

export function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return "never";
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return "unknown";
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatAbsoluteTime(isoDate: string | null): string {
  if (!isoDate) return "never";
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return "unknown";
  return new Date(timestamp).toLocaleString();
}
