"use client";

import { Bug, Infinity as InfinityIcon, ListTodo, MessageCircleQuestion } from "lucide-react";
import { motion } from "motion/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { MODES, MODE_META, type Mode } from "@/lib/modes";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState } from "@/lib/store";

const ICONS: Record<Mode, typeof InfinityIcon> = {
  agent: InfinityIcon,
  plan: ListTodo,
  ask: MessageCircleQuestion,
  debug: Bug,
};

export function ModeSwitch() {
  const { settings } = useAgentState();
  const { setMode } = useAgentActions();

  return (
    <div
      role="radiogroup"
      aria-label="Mode"
      className="flex h-7 items-center gap-0.5 rounded-lg border border-line-0 bg-bg-1 p-0.5"
    >
      {MODES.map((mode) => {
        const Icon = ICONS[mode];
        const active = mode === settings.mode;
        const meta = MODE_META[mode];
        return (
          <Tooltip
            key={mode}
            label={meta.label}
            keys={active ? undefined : SHORTCUTS.mode.keys}
            disabled={active}
          >
            <motion.button
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={meta.label}
              onClick={() => setMode(mode)}
              layout
              transition={{ type: "spring", stiffness: 600, damping: 40 }}
              className={cn(
                "focus-ring relative flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] font-medium",
                active ? "text-bg-0" : "text-fg-2 hover:text-fg-0",
              )}
            >
              {active && (
                <motion.span
                  layoutId="mode-pill"
                  transition={{ type: "spring", stiffness: 600, damping: 40 }}
                  className="absolute inset-0 rounded-md bg-accent shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={13} strokeWidth={2.2} />
                {active && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.16, delay: 0.05 }}
                    className="pr-0.5"
                  >
                    {meta.label}
                  </motion.span>
                )}
              </span>
            </motion.button>
          </Tooltip>
        );
      })}
    </div>
  );
}
