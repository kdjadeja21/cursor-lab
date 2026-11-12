"use client";

import { ArrowUp, Square } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState } from "@/lib/store";

export function SendButton() {
  const { draft, runningId } = useAgentState();
  const { send, stop } = useAgentActions();
  const running = runningId !== null;
  const canSend = draft.trim().length > 0;

  return (
    <Tooltip
      label={running ? "Stop" : "Send"}
      keys={running ? SHORTCUTS.stop.keys : SHORTCUTS.send.keys}
      align="end"
    >
      <motion.button
        type="button"
        aria-label={running ? "Stop generating" : "Send message"}
        disabled={!running && !canSend}
        onClick={() => (running ? stop() : send())}
        whileTap={{ scale: 0.92 }}
        className={cn(
          "focus-ring relative flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
          running
            ? "bg-bg-4 text-fg-0"
            : canSend
              ? "bg-accent text-bg-0 shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_4px_14px_-4px_rgb(var(--accent)/0.6)]"
              : "bg-bg-3 text-fg-3",
        )}
      >
        {running && (
          <>
            <span className="absolute inset-0 rounded-lg border border-accent/60 [animation:ring-pulse_1.4s_ease-out_infinite]" />
            <span className="absolute inset-0 rounded-lg border border-accent/60 [animation:ring-pulse_1.4s_ease-out_0.7s_infinite]" />
          </>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {running ? (
            <motion.span
              key="stop"
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
              className="flex"
            >
              <Square size={11} className="fill-current" />
            </motion.span>
          ) : (
            <motion.span
              key="send"
              initial={{ scale: 0.5, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
              className="flex"
            >
              <ArrowUp size={15} strokeWidth={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </Tooltip>
  );
}
