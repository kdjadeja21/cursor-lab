"use client";

import { useEffect } from "react";
import type { AgentApi } from "@/lib/agent-store";

export type ShortcutSpec = {
  id: string;
  keys: string[];
  label: string;
  group: "Controls" | "Conversation" | "Window";
  /** Called out in the cheat sheet as new in this redesign. */
  isNew?: boolean;
};

export const SHORTCUTS: ShortcutSpec[] = [
  { id: "mode", keys: ["⇧", "Tab"], label: "Cycle mode", group: "Controls" },
  { id: "model", keys: ["⌘", "/"], label: "Open model picker", group: "Controls" },
  { id: "effort", keys: ["⌘", "⇧", "/"], label: "Cycle reasoning effort", group: "Controls" },
  {
    id: "effort-nudge",
    keys: ["⌘", "⇧", "↑ ↓"],
    label: "Nudge effort up or down",
    group: "Controls",
    isNew: true,
  },
  {
    id: "fast",
    keys: ["⌘", "⇧", "."],
    label: "Toggle Fast",
    group: "Controls",
    isNew: true,
  },
  {
    id: "swap",
    keys: ["⌘", "⇧", "E"],
    label: "Flip between your two starred efforts",
    group: "Controls",
    isNew: true,
  },
  { id: "send", keys: ["↵"], label: "Send, or queue while streaming", group: "Conversation" },
  { id: "newline", keys: ["⇧", "↵"], label: "New line", group: "Conversation" },
  { id: "stop", keys: ["Esc"], label: "Stop the run", group: "Conversation" },
  { id: "new-chat", keys: ["⌘", "⇧", "N"], label: "New chat", group: "Conversation" },
  { id: "focus", keys: ["⌘", "I"], label: "Focus the composer", group: "Window" },
  { id: "help", keys: ["?"], label: "Shortcut sheet", group: "Window" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

type ShortcutHandlers = {
  focusComposer: () => void;
  openModelPicker: () => void;
  toggleHelp: () => void;
  closeOverlays: () => boolean;
};

export function useAgentShortcuts(api: AgentApi, handlers: ShortcutHandlers) {
  const {
    cycleMode,
    cycleEffortLevel,
    nudgeEffort,
    toggleFast,
    swapStarredEffort,
    stop,
    newChat,
    state,
  } = api;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        if (handlers.closeOverlays()) {
          event.preventDefault();
          return;
        }
        if (state.status === "streaming") {
          event.preventDefault();
          stop();
        }
        return;
      }

      if (event.key === "Tab" && event.shiftKey && !mod) {
        event.preventDefault();
        cycleMode(1);
        return;
      }

      if (mod && event.code === "Slash") {
        event.preventDefault();
        if (event.shiftKey) {
          cycleEffortLevel();
        } else {
          handlers.openModelPicker();
        }
        return;
      }

      if (mod && event.shiftKey && event.code === "Period") {
        event.preventDefault();
        toggleFast();
        return;
      }

      if (mod && event.shiftKey && event.code === "KeyE") {
        event.preventDefault();
        swapStarredEffort();
        return;
      }

      if (mod && event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        nudgeEffort(event.key === "ArrowUp" ? 1 : -1);
        return;
      }

      if (mod && event.shiftKey && event.code === "KeyN") {
        event.preventDefault();
        newChat();
        return;
      }

      if (mod && event.code === "KeyI") {
        event.preventDefault();
        handlers.focusComposer();
        return;
      }

      if (event.key === "?" && !mod && !isTypingTarget(event.target)) {
        event.preventDefault();
        handlers.toggleHelp();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    cycleMode,
    cycleEffortLevel,
    nudgeEffort,
    toggleFast,
    swapStarredEffort,
    stop,
    newChat,
    state.status,
    handlers,
  ]);
}
