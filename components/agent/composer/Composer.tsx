"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AtSign, FileCode2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { EffortControl } from "@/components/agent/composer/EffortControl";
import { FastToggle } from "@/components/agent/composer/FastToggle";
import { ModeSwitch } from "@/components/agent/composer/ModeSwitch";
import { ModelPicker } from "@/components/agent/composer/ModelPicker";
import { SendButton } from "@/components/agent/composer/SendButton";
import { Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { MODE_META } from "@/lib/modes";
import { useAgentActions, useAgentState } from "@/lib/store";

const FILES = [
  "Composer.tsx",
  "store.tsx",
  "page.tsx",
  "middleware.ts",
  "Sidebar.tsx",
  "route.ts",
  "globals.css",
];

export function Composer() {
  const { draft, context, settings, runningId } = useAgentState();
  const { setDraft, send, addContext, removeContext } = useAgentActions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionAnchor = useRef<HTMLDivElement>(null);
  const mentionButton = useRef<HTMLButtonElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(220, Math.max(56, el.scrollHeight))}px`;
  }, []);

  useEffect(resize, [draft, resize]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const focus = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const editable =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (editable || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      el.focus();
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, []);

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery("");
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!runningId) send();
      return;
    }
    if (e.key === "@") {
      setMentionOpen(true);
      setMentionQuery("");
    }
  };

  const onChange = (value: string) => {
    setDraft(value);
    if (mentionOpen) {
      const at = value.lastIndexOf("@");
      if (at === -1) return closeMention();
      const q = value.slice(at + 1);
      if (/\s/.test(q)) return closeMention();
      setMentionQuery(q);
    }
  };

  const pickFile = (file: string) => {
    addContext(file);
    const at = draft.lastIndexOf("@");
    if (mentionOpen && at !== -1) setDraft(draft.slice(0, at).trimEnd());
    closeMention();
    textareaRef.current?.focus();
  };

  const mentionMatches = FILES.filter(
    (f) => !context.includes(f) && f.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const meta = MODE_META[settings.mode];

  return (
    <div className="px-3 pb-3 pt-1">
      <motion.div
        layout
        className={cn(
          "relative rounded-2xl border bg-bg-2 transition-[border-color,box-shadow] duration-200",
          focused
            ? "border-accent-line shadow-[0_0_0_3px_rgb(var(--accent)/0.08),0_20px_50px_-30px_rgba(0,0,0,0.9)]"
            : "border-line-1 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]",
        )}
      >
        <div ref={mentionAnchor} className="relative flex flex-wrap items-center gap-1.5 px-3 pt-2.5">
          <Tooltip label="Add context" align="start">
            <button
              ref={mentionButton}
              type="button"
              aria-label="Add context"
              onClick={() => setMentionOpen((v) => !v)}
              className="focus-ring flex h-[22px] items-center gap-1 rounded-md border border-dashed border-line-2 px-1.5 text-[11px] text-fg-2 hover:border-fg-3 hover:text-fg-0"
            >
              <AtSign size={11} />
              {context.length === 0 && "Add context"}
            </button>
          </Tooltip>
          <AnimatePresence initial={false}>
            {context.map((item) => (
              <motion.span
                key={item}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 600, damping: 36 }}
                className="group flex h-[22px] items-center gap-1 rounded-md border border-line-1 bg-bg-3 pl-1.5 pr-1 text-[11px] text-fg-1"
              >
                <FileCode2 size={11} className="text-fg-3" />
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => removeContext(item)}
                  className="rounded p-px text-fg-3 hover:bg-bg-4 hover:text-fg-0"
                >
                  <X size={10} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          <Popover
            open={mentionOpen}
            onClose={closeMention}
            anchorRef={mentionAnchor}
            returnFocusRef={textareaRef}
            side="bottom"
            label="Add context"
            className="w-[240px] p-1"
          >
            <div className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-fg-3">
              Files {mentionQuery && `· “${mentionQuery}”`}
            </div>
            {mentionMatches.length === 0 && (
              <p className="px-2 pb-2 text-[12px] text-fg-3">Nothing matches.</p>
            )}
            {mentionMatches.slice(0, 6).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => pickFile(f)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-fg-1 hover:bg-bg-4 hover:text-fg-0"
              >
                <FileCode2 size={12} className="text-fg-3" />
                {f}
              </button>
            ))}
          </Popover>
        </div>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={meta.placeholder}
          rows={1}
          aria-label="Message"
          className="block w-full resize-none bg-transparent px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-fg-0 placeholder:text-fg-3 focus:outline-none"
        />

        <div className="flex items-center gap-1.5 px-2 pb-2">
          <ModeSwitch />
          <ModelPicker />
          <div className="ml-auto flex items-center gap-1.5">
            <EffortControl />
            <FastToggle />
            <SendButton />
          </div>
        </div>
      </motion.div>
      <p className="mt-1.5 flex items-center justify-between px-1 text-[10.5px] text-fg-3">
        <span>{meta.description}</span>
        <span>
          <kbd className="font-sans">⇧↵</kbd> newline
        </span>
      </p>
    </div>
  );
}
