"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronRight,
  FileDiff,
  FileText,
  Globe,
  ScrollText,
  Search,
  SquareTerminal,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block, ToolKind } from "@/lib/transcript";

type ToolBlockData = Extract<Block, { kind: "tool" }>;

const TOOL_ICON: Record<ToolKind, typeof FileText> = {
  read: FileText,
  search: Search,
  terminal: SquareTerminal,
  edit: FileDiff,
  web: Globe,
  logs: ScrollText,
};

export function ToolCard({
  block,
  accent,
  onToggle,
}: {
  block: ToolBlockData;
  accent: string;
  onToggle: () => void;
}) {
  const Icon = TOOL_ICON[block.tool];
  const running = block.status === "running";
  const expandable = block.lines.length > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border transition-colors duration-300",
        running ? "border-line-strong bg-ink-850/70" : "border-line/70 bg-ink-900/40",
      )}
    >
      <button
        type="button"
        onClick={expandable ? onToggle : undefined}
        aria-expanded={expandable ? block.open : undefined}
        className={cn(
          "relative flex w-full items-center gap-2 px-2.5 py-[7px] text-left",
          !expandable && "cursor-default",
        )}
      >
        {running ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${accent} 12%, transparent), transparent)`,
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "300%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}

        <span
          className={cn(
            "relative grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px]",
            running ? "bg-ink-750" : "bg-ink-800",
          )}
          style={running ? { color: accent } : undefined}
        >
          <Icon size={11} className={running ? undefined : "text-fg-subtle"} />
        </span>

        <span className="relative text-[12px] font-medium text-fg-muted">{block.title}</span>
        {block.target !== undefined ? (
          <span className="relative min-w-0 flex-1 truncate font-mono text-[11.5px] text-fg-subtle">
            {block.target}
          </span>
        ) : (
          <span className="flex-1" />
        )}

        {running ? (
          <span className="relative flex gap-[3px]" aria-hidden>
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-[3px] w-[3px] rounded-full"
                style={{ background: accent }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14 }}
              />
            ))}
          </span>
        ) : (
          <>
            {block.meta !== undefined ? (
              <span className="relative font-mono text-[10px] text-fg-faint">{block.meta}</span>
            ) : null}
            <Check size={12} className="relative shrink-0 text-added/70" strokeWidth={2.4} />
          </>
        )}

        {expandable ? (
          <ChevronRight
            size={12}
            className={cn(
              "relative shrink-0 text-fg-faint transition-transform duration-200",
              block.open && "rotate-90",
            )}
          />
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {block.open && expandable ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <pre className="scroll-thin overflow-x-auto border-t border-line/60 bg-ink-1000/40 px-3 py-2 font-mono text-[11px] leading-[1.7] text-fg-subtle">
              {block.lines.join("\n")}
            </pre>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
