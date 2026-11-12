"use client";

import { Check, ListTodo, Play } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useAgentActions, useAgentState } from "@/lib/store";
import type { PlanBlock } from "@/lib/types";

export function PlanCard({ block }: { block: PlanBlock }) {
  const { approvePlan } = useAgentActions();
  const { runningId } = useAgentState();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-lg border border-line-1 bg-bg-1"
    >
      <div className="flex items-center gap-2 border-b border-line-0 px-3 py-2">
        <ListTodo size={13} className="text-accent" />
        <span className="text-[12.5px] font-semibold text-fg-0">Plan</span>
        <span className="truncate text-[12px] text-fg-3">· {block.title}</span>
      </div>
      <ol className="flex flex-col gap-1 px-3 py-2.5">
        {block.steps.map((step, i) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i }}
            className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-fg-1"
          >
            <span
              className={cn(
                "mt-[3px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border text-[9.5px] font-semibold",
                block.approved
                  ? "border-accent bg-accent text-bg-0"
                  : "border-line-2 text-fg-3",
              )}
            >
              {block.approved ? <Check size={10} strokeWidth={3} /> : i + 1}
            </span>
            {step}
          </motion.li>
        ))}
      </ol>
      <div className="flex items-center justify-between border-t border-line-0 px-3 py-2">
        <span className="text-[11px] text-fg-3">
          {block.approved ? "Handed to Agent mode" : `${block.steps.length} steps · read-only until approved`}
        </span>
        {!block.approved && (
          <button
            type="button"
            disabled={runningId !== null}
            onClick={() => approvePlan(block.id, block.title)}
            className="focus-ring flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[11.5px] font-medium text-bg-0 disabled:opacity-50"
          >
            <Play size={11} className="fill-current" />
            Build plan
          </button>
        )}
      </div>
    </motion.div>
  );
}
