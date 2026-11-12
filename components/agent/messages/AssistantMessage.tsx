"use client";

import { Copy, RotateCcw, Square } from "lucide-react";
import { motion } from "motion/react";
import { ProviderLogo } from "@/components/brand/ProviderLogo";
import { CursorMark } from "@/components/brand/CursorMark";
import { DiffCard } from "@/components/agent/messages/DiffCard";
import { PlanCard } from "@/components/agent/messages/PlanCard";
import { StreamingText } from "@/components/agent/messages/StreamingText";
import { ThinkingBlock } from "@/components/agent/messages/ThinkingBlock";
import { ToolCard } from "@/components/agent/messages/ToolCard";
import { cn } from "@/lib/cn";
import { EFFORT_SHORT, effortRank } from "@/lib/effort";
import { getModel } from "@/lib/models";
import { MODE_META } from "@/lib/modes";
import type { AssistantMessage as AssistantMessageType, Block } from "@/lib/types";

export function markSpeed(message: Pick<AssistantMessageType, "effort" | "fast">) {
  const base = message.effort ? 0.8 + effortRank(message.effort) * 0.22 : 1;
  return base * (message.fast ? 1.5 : 1);
}

function renderBlock(block: Block, speed: number) {
  switch (block.kind) {
    case "thinking":
      return <ThinkingBlock block={block} speed={speed} />;
    case "tool":
      return <ToolCard block={block} speed={speed} />;
    case "text":
      return <StreamingText block={block} speed={speed} />;
    case "diff":
      return <DiffCard block={block} />;
    case "plan":
      return <PlanCard block={block} />;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

export function AssistantMessage({ message }: { message: AssistantMessageType }) {
  const model = getModel(message.modelId);
  const speed = markSpeed(message);
  const running = message.status === "running";
  const duration =
    message.finishedAt ? ((message.finishedAt - message.startedAt) / 1000).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-3">
        <CursorMark size={14} state={running ? "working" : "idle"} speed={speed} />
        <span className="font-medium text-fg-2">{MODE_META[message.mode].label}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <ProviderLogo provider={model.provider} size={10} />
          {model.name}
        </span>
        {message.effort && (
          <>
            <span>·</span>
            <span>{EFFORT_SHORT[message.effort]}</span>
          </>
        )}
        {message.fast && (
          <>
            <span>·</span>
            <span className="text-accent">Fast</span>
          </>
        )}
      </div>

      {message.blocks.length === 0 && running && (
        <div className="flex items-center gap-2 py-1 text-[12.5px]">
          <CursorMark size={16} state="thinking" speed={speed} />
          <span className="shimmer-text">Starting…</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {message.blocks.map((block) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderBlock(block, speed)}
          </motion.div>
        ))}
      </div>

      {!running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 text-[11px] text-fg-3"
        >
          {message.status === "stopped" ? (
            <span className="flex items-center gap-1">
              <Square size={9} className="fill-current" /> Stopped
            </span>
          ) : (
            <span>Done{duration && ` in ${duration}s`}</span>
          )}
          <span className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Copy"
              className={cn("focus-ring rounded p-1 hover:bg-bg-3 hover:text-fg-1")}
            >
              <Copy size={11} />
            </button>
            <button
              type="button"
              aria-label="Retry"
              className={cn("focus-ring rounded p-1 hover:bg-bg-3 hover:text-fg-1")}
            >
              <RotateCcw size={11} />
            </button>
          </span>
        </motion.div>
      )}
    </div>
  );
}
