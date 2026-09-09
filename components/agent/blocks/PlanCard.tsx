"use client";

import { motion } from "motion/react";
import { Check, Map, Pencil } from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { MODES } from "@/lib/modes";
import type { Block } from "@/lib/transcript";

type PlanBlockData = Extract<Block, { kind: "plan" }>;

export function PlanCard({
  block,
  onApprove,
}: {
  block: PlanBlockData;
  onApprove: () => void;
}) {
  const accent = MODES.plan.accent;

  return (
    <motion.div
      layout="position"
      className="overflow-hidden rounded-card border bg-linear-to-b from-plan/[0.07] to-transparent"
      style={{ borderColor: `color-mix(in oklab, ${accent} 26%, transparent)` }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Map size={13} style={{ color: accent }} />
        <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: accent }}>
          Plan
        </span>
        {block.approved ? (
          <span className="flex items-center gap-1 rounded-full bg-added/15 px-2 py-[2px] text-[10px] font-medium text-added">
            <Check size={9} strokeWidth={3} />
            Approved
          </span>
        ) : null}
      </div>

      <div className="px-3 pb-3">
        <p className="text-[13.5px] font-medium text-fg">{block.title}</p>
        <ol className="mt-2.5 space-y-2">
          {block.steps.map((step, index) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-2.5"
            >
              <span
                className="mt-[1px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                style={{
                  background: `color-mix(in oklab, ${accent} 16%, transparent)`,
                  color: accent,
                }}
              >
                {index + 1}
              </span>
              <span className="text-[12.5px] leading-relaxed text-fg-muted">{step}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      {block.approved ? null : (
        <div className="flex items-center gap-1.5 border-t px-2.5 py-2" style={{ borderColor: `color-mix(in oklab, ${accent} 18%, transparent)` }}>
          <button
            type="button"
            onClick={onApprove}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-ink-1000 transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: `color-mix(in oklab, ${accent} 86%, white)` }}
          >
            <CursorMark size={12} accent="#0b0c0f" />
            Build this plan
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] text-fg-subtle transition-colors hover:bg-ink-800 hover:text-fg"
          >
            <Pencil size={11} />
            Refine in chat
          </button>
        </div>
      )}
    </motion.div>
  );
}
