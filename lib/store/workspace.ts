"use client";

import { useMemo, useSyncExternalStore } from "react";
import * as store from "./store.ts";

/**
 * Reads the localStorage-backed workspace through `useSyncExternalStore`, which
 * keeps server rendering and client hydration consistent without an effect.
 * Mutations are plain module functions, so they are stable across renders.
 */
export function useWorkspace() {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  return {
    ready: snapshot.ready,
    session: snapshot.session,
    state: snapshot.state,
    signIn: store.signIn,
    signOut: store.signOut,
    createDashboard: store.createDashboard,
    updateDashboard: store.updateDashboard,
    deleteDashboard: store.deleteDashboard,
    duplicateDashboard: store.duplicateDashboard,
    saveConnection: store.saveConnection,
    deleteConnection: store.deleteConnection,
    addWidget: store.addWidget,
    updateWidget: store.updateWidget,
    deleteWidget: store.deleteWidget,
    duplicateWidget: store.duplicateWidget,
    moveWidget: store.moveWidget,
    putCache: store.putCache,
  };
}

export function useDashboard(dashboardId: string) {
  const { ready, state } = useWorkspace();
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
    return { ready, dashboard, widgets, connections };
  }, [dashboardId, ready, state]);
}
