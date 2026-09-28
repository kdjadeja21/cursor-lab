import type { Session, WorkspaceState } from "@/lib/types";

const SESSION_KEY = "fetchboard:session";
const WORKSPACE_VERSION = 1;

/**
 * Placeholder local sign-in: there is no server, so the "session" is nothing
 * more than a locally stored identity used to namespace saved work.
 */
export function workspaceKey(email: string) {
  return `fetchboard:v${WORKSPACE_VERSION}:${email.trim().toLowerCase()}`;
}

export function emptyWorkspace(): WorkspaceState {
  return {
    version: WORKSPACE_VERSION,
    dashboards: [],
    connections: [],
    widgets: [],
    cache: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.email !== "string") return null;
    return {
      email: parsed.email,
      name: typeof parsed.name === "string" ? parsed.name : parsed.email,
      signedInAt:
        typeof parsed.signedInAt === "string"
          ? parsed.signedInAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

/**
 * Reads a workspace, falling back to an empty one whenever the stored payload
 * is missing, unparseable, or written by an incompatible version.
 */
export function readWorkspace(email: string): WorkspaceState {
  if (typeof window === "undefined") return emptyWorkspace();
  try {
    const raw = window.localStorage.getItem(workspaceKey(email));
    if (!raw) return emptyWorkspace();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== WORKSPACE_VERSION) {
      return emptyWorkspace();
    }
    const base = emptyWorkspace();
    return {
      version: WORKSPACE_VERSION,
      dashboards: Array.isArray(parsed.dashboards)
        ? (parsed.dashboards as WorkspaceState["dashboards"])
        : base.dashboards,
      connections: Array.isArray(parsed.connections)
        ? (parsed.connections as WorkspaceState["connections"])
        : base.connections,
      widgets: Array.isArray(parsed.widgets)
        ? (parsed.widgets as WorkspaceState["widgets"])
        : base.widgets,
      cache: isRecord(parsed.cache)
        ? (parsed.cache as WorkspaceState["cache"])
        : base.cache,
    };
  } catch {
    return emptyWorkspace();
  }
}

export function writeWorkspace(email: string, state: WorkspaceState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(workspaceKey(email), JSON.stringify(state));
  } catch {
    // Quota exceeded: drop cached payloads, which are always re-fetchable.
    try {
      window.localStorage.setItem(
        workspaceKey(email),
        JSON.stringify({ ...state, cache: {} }),
      );
    } catch {
      // Nothing more we can do without a backend; the UI keeps working in memory.
    }
  }
}
