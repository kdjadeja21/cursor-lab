"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CursorMark } from "@/components/brand/CursorMark";
import { Kbd } from "@/components/ui/Kbd";
import { MODE_META } from "@/lib/modes";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState } from "@/lib/store";

export function EmptyState() {
  const { settings } = useAgentState();
  const { send } = useAgentActions();
  const meta = MODE_META[settings.mode];

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="relative mb-5 flex h-16 w-16 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-2xl border border-line-1 bg-bg-2" />
        <span className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl [animation:breathe_4s_ease-in-out_infinite]" />
        <CursorMark size={34} state="idle" className="relative" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={settings.mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex w-full flex-col items-center"
        >
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-fg-0">{meta.emptyTitle}</h2>
          <p className="mt-1 max-w-[300px] text-[12.5px] leading-[1.55] text-fg-2">{meta.emptyBody}</p>

          <div className="mt-5 flex w-full max-w-[340px] flex-col gap-1.5">
            {meta.suggestions.map((s, i) => (
              <motion.button
                key={s}
                type="button"
                onClick={() => send(s)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="focus-ring group flex items-center gap-2 rounded-lg border border-line-0 bg-bg-1 px-3 py-2 text-left text-[12.5px] text-fg-1 transition-colors hover:border-line-1 hover:bg-bg-2 hover:text-fg-0"
              >
                <span className="flex-1">{s}</span>
                <ArrowUpRight
                  size={13}
                  className="text-fg-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center gap-4 text-[10.5px] text-fg-3">
        <span className="flex items-center gap-1.5">
          <Kbd keys={SHORTCUTS.mode.keys} /> mode
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={SHORTCUTS.model.keys} /> model
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={SHORTCUTS.effortUp.keys} /> effort
        </span>
      </div>
    </div>
  );
}
