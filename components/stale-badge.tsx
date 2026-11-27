"use client";

import { useSyncExternalStore } from "react";

const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): boolean {
  return false;
}

let cachedUpdated = "";
let cachedStale = false;

function isStale(updated: string): boolean {
  if (cachedUpdated === updated) {
    return cachedStale;
  }
  const updatedMs = Date.parse(updated);
  cachedUpdated = updated;
  cachedStale =
    !Number.isNaN(updatedMs) && Date.now() - updatedMs > STALE_AFTER_MS;
  return cachedStale;
}

type StaleBadgeProps = {
  updated: string;
};

export function StaleBadge({ updated }: StaleBadgeProps) {
  const stale = useSyncExternalStore(
    subscribe,
    () => isStale(updated),
    getServerSnapshot,
  );

  if (!stale) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
      stale
    </span>
  );
}
