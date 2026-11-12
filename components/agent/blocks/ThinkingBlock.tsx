"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { cn } from "@/lib/cn";
import type { Block } from "@/lib/transcript";

type ThinkingBlockData = Extract<Block, { kind: "thinking" }>;

export function ThinkingBlock({
  block,
  accent,
  speed,
  onToggle,
}: {
  block: ThinkingBlockData;
  accent: string;
  speed: number;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-card border border-line/70 bg-ink-900/50">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={block.open}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
      >
        <CursorMark
          size={14}
          state={block.active ? "thinking" : "idle"}
          accent={accent}
          speed={speed}
          glow={block.active}
        />
        <span
          className={cn(
            "text-[12px] font-medium",
            block.active ? "text-shimmer" : "text-fg-muted",
          )}
        >
          {block.active
            ? block.label
            : `Thought for ${Math.max(1, block.seconds)}s`}
        </span>
        <span className="flex-1" />
        <ChevronRight
          size={13}
          className={cn(
            "text-fg-faint transition-transform duration-200",
            block.open && "rotate-90",
          )}
        />
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
            <div className="space-y-1.5 border-t border-line/60 px-3 py-2.5">
              {block.lines.map((line) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="border-l border-line pl-2.5 text-[12px] leading-relaxed text-fg-subtle"
                >
                  {line}
                </motion.p>
              ))}
              {block.active ? (
                <div className="flex gap-1 pl-2.5" aria-hidden>
                  {[0, 1, 2].map((index) => (
                    <motion.span
                      key={index}
                      className="h-1 w-1 rounded-full bg-fg-faint"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        delay: index * 0.16,
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
