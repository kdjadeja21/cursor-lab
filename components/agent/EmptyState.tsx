"use client";

import { motion } from "motion/react";
import { CursorMark } from "@/components/brand/CursorMark";
import { Kbd } from "@/components/ui/Kbd";
import { useAgent } from "@/lib/agent-store";
import { SUGGESTIONS } from "@/lib/scripts";
import { MODES } from "@/lib/modes";

export function EmptyState() {
  const { state, submit } = useAgent();
  const mode = MODES[state.mode];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <CursorMark size={46} state="thinking" accent={mode.accent} speed={0.55} glow />
      </motion.div>

      <div className="space-y-1.5">
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] font-medium text-fg"
        >
          What should we look at?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[300px] text-[12.5px] leading-relaxed text-fg-subtle"
        >
          {mode.detail}
        </motion.p>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {SUGGESTIONS.map((suggestion, index) => (
          <motion.button
            key={suggestion}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2 + index * 0.06,
              duration: 0.42,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => submit(suggestion)}
            className="rounded-full border border-line bg-ink-850/60 px-2.5 py-1.5 text-[11.5px] text-fg-muted transition-all duration-200 hover:-translate-y-px hover:border-line-strong hover:text-fg"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10.5px] text-fg-faint"
      >
        <span className="flex items-center gap-1.5">
          <Kbd keys={["⇧", "Tab"]} /> mode
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={["⌘", "/"]} /> model
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={["⌘", "⇧", "/"]} /> effort
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={["⌘", "⇧", "."]} /> Fast
        </span>
      </motion.div>
    </div>
  );
}
