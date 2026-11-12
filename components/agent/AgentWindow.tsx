"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Keyboard, Plus } from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { Composer, type ComposerHandle } from "@/components/agent/composer/Composer";
import { Conversation } from "@/components/agent/Conversation";
import { ShortcutSheet } from "@/components/agent/ShortcutSheet";
import { Tip } from "@/components/ui/Tip";
import { useAgent } from "@/lib/agent-store";
import { useAgentShortcuts } from "@/lib/keys";
import { MODES } from "@/lib/modes";

export function AgentWindow({ compact = false }: { compact?: boolean }) {
  const api = useAgent();
  const { state, newChat } = api;
  const composerRef = useRef<ComposerHandle | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const mode = MODES[state.mode];
  const streaming = state.status === "streaming";

  useAgentShortcuts(api, {
    focusComposer: () => composerRef.current?.focus(),
    openModelPicker: () => composerRef.current?.openModelPicker(),
    toggleHelp: () => setHelpOpen((value) => !value),
    closeOverlays: () => {
      if (helpOpen) {
        setHelpOpen(false);
        return true;
      }
      return composerRef.current?.closeOverlays() ?? false;
    },
  });

  useEffect(() => {
    function onNewChat() {
      newChat();
    }
    window.addEventListener("agent-new-chat", onNewChat);
    return () => window.removeEventListener("agent-new-chat", onNewChat);
  }, [newChat]);

  const firstUser = state.messages.find((message) => message.role === "user");
  const title =
    firstUser !== undefined && firstUser.role === "user"
      ? firstUser.text.replace(/@[\w./()-]+\s?/g, "").slice(0, 42)
      : "New chat";

  return (
    <>
      <motion.div
        layout
        style={{ ["--accent" as string]: mode.accent }}
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-window border border-line bg-ink-900/80 shadow-[0_50px_140px_-40px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-2xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40 transition-colors duration-700"
          style={{
            background: `radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, ${mode.accent} 14%, transparent), transparent 70%)`,
          }}
        />

        <header className="relative flex items-center gap-2.5 px-3.5 py-3">
          <CursorMark
            size={17}
            state={streaming ? "working" : "idle"}
            accent={mode.accent}
            speed={state.fast ? 1.8 : 1.1}
            glow={streaming}
          />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium text-fg">{title}</p>
            <p className="text-[10.5px] text-fg-faint">
              {state.messages.length === 0
                ? "Agent window — UI/UX study"
                : `${state.messages.filter((message) => message.role === "user").length} turns`}
            </p>
          </div>
          <span className="flex-1" />
          <Tip label="Shortcuts" keys={["?"]} side="bottom">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Shortcuts"
              className="grid h-7 w-7 place-items-center rounded-[9px] text-fg-subtle transition-colors hover:bg-ink-800 hover:text-fg"
            >
              <Keyboard size={14} />
            </button>
          </Tip>
          <Tip label="New chat" keys={["⌘", "⇧", "N"]} side="bottom">
            <button
              type="button"
              onClick={newChat}
              aria-label="New chat"
              className="grid h-7 w-7 place-items-center rounded-[9px] text-fg-subtle transition-colors hover:bg-ink-800 hover:text-fg"
            >
              <Plus size={15} />
            </button>
          </Tip>
        </header>

        <div className="relative h-px w-full bg-line/60">
          <AnimatePresence>
            {streaming ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 overflow-hidden"
              >
                <motion.span
                  className="absolute inset-y-0 w-1/3"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${mode.accent}, transparent)`,
                  }}
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{
                    duration: state.fast ? 1.1 : 1.7,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <Conversation />
        <Composer ref={composerRef} compact={compact} />
      </motion.div>

      <ShortcutSheet open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
