import { newId } from "../id.ts";
import {
  clearSession,
  emptyWorkspace,
  readSession,
  readWorkspace,
  writeSession,
  writeWorkspace,
} from "./storage.ts";
import type {
  ApiConnection,
  CachedResponse,
  Dashboard,
  Session,
  Widget,
  WorkspaceState,
} from "../types.ts";

export interface WorkspaceSnapshot {
  /** False until localStorage has been read, which only happens on the client. */
  ready: boolean;
  session: Session | null;
  state: WorkspaceState;
}

const SERVER_SNAPSHOT: WorkspaceSnapshot = {
  ready: false,
  session: null,
  state: emptyWorkspace(),
};

const listeners = new Set<() => void>();
let snapshot: WorkspaceSnapshot = SERVER_SNAPSHOT;
let hydrated = false;

function publish(next: WorkspaceSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const session = readSession();
  publish({
    ready: true,
    session,
    state: session ? readWorkspace(session.email) : emptyWorkspace(),
  });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  return snapshot;
}

export function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function nowIso() {
  return new Date().toISOString();
}

/** Single write path: every mutation persists to localStorage and notifies. */
function mutate(updater: (current: WorkspaceState) => WorkspaceState) {
  const next = updater(snapshot.state);
  if (snapshot.session) writeWorkspace(snapshot.session.email, next);
  publish({ ...snapshot, state: next });
}

export function signIn(email: string, name: string) {
  const trimmed = email.trim();
  const session: Session = {
    email: trimmed,
    name: name.trim() || trimmed,
    signedInAt: nowIso(),
  };
  writeSession(session);
  publish({ ready: true, session, state: readWorkspace(trimmed) });
}

export function signOut() {
  clearSession();
  publish({ ready: true, session: null, state: emptyWorkspace() });
}

export function createDashboard(input: {
  name: string;
  description: string;
}): Dashboard {
  const timestamp = nowIso();
  const dashboard: Dashboard = {
    id: newId("dash"),
    name: input.name.trim() || "Untitled dashboard",
    description: input.description.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mutate((current) => ({
    ...current,
    dashboards: [dashboard, ...current.dashboards],
  }));
  return dashboard;
}

export function updateDashboard(
  id: string,
  patch: Partial<Pick<Dashboard, "name" | "description">>,
) {
  mutate((current) => ({
    ...current,
    dashboards: current.dashboards.map((dashboard) =>
      dashboard.id === id
        ? { ...dashboard, ...patch, updatedAt: nowIso() }
        : dashboard,
    ),
  }));
}

export function deleteDashboard(id: string) {
  mutate((current) => ({
    ...current,
    dashboards: current.dashboards.filter((dashboard) => dashboard.id !== id),
    widgets: current.widgets.filter((widget) => widget.dashboardId !== id),
  }));
}

export function duplicateDashboard(id: string): Dashboard | null {
  const source = snapshot.state.dashboards.find(
    (dashboard) => dashboard.id === id,
  );
  if (!source) return null;
  const timestamp = nowIso();
  const copy: Dashboard = {
    ...source,
    id: newId("dash"),
    name: `${source.name} (copy)`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mutate((current) => {
    const copiedWidgets = current.widgets
      .filter((widget) => widget.dashboardId === id)
      .map((widget) => ({
        ...widget,
        id: newId("wgt"),
        dashboardId: copy.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
    return {
      ...current,
      dashboards: [copy, ...current.dashboards],
      widgets: [...current.widgets, ...copiedWidgets],
    };
  });
  return copy;
}

export function saveConnection(connection: ApiConnection) {
  mutate((current) => {
    const exists = current.connections.some((item) => item.id === connection.id);
    const stamped = { ...connection, updatedAt: nowIso() };
    return {
      ...current,
      connections: exists
        ? current.connections.map((item) =>
            item.id === connection.id ? stamped : item,
          )
        : [...current.connections, stamped],
    };
  });
}

export function deleteConnection(id: string) {
  mutate((current) => {
    const cache = { ...current.cache };
    delete cache[id];
    return {
      ...current,
      connections: current.connections.filter((item) => item.id !== id),
      widgets: current.widgets.filter((widget) => widget.connectionId !== id),
      cache,
    };
  });
}

export function addWidget(
  draft: Omit<Widget, "id" | "order" | "createdAt" | "updatedAt">,
): Widget {
  const timestamp = nowIso();
  const siblings = snapshot.state.widgets.filter(
    (widget) => widget.dashboardId === draft.dashboardId,
  );
  const widget: Widget = {
    ...draft,
    id: newId("wgt"),
    order: siblings.reduce((max, item) => Math.max(max, item.order + 1), 0),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mutate((current) => ({ ...current, widgets: [...current.widgets, widget] }));
  return widget;
}

export function updateWidget(
  id: string,
  patch: Partial<Omit<Widget, "id" | "dashboardId" | "createdAt">>,
) {
  mutate((current) => ({
    ...current,
    widgets: current.widgets.map((widget) =>
      widget.id === id ? { ...widget, ...patch, updatedAt: nowIso() } : widget,
    ),
  }));
}

export function deleteWidget(id: string) {
  mutate((current) => ({
    ...current,
    widgets: current.widgets.filter((widget) => widget.id !== id),
  }));
}

export function duplicateWidget(id: string) {
  mutate((current) => {
    const source = current.widgets.find((widget) => widget.id === id);
    if (!source) return current;
    const timestamp = nowIso();
    const copy: Widget = {
      ...source,
      id: newId("wgt"),
      title: `${source.title} (copy)`,
      order: source.order + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const shifted = current.widgets.map((widget) =>
      widget.dashboardId === source.dashboardId && widget.order > source.order
        ? { ...widget, order: widget.order + 1 }
        : widget,
    );
    return { ...current, widgets: [...shifted, copy] };
  });
}

export function moveWidget(id: string, offset: -1 | 1) {
  mutate((current) => {
    const target = current.widgets.find((widget) => widget.id === id);
    if (!target) return current;
    const siblings = current.widgets
      .filter((widget) => widget.dashboardId === target.dashboardId)
      .sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((widget) => widget.id === id);
    const swapWith = siblings[index + offset];
    if (!swapWith) return current;
    return {
      ...current,
      widgets: current.widgets.map((widget) => {
        if (widget.id === target.id) return { ...widget, order: swapWith.order };
        if (widget.id === swapWith.id) return { ...widget, order: target.order };
        return widget;
      }),
    };
  });
}

export function putCache(entry: CachedResponse) {
  mutate((current) => ({
    ...current,
    cache: { ...current.cache, [entry.connectionId]: entry },
  }));
}
