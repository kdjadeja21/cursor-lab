import { activePairs } from "./connection.ts";
import type { ApiConnection } from "./types.ts";

export interface ExecuteRequest {
  apiType: ApiConnection["apiType"];
  url: string;
  method: ApiConnection["method"];
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string | null;
  graphqlQuery: string | null;
  graphqlVariables: string | null;
  timeoutMs: number;
}

export interface ExecuteResult {
  ok: boolean;
  status: number | null;
  statusText: string | null;
  durationMs: number;
  sizeBytes: number | null;
  contentType: string | null;
  data: unknown;
  error: string | null;
}

/**
 * Turns a saved connection into the wire format the proxy understands. Auth
 * material is folded into headers here so it never appears in a URL.
 */
export function toExecuteRequest(connection: ApiConnection): ExecuteRequest {
  const headers: Record<string, string> = {};
  for (const pair of activePairs(connection.headers)) {
    headers[pair.key.trim()] = pair.value;
  }

  const auth = connection.auth;
  switch (auth.kind) {
    case "none":
      break;
    case "apiKey":
      if (auth.headerName.trim()) headers[auth.headerName.trim()] = auth.value;
      break;
    case "bearer":
      if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
      break;
    default: {
      const exhaustive: never = auth;
      throw new Error(`Unsupported auth kind: ${String(exhaustive)}`);
    }
  }

  const queryParams: Record<string, string> = {};
  for (const pair of activePairs(connection.queryParams)) {
    queryParams[pair.key.trim()] = pair.value;
  }

  const isGraphql = connection.apiType === "graphql";
  const sendsBody =
    !isGraphql && ["POST", "PUT", "PATCH", "DELETE"].includes(connection.method);

  return {
    apiType: connection.apiType,
    url: connection.url.trim(),
    method: isGraphql ? "POST" : connection.method,
    headers,
    queryParams,
    body: sendsBody && connection.body.trim() ? connection.body : null,
    graphqlQuery: isGraphql ? connection.graphqlQuery : null,
    graphqlVariables:
      isGraphql && connection.graphqlVariables.trim()
        ? connection.graphqlVariables
        : null,
    timeoutMs: connection.timeoutMs,
  };
}

const inFlight = new Map<string, Promise<ExecuteResult>>();

async function postExecute(request: ExecuteRequest): Promise<ExecuteResult> {
  const startedAt = Date.now();
  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    const payload: unknown = await response.json();
    if (!response.ok || typeof payload !== "object" || payload === null) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : `Proxy request failed with status ${response.status}`;
      return {
        ok: false,
        status: null,
        statusText: null,
        durationMs: Date.now() - startedAt,
        sizeBytes: null,
        contentType: null,
        data: null,
        error: message,
      };
    }
    return payload as ExecuteResult;
  } catch (error) {
    return {
      ok: false,
      status: null,
      statusText: null,
      durationMs: Date.now() - startedAt,
      sizeBytes: null,
      contentType: null,
      data: null,
      error: error instanceof Error ? error.message : "Network request failed",
    };
  }
}

/**
 * Runs a connection through the proxy. Concurrent callers for the same
 * connection share a single in-flight request so widgets that read from one
 * endpoint never trigger duplicate fetches.
 */
export function executeConnection(
  connection: ApiConnection,
): Promise<ExecuteResult> {
  const existing = inFlight.get(connection.id);
  if (existing) return existing;

  const pending = postExecute(toExecuteRequest(connection)).finally(() => {
    inFlight.delete(connection.id);
  });
  inFlight.set(connection.id, pending);
  return pending;
}

/** Used by the connection wizard, which tests drafts that are not saved yet. */
export function testConnection(
  connection: ApiConnection,
): Promise<ExecuteResult> {
  return postExecute(toExecuteRequest(connection));
}

export function isRunning(connectionId: string) {
  return inFlight.has(connectionId);
}
