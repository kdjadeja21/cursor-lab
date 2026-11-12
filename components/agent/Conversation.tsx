"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  Copy,
  FileText,
  Folder,
  GitBranch,
  Image as ImageIcon,
  RotateCcw,
  Zap,
} from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { ProviderLogo } from "@/components/brand/ProviderLogo";
import { DiffCard } from "@/components/agent/blocks/DiffCard";
import { PlanCard } from "@/components/agent/blocks/PlanCard";
import { StreamText } from "@/components/agent/blocks/StreamText";
import { ThinkingBlock } from "@/components/agent/blocks/ThinkingBlock";
import { TodoList } from "@/components/agent/blocks/TodoList";
import { ToolCard } from "@/components/agent/blocks/ToolCard";
import { EmptyState } from "@/components/agent/EmptyState";
import { useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { EFFORTS } from "@/lib/effort";
import { MODES } from "@/lib/modes";
import { getModel } from "@/lib/models";
import type { Message } from "@/lib/transcript";

const ATTACHMENT_ICON = {
  file: FileText,
  folder: Folder,
  image: ImageIcon,
} as const;

function SettingsTrail({ message }: { message: Extract<Message, { role: "user" | "assistant" }> }) {
  const model = getModel(message.modelId);
  const mode = MODES[message.mode];
  const ModeIcon = mode.icon;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-fg-faint">
      <span className="flex items-center gap-1" style={{ color: mode.accent }}>
        <ModeIcon size={10} />
        {mode.name}
      </span>
      <span className="text-ink-600">·</span>
      <span className="flex items-center gap-1">
        <ProviderLogo provider={model.provider} size={10} mono />
        {model.name}
      </span>
      {message.effort === null ? null : (
        <>
          <span className="text-ink-600">·</span>
          <span style={{ color: `color-mix(in oklab, ${EFFORTS[message.effort].color} 70%, white)` }}>
            {EFFORTS[message.effort].label.toLowerCase()} effort
          </span>
        </>
      )}
      {message.fast ? (
        <>
          <span className="text-ink-600">·</span>
          <span className="flex items-center gap-0.5 text-fast/80">
            <Zap size={9} fill="currentColor" strokeWidth={0} />
            Fast
          </span>
        </>
      ) : null}
    </div>
  );
}

export function Conversation() {
  const { state, toggleBlock, decideDiff, approvePlan, retryLast } = useAgent();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node === null || !pinned) return;
    node.scrollTop = node.scrollHeight;
  }, [state.messages, pinned]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node === null) return;
    function onScroll() {
      if (node === null) return;
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      setPinned(distance < 80);
    }
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  if (state.messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="scroll-thin flex-1 space-y-3.5 overflow-y-auto px-3 py-3">
        {state.messages.map((message) => {
          if (message.role === "note") {
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, scaleX: 0.7 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="flex items-center gap-2.5 py-1"
              >
                <span className="h-px flex-1 bg-linear-to-r from-transparent to-line" />
                <span className="text-[10.5px] tracking-wide text-fg-faint">{message.text}</span>
                <span className="h-px flex-1 bg-linear-to-l from-transparent to-line" />
              </motion.div>
            );
          }

          if (message.role === "user") {
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1.5"
              >
                <div className="rounded-panel border border-line bg-ink-850/70 px-3 py-2.5">
                  <p className="text-[13px] leading-relaxed text-fg">{message.text}</p>
                  {message.attachments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.attachments.map((attachment) => {
                        const Icon = ATTACHMENT_ICON[attachment.kind];
                        return (
                          <span
                            key={attachment.id}
                            className="flex items-center gap-1.5 rounded-full border border-line bg-ink-800 px-2 py-[3px] font-mono text-[10.5px] text-fg-subtle"
                          >
                            <Icon size={10} />
                            {attachment.name}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="px-1">
                  <SettingsTrail message={message} />
                </div>
              </motion.div>
            );
          }

          const mode = MODES[message.mode];
          const speed =
            (message.effort === null ? 1 : 0.7 + EFFORTS[message.effort].intensity * 1.8) *
            (message.fast ? 1.7 : 1);

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2"
            >
              {message.blocks.map((block) => {
                switch (block.kind) {
                  case "text":
                    return (
                      <div key={block.id} className="px-1">
                        <StreamText text={block.text} streaming={block.streaming} />
                      </div>
                    );
                  case "thinking":
                    return (
                      <ThinkingBlock
                        key={block.id}
                        block={block}
                        accent={mode.accent}
                        speed={speed}
                        onToggle={() => toggleBlock(message.id, block.id)}
                      />
                    );
                  case "tool":
                    return (
                      <ToolCard
                        key={block.id}
                        block={block}
                        accent={mode.accent}
                        onToggle={() => toggleBlock(message.id, block.id)}
                      />
                    );
                  case "todo":
                    return <TodoList key={block.id} block={block} accent={mode.accent} />;
                  case "diff":
                    return (
                      <DiffCard
                        key={block.id}
                        block={block}
                        onToggle={() => toggleBlock(message.id, block.id)}
                        onDecide={(decision) => decideDiff(message.id, block.id, decision)}
                      />
                    );
                  case "plan":
                    return (
                      <PlanCard
                        key={block.id}
                        block={block}
                        onApprove={() => approvePlan(message.id, block.id)}
                      />
                    );
                  default: {
                    const never: never = block;
                    return never;
                  }
                }
              })}

              {message.status === "streaming" && message.blocks.length === 0 ? (
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <CursorMark
                    size={15}
                    state="thinking"
                    accent={mode.accent}
                    speed={speed}
                    glow
                  />
                  <span className="text-shimmer text-[12px] font-medium">Getting started</span>
                </div>
              ) : null}

              {message.status !== "streaming" ? (
                <div className="flex items-center gap-2 px-1 pt-0.5">
                  <SettingsTrail message={message} />
                  {message.elapsedMs > 0 ? (
                    <>
                      <span className="text-ink-600">·</span>
                      <span className="font-mono text-[10.5px] text-fg-faint">
                        {(message.elapsedMs / 1000).toFixed(1)}s
                      </span>
                    </>
                  ) : null}
                  {message.status === "stopped" ? (
                    <span className="rounded-[5px] bg-ink-750 px-1.5 py-[1px] text-[9.5px] text-fg-subtle">
                      stopped
                    </span>
                  ) : null}
                  <span className="flex-1" />
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const text = message.blocks
                          .filter((block) => block.kind === "text")
                          .map((block) => (block.kind === "text" ? block.text : ""))
                          .join("\n\n");
                        void navigator.clipboard?.writeText(text);
                        setCopied(message.id);
                        window.setTimeout(() => setCopied(null), 1400);
                      }}
                      aria-label="Copy reply"
                      className="grid h-6 w-6 place-items-center rounded-[7px] text-fg-faint transition-colors hover:bg-ink-800 hover:text-fg-muted"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={retryLast}
                      aria-label="Retry"
                      className="grid h-6 w-6 place-items-center rounded-[7px] text-fg-faint transition-colors hover:bg-ink-800 hover:text-fg-muted"
                    >
                      <RotateCcw size={11} />
                    </button>
                    <button
                      type="button"
                      aria-label="Branch from here"
                      className="grid h-6 w-6 place-items-center rounded-[7px] text-fg-faint transition-colors hover:bg-ink-800 hover:text-fg-muted"
                    >
                      <GitBranch size={11} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {copied === message.id ? (
                      <motion.span
                        initial={{ opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] text-added"
                      >
                        copied
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {!pinned ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              const node = scrollRef.current;
              if (node !== null) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
              setPinned(true);
            }}
            className={cn(
              "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-ink-800/90 px-2.5 py-1.5 text-[11px] text-fg-muted shadow-lg backdrop-blur-md",
              "transition-colors hover:border-line-strong hover:text-fg",
            )}
          >
            <ArrowDown size={11} />
            Jump to latest
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
