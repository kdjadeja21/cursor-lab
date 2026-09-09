"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CursorMark } from "@/components/brand/CursorMark";
import { cn } from "@/lib/cn";
import type { ThinkingBlock as ThinkingBlockType } from "@/lib/types";

function useElapsed(startedAt: number, endedAt: number | undefined, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [running]);
  const end = endedAt ?? (running ? now : startedAt);
  return Math.max(0, (end - startedAt) / 1000);
}

export function ThinkingBlock({ block, speed }: { block: ThinkingBlockType; speed: number }) {
  const running = !block.done;
  const [open, setOpen] = useState(true);
  const elapsed = useElapsed(block.startedAt, block.endedAt, running);

  useEffect(() => {
    if (block.done) {
      const t = setTimeout(() => setOpen(false), 500);
      return () => clearTimeout(t);
    }
  }, [block.done]);

  return (
    <div className="rounded-lg border border-line-0 bg-bg-1/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px]"
      >
        <CursorMark size={14} state={running ? "thinking" : "done"} speed={speed} />
        <span className={cn(running ? "shimmer-text" : "text-fg-2")}>
          {running ? "Thinking" : "Thought"}
          {elapsed >= 0.5 && ` for ${elapsed.toFixed(elapsed < 10 ? 1 : 0)}s`}
        </span>
        <ChevronRight
          size={12}
          className={cn("ml-auto text-fg-3 transition-transform", open && "rotate-90")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && block.text && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="max-h-40 overflow-y-auto border-t border-line-0 px-3 py-2 text-[12px] leading-[1.6] text-fg-2">
              {block.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
