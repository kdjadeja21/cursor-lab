"use client";

import { motion } from "motion/react";
import { Check, ListTodo } from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { cn } from "@/lib/cn";
import type { Block } from "@/lib/transcript";

type TodoBlockData = Extract<Block, { kind: "todo" }>;

export function TodoList({
  block,
  accent,
}: {
  block: TodoBlockData;
  accent: string;
}) {
  const done = block.items.filter((item) => item.status === "done").length;

  return (
    <div className="rounded-card border border-line/70 bg-ink-900/40">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <ListTodo size={12} className="text-fg-faint" />
        <span className="text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
          Todos
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[10px] text-fg-faint">
          {done}/{block.items.length}
        </span>
      </div>
      <div className="space-y-0.5 border-t border-line/60 px-2.5 py-2">
        {block.items.map((item) => (
          <div key={item.text} className="flex items-center gap-2 py-[3px]">
            <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
              {item.status === "done" ? (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  className="grid h-[15px] w-[15px] place-items-center rounded-full bg-added/20"
                >
                  <Check size={9} className="text-added" strokeWidth={3} />
                </motion.span>
              ) : item.status === "active" ? (
                <CursorMark size={13} state="working" accent={accent} speed={1.4} />
              ) : (
                <span className="h-[11px] w-[11px] rounded-full border border-ink-600" />
              )}
            </span>
            <span
              className={cn(
                "text-[12px] transition-colors duration-300",
                item.status === "done" && "text-fg-faint line-through decoration-fg-faint/50",
                item.status === "active" && "text-fg",
                item.status === "pending" && "text-fg-subtle",
              )}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
