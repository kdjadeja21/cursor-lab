"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { EmptyState } from "@/components/agent/EmptyState";
import { AssistantMessage } from "@/components/agent/messages/AssistantMessage";
import { UserMessage } from "@/components/agent/messages/UserMessage";
import { useAgentState } from "@/lib/store";
import type { Message } from "@/lib/types";

function renderMessage(message: Message) {
  switch (message.role) {
    case "user":
      return <UserMessage message={message} />;
    case "assistant":
      return <AssistantMessage message={message} />;
    default: {
      const exhaustive: never = message;
      return exhaustive;
    }
  }
}

export function Transcript() {
  const { messages } = useAgentState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  // Changes whenever anything streams in, so the transcript follows the tail.
  const lastSignature = messages
    .map((m) => {
      if (m.role !== "assistant") return m.id;
      const chars = m.blocks.reduce(
        (n, b) => n + (b.kind === "text" || b.kind === "thinking" ? b.text.length : 1),
        0,
      );
      return `${m.id}:${m.blocks.length}:${chars}`;
    })
    .join("|");

  useEffect(() => {
    if (!pinned) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastSignature, pinned]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  };

  if (messages.length === 0) return <EmptyState />;

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex h-full flex-col gap-4 overflow-y-auto px-3 pb-4 pt-3"
      >
        {messages.map((m) => (
          <div key={m.id}>{renderMessage(m)}</div>
        ))}
      </div>
      <AnimatePresence>
        {!pinned && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              setPinned(true);
              const el = scrollRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
            className="focus-ring absolute bottom-3 left-1/2 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-full border border-line-1 bg-bg-3 px-3 text-[11.5px] text-fg-1 shadow-lg hover:bg-bg-4"
          >
            <ArrowDown size={12} /> Latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
