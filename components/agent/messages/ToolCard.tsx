"use client";

import { Check, FileText, FolderTree, Pencil, Search, TerminalSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CursorMark } from "@/components/brand/CursorMark";
import type { ToolBlock, ToolKind } from "@/lib/types";

const ICONS: Record<ToolKind, typeof FileText> = {
  read: FileText,
  grep: Search,
  list: FolderTree,
  edit: Pencil,
  run: TerminalSquare,
};

export function ToolCard({ block, speed }: { block: ToolBlock; speed: number }) {
  const Icon = ICONS[block.tool];
  const pending = block.status === "pending";
  return (
    <div className="flex h-7 items-center gap-2 rounded-md px-1 text-[12.5px]">
      <span className="flex h-4 w-4 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {pending ? (
            <motion.span key="p" exit={{ scale: 0.6, opacity: 0 }} className="flex">
              <CursorMark size={14} state="working" speed={speed} />
            </motion.span>
          ) : (
            <motion.span
              key="d"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 26 }}
              className="flex text-emerald-400"
            >
              <Check size={13} strokeWidth={2.6} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className={pending ? "shimmer-text" : "text-fg-2"}>{block.label}</span>
      <span className="flex min-w-0 items-center gap-1 rounded border border-line-0 bg-bg-2 px-1.5 py-px font-mono text-[11.5px] text-fg-1">
        <Icon size={11} className="shrink-0 text-fg-3" />
        <span className="truncate">{block.target}</span>
      </span>
      {block.detail && !pending && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[11.5px] text-fg-3"
        >
          {block.detail}
        </motion.span>
      )}
    </div>
  );
}
