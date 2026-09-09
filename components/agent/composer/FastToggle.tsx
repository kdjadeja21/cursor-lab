"use client";

import { Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState, useCurrentModel } from "@/lib/store";

export function FastToggle() {
  const { settings } = useAgentState();
  const { toggleFast } = useAgentActions();
  const model = useCurrentModel();
  const on = settings.fast && model.fast;

  const label = !model.fast
    ? `${model.name} has no Fast variant`
    : on
      ? `Fast on · ${model.fastMultiplier ?? 2}x usage`
      : "Fast · priority throughput";

  return (
    <Tooltip label={label} keys={model.fast ? SHORTCUTS.fast.keys : undefined}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Fast mode"
        disabled={!model.fast}
        onClick={toggleFast}
        className={cn(
          "focus-ring relative flex h-7 items-center gap-1 rounded-lg border px-1.5 text-[12px] font-medium transition-colors",
          on
            ? "border-accent-line bg-accent-soft text-accent [animation:fast-glow_2.4s_ease-in-out_infinite]"
            : "border-line-0 bg-bg-1 text-fg-2 hover:border-line-1 hover:text-fg-0",
          !model.fast && "cursor-not-allowed opacity-40 hover:border-line-0 hover:text-fg-2",
        )}
      >
        <motion.span
          animate={on ? { rotate: [0, -12, 8, 0], scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex"
        >
          <Zap size={13} strokeWidth={2.2} className={cn(on && "fill-current")} />
        </motion.span>
        <AnimatePresence initial={false}>
          {on && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="rounded-[3px] bg-accent/20 px-1 text-[9.5px] font-semibold">
                {model.fastMultiplier ?? 2}x
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}
