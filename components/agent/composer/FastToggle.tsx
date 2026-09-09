"use client";

import { AnimatePresence, motion } from "motion/react";
import { Zap } from "lucide-react";
import { Tip } from "@/components/ui/Tip";
import { useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { usageLabel } from "@/lib/effort";

export function FastToggle() {
  const { state, model, toggleFast } = useAgent();
  const available = model.fast;
  const on = state.fast && available;

  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Fast mode"
      disabled={!available}
      onClick={toggleFast}
      className={cn(
        "relative flex h-7 items-center gap-1.5 overflow-hidden rounded-full border px-2.5 text-[11.5px] font-medium transition-colors duration-200",
        available
          ? on
            ? "border-fast/45 bg-fast/15 text-fast"
            : "border-line bg-ink-850/80 text-fg-subtle hover:border-line-strong hover:text-fg-muted"
          : "cursor-not-allowed border-dashed border-line bg-transparent text-fg-faint",
      )}
      style={on ? { boxShadow: "0 0 20px -8px var(--color-fast)" } : undefined}
    >
      {on ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-8 bg-linear-to-r from-transparent via-fast/25 to-transparent"
          initial={{ x: -40 }}
          animate={{ x: 120 }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.7 }}
        />
      ) : null}
      <motion.span
        animate={on ? { rotate: [0, -12, 10, 0], scale: [1, 1.18, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="relative"
      >
        <Zap size={12} strokeWidth={2.3} fill={on ? "currentColor" : "none"} />
      </motion.span>
      <span className="relative">Fast</span>
      <AnimatePresence initial={false}>
        {on ? (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden font-mono text-[10px] whitespace-nowrap text-fast/70"
          >
            <span className="pl-0.5">2×</span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  );

  if (!available) {
    return (
      <Tip
        label="Fast unavailable"
        hint={model.fastReason ?? `${model.name} has no Fast variant.`}
        keys={["⌘", "⇧", "."]}
      >
        <span className="inline-flex">{button}</span>
      </Tip>
    );
  }

  return (
    <Tip
      label={on ? "Fast is on" : "Turn Fast on"}
      hint={
        on
          ? `Priority capacity, ${state.effort === null ? "2× usage" : usageLabel(state.effort, true)}.`
          : "Priority capacity for lower latency. Doubles usage."
      }
      keys={["⌘", "⇧", "."]}
    >
      {button}
    </Tip>
  );
}
