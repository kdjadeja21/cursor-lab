"use client";

import { AnimatePresence, motion } from "motion/react";
import { Tip } from "@/components/ui/Tip";
import { useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { MODE_LIST } from "@/lib/modes";

/**
 * All four modes stay on screen. The active one widens to show its name and
 * a sliding accent pill follows it, so Shift+Tab reads as movement.
 */
export function ModeRail({ compact = false }: { compact?: boolean }) {
  const { state, setMode } = useAgent();

  return (
    <div
      role="radiogroup"
      aria-label="Agent mode"
      className="relative flex items-center gap-px rounded-full border border-line bg-ink-850/80 p-[3px]"
    >
      {MODE_LIST.map((mode) => {
        const active = mode.id === state.mode;
        const Icon = mode.icon;
        return (
          <Tip
            key={mode.id}
            label={mode.name}
            hint={mode.detail}
            keys={active ? ["⇧", "Tab"] : undefined}
            side="top"
          >
            <button
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={mode.name}
              onClick={() => setMode(mode.id)}
              style={{ ["--accent" as string]: mode.accent }}
              className={cn(
                "relative grid h-[22px] place-items-center rounded-full px-[7px] transition-colors duration-200",
                active ? "text-[color:var(--accent)]" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `color-mix(in oklab, ${mode.accent} 18%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${mode.accent} 34%, transparent), 0 0 18px -6px ${mode.accent}`,
                  }}
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                />
              ) : null}
              <span className="relative flex items-center gap-1">
                <Icon size={13} strokeWidth={2.1} />
                <AnimatePresence initial={false}>
                  {active && !compact ? (
                    <motion.span
                      key="label"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden text-[11.5px] leading-none font-medium whitespace-nowrap"
                    >
                      <span className="pl-px pr-0.5">{mode.name}</span>
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </span>
            </button>
          </Tip>
        );
      })}
    </div>
  );
}
