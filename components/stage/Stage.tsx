"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AgentWindow } from "@/components/agent/AgentWindow";
import { CursorGlyph, CursorMark } from "@/components/brand/CursorMark";
import { TipProvider } from "@/components/ui/Tip";
import { AgentProvider, useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { MODES } from "@/lib/modes";

const WIDTHS = [
  { id: "compact", label: "Compact", px: 428 },
  { id: "comfortable", label: "Comfortable", px: 564 },
  { id: "wide", label: "Wide", px: 748 },
] as const;

type WidthId = (typeof WIDTHS)[number]["id"];

function Backdrop({ accent }: { accent: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-1/3 left-1/2 h-[820px] w-[820px] -translate-x-1/2 animate-drift rounded-full blur-[120px] transition-colors duration-1000"
        style={{ background: `radial-gradient(circle, ${accent}26 0%, transparent 66%)` }}
      />
      <div
        className="absolute -bottom-1/4 left-[18%] h-[620px] w-[620px] animate-drift-slow rounded-full blur-[130px] transition-colors duration-1000"
        style={{ background: `radial-gradient(circle, ${accent}1c 0%, transparent 68%)` }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          className="opacity-[0.022]"
          animate={{ rotate: 360 }}
          transition={{ duration: 220, repeat: Infinity, ease: "linear" }}
        >
          <CursorGlyph size={780} className="text-white" />
        </motion.div>
      </div>
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-ink-1000/80" />
    </div>
  );
}

function StageInner() {
  const { state } = useAgent();
  const accent = MODES[state.mode].accent;
  const [width, setWidth] = useState<WidthId>("comfortable");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const active = WIDTHS.find((option) => option.id === width) ?? WIDTHS[1];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink-1000">
      <Backdrop accent={accent} />

      <div className="pointer-events-none absolute top-5 left-6 hidden items-center gap-2.5 md:flex">
        <CursorGlyph size={13} className="text-fg-subtle" />
        <div>
          <p className="text-[11.5px] font-medium text-fg-muted">Agent window</p>
          <p className="text-[10.5px] text-fg-faint">
            A UI/UX study. Every control works; nothing calls a model.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-14 sm:px-8">
        <motion.div
          layout
          animate={{ width: active.px }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="h-full max-h-[860px] w-full"
          style={{ maxWidth: "100%" }}
        >
          <AgentWindow compact={width === "compact"} />
        </motion.div>
      </div>

      <div className="relative flex justify-center pb-5">
        <div className="flex items-center gap-0.5 rounded-full border border-line bg-ink-900/70 p-1 backdrop-blur-xl">
          {WIDTHS.map((option) => {
            const selected = option.id === width;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setWidth(option.id)}
                className={cn(
                  "relative rounded-full px-3 py-1 text-[11px] font-medium transition-colors duration-200",
                  selected ? "text-fg" : "text-fg-faint hover:text-fg-muted",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="width-pill"
                    className="absolute inset-0 rounded-full bg-ink-750"
                    transition={{ type: "spring", stiffness: 480, damping: 34 }}
                  />
                ) : null}
                <span className="relative">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {booting ? (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-ink-1000"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
            >
              <CursorMark size={54} state="thinking" accent="#8fb4ff" speed={1.5} glow />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Stage() {
  return (
    <AgentProvider>
      <TipProvider>
        <StageInner />
      </TipProvider>
    </AgentProvider>
  );
}
