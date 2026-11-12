"use client";

import { Check, FileCode2, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useAgentActions } from "@/lib/store";
import type { DiffBlock } from "@/lib/types";

export function DiffCard({ block }: { block: DiffBlock }) {
  const { decideDiff } = useAgentActions();
  const decided = block.decision;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-lg border bg-bg-1",
        decided === "undone" ? "border-line-0 opacity-60" : "border-line-1",
      )}
    >
      <div className="flex items-center gap-2 border-b border-line-0 px-2.5 py-1.5 text-[12px]">
        <FileCode2 size={12} className="text-fg-3" />
        <span className="font-mono text-[11.5px] text-fg-1">{block.file}</span>
        <span className="ml-1 font-mono text-[11px] text-emerald-400">+{block.additions}</span>
        <span className="font-mono text-[11px] text-rose-400">−{block.deletions}</span>
        <div className="ml-auto flex items-center gap-1">
          {decided ? (
            <span className="flex items-center gap-1 text-[11px] text-fg-3">
              {decided === "kept" ? <Check size={11} /> : <Undo2 size={11} />}
              {decided === "kept" ? "Kept" : "Undone"}
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => decideDiff(block.id, "undone")}
                className="focus-ring rounded-md px-2 py-0.5 text-[11.5px] text-fg-2 hover:bg-bg-3 hover:text-fg-0"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => decideDiff(block.id, "kept")}
                className="focus-ring rounded-md bg-accent px-2 py-0.5 text-[11.5px] font-medium text-bg-0"
              >
                Keep
              </button>
            </>
          )}
        </div>
      </div>
      <pre className="overflow-x-auto py-1.5 font-mono text-[11.5px] leading-[18px]">
        {block.lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "flex px-2.5",
              l.type === "add" && "bg-emerald-500/10 text-emerald-200",
              l.type === "del" && "bg-rose-500/10 text-rose-200 line-through decoration-rose-400/40",
              l.type === "ctx" && "text-fg-2",
              decided === "undone" && l.type === "add" && "opacity-40",
            )}
          >
            <span className="w-4 shrink-0 select-none text-fg-3">
              {l.type === "add" ? "+" : l.type === "del" ? "−" : " "}
            </span>
            <span className="whitespace-pre">{l.text}</span>
          </div>
        ))}
      </pre>
    </motion.div>
  );
}
