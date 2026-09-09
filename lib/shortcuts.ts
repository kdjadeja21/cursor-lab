"use client";

import { useEffect } from "react";
import { useAgentActions, useAgentState } from "@/lib/store";

export type Shortcut = {
  id: string;
  label: string;
  keys: string[];
};

export const SHORTCUTS = {
  mode: { id: "mode", label: "Cycle mode", keys: ["⇧", "Tab"] },
  model: { id: "model", label: "Change model", keys: ["⌘", "/"] },
  effortUp: { id: "effortUp", label: "More effort", keys: ["⌥", "↑"] },
  effortDown: { id: "effortDown", label: "Less effort", keys: ["⌥", "↓"] },
  fast: { id: "fast", label: "Toggle Fast", keys: ["⌘", "⇧", "."] },
  send: { id: "send", label: "Send", keys: ["↵"] },
  stop: { id: "stop", label: "Stop", keys: ["Esc"] },
  newChat: { id: "newChat", label: "New chat", keys: ["⌘", "⇧", "N"] },
} satisfies Record<string, Shortcut>;

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useGlobalShortcuts() {
  const actions = useAgentActions();
  const { runningId, panel } = useAgentState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "Tab" && e.shiftKey && !meta && !e.altKey) {
        e.preventDefault();
        actions.cycleMode(1);
        return;
      }
      if (meta && !e.shiftKey && e.key === "/") {
        e.preventDefault();
        actions.setPanel(panel === "model" ? null : "model");
        return;
      }
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        actions.stepEffort(e.key === "ArrowUp" ? 1 : -1);
        return;
      }
      if (meta && e.shiftKey && (e.key === "." || e.key === ">")) {
        e.preventDefault();
        actions.toggleFast();
        return;
      }
      if (meta && e.shiftKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        actions.newChat();
        return;
      }
      if (e.key === "Escape") {
        if (panel) {
          actions.setPanel(null);
          return;
        }
        if (runningId && !isEditable(e.target)) {
          actions.stop();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, panel, runningId]);
}
