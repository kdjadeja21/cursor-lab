import { newId } from "@/lib/id";
import type { ApiConnection, AuthConfig, KeyValue } from "@/lib/types";

export const DEFAULT_TIMEOUT_MS = 15_000;
export const MIN_TIMEOUT_MS = 1_000;
export const MAX_TIMEOUT_MS = 60_000;

export const REFRESH_PRESETS: { label: string; seconds: number | null }[] = [
  { label: "Manual only", seconds: null },
  { label: "Every minute", seconds: 60 },
  { label: "Every 5 minutes", seconds: 300 },
  { label: "Every 15 minutes", seconds: 900 },
  { label: "Every 30 minutes", seconds: 1800 },
  { label: "Hourly", seconds: 3600 },
  { label: "Daily", seconds: 86_400 },
];

export function newKeyValue(): KeyValue {
  return { id: newId("kv"), key: "", value: "", enabled: true };
}

export function newConnectionDraft(): ApiConnection {
  const now = new Date().toISOString();
  return {
    id: newId("con"),
    name: "",
    apiType: "rest",
    url: "",
    method: "GET",
    auth: { kind: "none" },
    headers: [newKeyValue()],
    queryParams: [newKeyValue()],
    body: "",
    graphqlQuery: "",
    graphqlVariables: "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    refreshSeconds: 300,
    createdAt: now,
    updatedAt: now,
  };
}

export function describeRefresh(seconds: number | null): string {
  if (seconds === null) return "Manual only";
  const preset = REFRESH_PRESETS.find((option) => option.seconds === seconds);
  if (preset) return preset.label;
  if (seconds % 3600 === 0) return `Every ${seconds / 3600} hours`;
  if (seconds % 60 === 0) return `Every ${seconds / 60} minutes`;
  return `Every ${seconds} seconds`;
}

export function describeAuth(auth: AuthConfig): string {
  switch (auth.kind) {
    case "none":
      return "No auth";
    case "apiKey":
      return `API key header${auth.headerName ? ` (${auth.headerName})` : ""}`;
    case "bearer":
      return "Bearer token";
    default: {
      const exhaustive: never = auth;
      return exhaustive;
    }
  }
}

/** Strips empty rows so blank key/value pairs never reach the request. */
export function activePairs(pairs: KeyValue[]): KeyValue[] {
  return pairs.filter((pair) => pair.enabled && pair.key.trim().length > 0);
}
