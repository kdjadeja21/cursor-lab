"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

interface WorkspaceContextValue {
  ready: boolean;
  session: Session | null;
  signIn: (email: string, name: string) => void;
  signOut: () => void;
  state: WorkspaceState;
  createDashboard: (input: { name: string; description: string }) => Dashboard;
  updateDashboard: (
    id: string,
    patch: Partial<Pick<Dashboard, "name" | "description">>,
  ) => void;
  deleteDashboard: (id: string) => void;
  duplicateDashboard: (id: string) => Dashboard | null;
  saveConnection: (connection: ApiConnection) => void;
  deleteConnection: (id: string) => void;
  addWidget: (
    draft: Omit<Widget, "id" | "order" | "createdAt" | "updatedAt">,
  ) => Widget;
  updateWidget: (
    id: string,
    patch: Partial<Omit<Widget, "id" | "dashboardId" | "createdAt">>,
  ) => void;
  deleteWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  moveWidget: (id: string, offset: -1 | 1) => void;
  putCache: (entry: CachedResponse) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<WorkspaceState>(emptyWorkspace);
  const emailRef = useRef<string | null>(null);

  useEffect(() => {
    const restored = readSession();
    setSession(restored);
    if (restored) {
      emailRef.current = restored.email;
      setState(readWorkspace(restored.email));
    }
    setReady(true);
  }, []);

  /** Every mutation funnels through here so persistence cannot be forgotten. */
  const mutate = useCallback(
    (updater: (current: WorkspaceState) => WorkspaceState) => {
      setState((current) => {
        const next = updater(current);
        const email = emailRef.current;
        if (email) writeWorkspace(email, next);
        return next;
      });
    },
    [],
  );

  const signIn = useCallback((email: string, name: string) => {
    const trimmed = email.trim();
    const nextSession: Session = {
      email: trimmed,
      name: name.trim() || trimmed,
      signedInAt: nowIso(),
    };
    writeSession(nextSession);
    emailRef.current = trimmed;
    setSession(nextSession);
    setState(readWorkspace(trimmed));
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    emailRef.current = null;
    setSession(null);
    setState(emptyWorkspace());
  }, []);

  const createDashboard = useCallback<WorkspaceContextValue["createDashboard"]>(
    ({ name, description }) => {
      const timestamp = nowIso();
      const dashboard: Dashboard = {
        id: newId("dash"),
        name: name.trim() || "Untitled dashboard",
        description: description.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      mutate((current) => ({
        ...current,
        dashboards: [dashboard, ...current.dashboards],
      }));
      return dashboard;
    },
    [mutate],
  );

  const updateDashboard = useCallback<WorkspaceContextValue["updateDashboard"]>(
    (id, patch) => {
      mutate((current) => ({
        ...current,
        dashboards: current.dashboards.map((dashboard) =>
          dashboard.id === id
            ? { ...dashboard, ...patch, updatedAt: nowIso() }
            : dashboard,
        ),
      }));
    },
    [mutate],
  );

  const deleteDashboard = useCallback(
    (id: string) => {
      mutate((current) => ({
        ...current,
        dashboards: current.dashboards.filter((dashboard) => dashboard.id !== id),
        widgets: current.widgets.filter((widget) => widget.dashboardId !== id),
      }));
    },
    [mutate],
  );

  const duplicateDashboard = useCallback<
    WorkspaceContextValue["duplicateDashboard"]
  >(
    (id) => {
      const source = state.dashboards.find((dashboard) => dashboard.id === id);
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
    },
    [mutate, state.dashboards],
  );

  const saveConnection = useCallback(
    (connection: ApiConnection) => {
      mutate((current) => {
        const exists = current.connections.some(
          (item) => item.id === connection.id,
        );
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
    },
    [mutate],
  );

  const deleteConnection = useCallback(
    (id: string) => {
      mutate((current) => {
        const { [id]: _removed, ...cache } = current.cache;
        return {
          ...current,
          connections: current.connections.filter((item) => item.id !== id),
          widgets: current.widgets.filter((widget) => widget.connectionId !== id),
          cache,
        };
      });
    },
    [mutate],
  );

  const addWidget = useCallback<WorkspaceContextValue["addWidget"]>(
    (draft) => {
      const timestamp = nowIso();
      const widget: Widget = {
        ...draft,
        id: newId("wgt"),
        order: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      mutate((current) => {
        const siblings = current.widgets.filter(
          (item) => item.dashboardId === draft.dashboardId,
        );
        const placed = {
          ...widget,
          order: siblings.reduce(
            (max, item) => Math.max(max, item.order + 1),
            0,
          ),
        };
        return { ...current, widgets: [...current.widgets, placed] };
      });
      return widget;
    },
    [mutate],
  );

  const updateWidget = useCallback<WorkspaceContextValue["updateWidget"]>(
    (id, patch) => {
      mutate((current) => ({
        ...current,
        widgets: current.widgets.map((widget) =>
          widget.id === id
            ? { ...widget, ...patch, updatedAt: nowIso() }
            : widget,
        ),
      }));
    },
    [mutate],
  );

  const deleteWidget = useCallback(
    (id: string) => {
      mutate((current) => ({
        ...current,
        widgets: current.widgets.filter((widget) => widget.id !== id),
      }));
    },
    [mutate],
  );

  const duplicateWidget = useCallback(
    (id: string) => {
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
        const widgets = current.widgets.map((widget) =>
          widget.dashboardId === source.dashboardId &&
          widget.order > source.order
            ? { ...widget, order: widget.order + 1 }
            : widget,
        );
        return { ...current, widgets: [...widgets, copy] };
      });
    },
    [mutate],
  );

  const moveWidget = useCallback(
    (id: string, offset: -1 | 1) => {
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
            if (widget.id === target.id) {
              return { ...widget, order: swapWith.order };
            }
            if (widget.id === swapWith.id) {
              return { ...widget, order: target.order };
            }
            return widget;
          }),
        };
      });
    },
    [mutate],
  );

  const putCache = useCallback(
    (entry: CachedResponse) => {
      mutate((current) => ({
        ...current,
        cache: { ...current.cache, [entry.connectionId]: entry },
      }));
    },
    [mutate],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      session,
      signIn,
      signOut,
      state,
      createDashboard,
      updateDashboard,
      deleteDashboard,
      duplicateDashboard,
      saveConnection,
      deleteConnection,
      addWidget,
      updateWidget,
      deleteWidget,
      duplicateWidget,
      moveWidget,
      putCache,
    }),
    [
      ready,
      session,
      signIn,
      signOut,
      state,
      createDashboard,
      updateDashboard,
      deleteDashboard,
      duplicateDashboard,
      saveConnection,
      deleteConnection,
      addWidget,
      updateWidget,
      deleteWidget,
      duplicateWidget,
      moveWidget,
      putCache,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside a WorkspaceProvider");
  }
  return context;
}

export function useDashboard(dashboardId: string) {
  const { state } = useWorkspace();
  return useMemo(() => {
    const dashboard =
      state.dashboards.find((item) => item.id === dashboardId) ?? null;
    const widgets = state.widgets
      .filter((widget) => widget.dashboardId === dashboardId)
      .sort((a, b) => a.order - b.order);
    const connectionIds = new Set(widgets.map((widget) => widget.connectionId));
    const connections = state.connections.filter((connection) =>
      connectionIds.has(connection.id),
    );
    return { dashboard, widgets, connections };
  }, [dashboardId, state]);
}
