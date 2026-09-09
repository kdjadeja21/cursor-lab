"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, Undo2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block } from "@/lib/transcript";

type DiffBlockData = Extract<Block, { kind: "diff" }>;

export function DiffCard({
  block,
  onToggle,
  onDecide,
}: {
  block: DiffBlockData;
  onToggle: () => void;
  onDecide: (decision: "accepted" | "rejected") => void;
}) {
  const decided = block.decision !== "pending";
  const accepted = block.decision === "accepted";

  return (
    <motion.div
      layout="position"
      className={cn(
        "overflow-hidden rounded-card border transition-colors duration-300",
        decided
          ? accepted
            ? "border-added/25 bg-added/[0.04]"
            : "border-line/60 bg-ink-900/30 opacity-70"
          : "border-line-strong bg-ink-900/60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={block.open}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
      >
        <ChevronRight
          size={12}
          className={cn(
            "shrink-0 text-fg-faint transition-transform duration-200",
            block.open && "rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-fg-muted">
          {block.file}
        </span>
        <span className="shrink-0 font-mono text-[10.5px] text-added">+{block.added}</span>
        <span className="shrink-0 font-mono text-[10.5px] text-removed">−{block.removed}</span>
      </button>

      <AnimatePresence initial={false}>
        {block.open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="scroll-thin max-h-[268px] overflow-auto border-t border-line/60 bg-ink-1000/50 py-1.5">
              {block.lines.map((line, index) => (
                <div
                  key={`${index}-${line.text}`}
                  className={cn(
                    "flex gap-2 px-2.5 font-mono text-[11px] leading-[1.65] whitespace-pre",
                    line.type === "add" && "bg-added/[0.09]",
                    line.type === "remove" && "bg-removed/[0.09]",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 shrink-0 select-none",
                      line.type === "add" && "text-added",
                      line.type === "remove" && "text-removed",
                      line.type === "context" && "text-transparent",
                    )}
                  >
                    {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
                  </span>
                  <span
                    className={cn(
                      line.type === "context" ? "text-fg-subtle" : "text-fg",
                      line.type === "remove" && "text-fg-muted",
                    )}
                  >
                    {line.text.length === 0 ? " " : line.text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-1.5 border-t border-line/60 px-2.5 py-1.5">
        {decided ? (
          <>
            <span
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium",
                accepted ? "text-added" : "text-fg-subtle",
              )}
            >
              {accepted ? <Check size={11} strokeWidth={2.6} /> : <X size={11} strokeWidth={2.6} />}
              {accepted ? "Applied to the file" : "Discarded"}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => onDecide(accepted ? "rejected" : "accepted")}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-fg-faint transition-colors hover:bg-ink-800 hover:text-fg-muted"
            >
              <Undo2 size={10} />
              Undo
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onDecide("accepted")}
              className="flex items-center gap-1.5 rounded-full bg-added/15 px-2.5 py-1 text-[11px] font-medium text-added transition-colors hover:bg-added/25"
            >
              <Check size={11} strokeWidth={2.6} />
              Accept
            </button>
            <button
              type="button"
              onClick={() => onDecide("rejected")}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-fg-subtle transition-colors hover:bg-ink-800 hover:text-fg"
            >
              <X size={11} strokeWidth={2.6} />
              Reject
            </button>
            <span className="flex-1" />
            <span className="font-mono text-[10px] text-fg-faint">review</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
