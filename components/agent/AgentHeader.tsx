"use client";

import type { ReactNode } from "react";
import { History, MoreHorizontal, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CursorMark } from "@/components/brand/CursorMark";
import { markSpeed } from "@/components/agent/messages/AssistantMessage";
import { Tooltip } from "@/components/ui/Tooltip";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState } from "@/lib/store";

function IconButton({
  label,
  keys,
  onClick,
  children,
}: {
  label: string;
  keys?: string[];
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label} keys={keys} side="bottom" align="end">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="focus-ring flex h-6 w-6 items-center justify-center rounded-md text-fg-2 hover:bg-bg-3 hover:text-fg-0"
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function AgentHeader() {
  const { chatTitle, runningId, messages, settings } = useAgentState();
  const { newChat } = useAgentActions();
  const running = runningId !== null;
  const speed = markSpeed(settings);
  const count = messages.filter((m) => m.role === "assistant").length;

  return (
    <div className="flex h-[38px] shrink-0 items-center gap-2 border-b border-line-0 px-3">
      <CursorMark size={16} state={running ? "working" : "idle"} speed={speed} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={chatTitle}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="truncate text-[12.5px] font-medium text-fg-0"
          >
            {chatTitle}
          </motion.span>
        </AnimatePresence>
        {running ? (
          <span className="shrink-0 rounded-full border border-accent-line bg-accent-soft px-1.5 py-px text-[10px] font-medium text-accent">
            Working
          </span>
        ) : (
          count > 0 && (
            <span className="shrink-0 text-[10.5px] text-fg-3">
              {count} {count === 1 ? "turn" : "turns"}
            </span>
          )
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <IconButton label="New chat" keys={SHORTCUTS.newChat.keys} onClick={newChat}>
          <Plus size={14} />
        </IconButton>
        <IconButton label="History">
          <History size={14} />
        </IconButton>
        <IconButton label="More">
          <MoreHorizontal size={14} />
        </IconButton>
      </div>
    </div>
  );
}
