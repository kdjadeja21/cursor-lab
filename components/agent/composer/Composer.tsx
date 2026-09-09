"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp,
  AtSign,
  FileText,
  Folder,
  Image as ImageIcon,
  Paperclip,
  Slash,
  Square,
  X,
} from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { EffortDial } from "@/components/agent/composer/EffortDial";
import { FastToggle } from "@/components/agent/composer/FastToggle";
import { ModeRail } from "@/components/agent/composer/ModeRail";
import { ModelPicker } from "@/components/agent/composer/ModelPicker";
import { Kbd } from "@/components/ui/Kbd";
import { Tip } from "@/components/ui/Tip";
import { useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { REPO_ENTRIES, SLASH_COMMANDS } from "@/lib/files";
import { MODES, type ModeId } from "@/lib/modes";
import type { Attachment } from "@/lib/transcript";

export type ComposerHandle = {
  focus: () => void;
  openModelPicker: () => void;
  closeOverlays: () => boolean;
};

const PLACEHOLDER: Record<ModeId, string> = {
  agent: "Describe a change. @ for files, / for commands",
  plan: "What should we work out first?",
  ask: "Ask about this codebase",
  debug: "What's going wrong?",
};

const ENTRY_ICON = {
  file: FileText,
  folder: Folder,
  image: ImageIcon,
} as const;

export const Composer = forwardRef<ComposerHandle, { compact?: boolean }>(
  function Composer({ compact = false }, ref) {
    const { state, model, submit, stop, setMode, toggleFast, dropQueued } = useAgent();
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [menuIndex, setMenuIndex] = useState(0);
    const [effortPing, setEffortPing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const streaming = state.status === "streaming";
    const mode = MODES[state.mode];

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      openModelPicker: () => setPickerOpen(true),
      closeOverlays: () => {
        if (pickerOpen) {
          setPickerOpen(false);
          return true;
        }
        return false;
      },
    }));

    useLayoutEffect(() => {
      const node = textareaRef.current;
      if (node === null) return;
      node.style.height = "auto";
      node.style.height = `${Math.min(node.scrollHeight, 168)}px`;
    }, [value]);

    const mentionQuery = useMemo(() => {
      const match = /(?:^|\s)@([\w./()-]*)$/.exec(value);
      return match === null ? null : match[1].toLowerCase();
    }, [value]);

    const slashQuery = useMemo(() => {
      const match = /^\/([a-z]*)$/.exec(value);
      return match === null ? null : match[1].toLowerCase();
    }, [value]);

    const mentionMatches = useMemo(() => {
      if (mentionQuery === null) return [];
      return REPO_ENTRIES.filter((entry) =>
        entry.path.toLowerCase().includes(mentionQuery),
      ).slice(0, 6);
    }, [mentionQuery]);

    const slashMatches = useMemo(() => {
      if (slashQuery === null) return [];
      return SLASH_COMMANDS.filter((command) => command.name.startsWith(slashQuery));
    }, [slashQuery]);

    const menuOpen = mentionMatches.length > 0 || slashMatches.length > 0;
    const menuLength = mentionMatches.length + slashMatches.length;

    useEffect(() => {
      setMenuIndex(0);
    }, [mentionQuery, slashQuery]);

    function addAttachment(path: string, kind: Attachment["kind"]) {
      setAttachments((current) =>
        current.some((item) => item.name === path)
          ? current
          : [...current, { id: `${path}-${current.length}`, name: path, kind }],
      );
    }

    function insertMention(index: number) {
      const entry = mentionMatches[index];
      if (entry === undefined) return;
      setValue((current) => current.replace(/@([\w./()-]*)$/, `@${entry.path} `));
      addAttachment(entry.path, entry.kind === "image" ? "image" : entry.kind);
      textareaRef.current?.focus();
    }

    function runSlash(index: number) {
      const command = slashMatches[index];
      if (command === undefined) return;
      setValue("");
      const name: (typeof SLASH_COMMANDS)[number]["name"] = command.name;
      switch (name) {
        case "plan":
        case "agent":
        case "ask":
        case "debug":
          setMode(name);
          break;
        case "fast":
          toggleFast();
          break;
        case "effort":
          setEffortPing(true);
          window.setTimeout(() => setEffortPing(false), 1400);
          break;
        case "clear":
          window.dispatchEvent(new CustomEvent("agent-new-chat"));
          break;
        default: {
          const never: never = name;
          return never;
        }
      }
      textareaRef.current?.focus();
    }

    function send() {
      if (value.trim().length === 0) return;
      submit(value, attachments);
      setValue("");
      setAttachments([]);
    }

    return (
      <div className="relative px-3 pb-3">
        <AnimatePresence>
          {state.queue.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 space-y-1"
            >
              {state.queue.map((queued) => (
                <div
                  key={queued}
                  className="flex items-center gap-2 rounded-[9px] border border-line border-dashed bg-ink-850/60 px-2.5 py-1.5 text-[11.5px] text-fg-subtle"
                >
                  <span className="shrink-0 rounded-[5px] bg-ink-750 px-1.5 py-[1px] text-[9.5px] tracking-wide uppercase">
                    Queued
                  </span>
                  <span className="truncate">{queued}</span>
                  <button
                    type="button"
                    onClick={() => dropQueued(queued)}
                    aria-label="Remove queued message"
                    className="ml-auto text-fg-faint transition-colors hover:text-fg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          style={{ ["--accent" as string]: mode.accent }}
          className={cn(
            "relative rounded-panel border bg-linear-to-b from-ink-850/90 to-ink-900/90 transition-shadow duration-300",
            "border-line focus-within:border-[color-mix(in_oklab,var(--accent)_38%,transparent)]",
            "focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent)_22%,transparent),0_0_36px_-14px_var(--accent)]",
          )}
        >
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.985 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-full overflow-hidden rounded-panel border border-line bg-ink-850/95 p-1.5 shadow-[0_26px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl"
              >
                {mentionMatches.map((entry, index) => {
                  const Icon = ENTRY_ICON[entry.kind];
                  return (
                    <button
                      key={entry.path}
                      type="button"
                      onMouseMove={() => setMenuIndex(index)}
                      onClick={() => insertMention(index)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left transition-colors",
                        index === menuIndex ? "bg-ink-800" : "hover:bg-ink-800/60",
                      )}
                    >
                      <Icon size={13} className="text-fg-faint" />
                      <span className="flex-1 truncate font-mono text-[11.5px] text-fg-muted">
                        {entry.path}
                      </span>
                      <span className="text-[10px] text-fg-faint">{entry.hint}</span>
                    </button>
                  );
                })}
                {slashMatches.map((command, index) => (
                  <button
                    key={command.name}
                    type="button"
                    onMouseMove={() => setMenuIndex(index)}
                    onClick={() => runSlash(index)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left transition-colors",
                      index === menuIndex ? "bg-ink-800" : "hover:bg-ink-800/60",
                    )}
                  >
                    <Slash size={12} className="text-fg-faint" />
                    <span className="font-mono text-[11.5px] text-fg">/{command.name}</span>
                    <span className="flex-1 truncate text-[11px] text-fg-subtle">
                      {command.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {attachments.map((attachment) => {
                const Icon = ENTRY_ICON[attachment.kind];
                return (
                  <motion.span
                    key={attachment.id}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-ink-800 py-1 pr-1 pl-2 text-[11px] text-fg-muted"
                  >
                    <Icon size={11} className="text-fg-faint" />
                    <span className="max-w-[160px] truncate font-mono">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item.id !== attachment.id),
                        )
                      }
                      aria-label={`Remove ${attachment.name}`}
                      className="grid h-4 w-4 place-items-center rounded-full text-fg-faint transition-colors hover:bg-ink-700 hover:text-fg"
                    >
                      <X size={10} />
                    </button>
                  </motion.span>
                );
              })}
            </div>
          ) : null}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (menuOpen) {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setMenuIndex((index) => Math.min(index + 1, menuLength - 1));
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setMenuIndex((index) => Math.max(index - 1, 0));
                  return;
                }
                if (event.key === "Enter" || event.key === "Tab") {
                  event.preventDefault();
                  if (mentionMatches.length > 0) insertMention(menuIndex);
                  else runSlash(menuIndex);
                  return;
                }
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder={PLACEHOLDER[state.mode]}
            aria-label="Message the agent"
            className="scroll-thin block max-h-[168px] w-full resize-none bg-transparent px-3 py-3 text-[13px] leading-relaxed text-fg placeholder:text-fg-faint focus:outline-none"
          />

          <div className="flex items-end justify-between gap-2 px-2.5 pb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <ModeRail compact={compact} />
              <ModelPicker open={pickerOpen} onOpenChange={setPickerOpen} />
              <motion.span
                animate={
                  effortPing
                    ? { scale: [1, 1.06, 1], y: [0, -2, 0] }
                    : { scale: 1, y: 0 }
                }
                transition={{ duration: 0.5, repeat: effortPing ? 2 : 0 }}
              >
                <EffortDial />
              </motion.span>
              <FastToggle />
            </div>

            <div className="flex items-center gap-1">
              <Tip label="Add context" hint="Files, folders and images" side="top">
                <button
                  type="button"
                  onClick={() => {
                    setValue((current) => `${current}${current.endsWith(" ") || current.length === 0 ? "" : " "}@`);
                    textareaRef.current?.focus();
                  }}
                  aria-label="Add context"
                  className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-ink-800 hover:text-fg"
                >
                  <AtSign size={14} />
                </button>
              </Tip>
              <Tip label="Attach" hint="Screenshots and files" side="top">
                <button
                  type="button"
                  onClick={() => addAttachment("design/hover-jank.png", "image")}
                  aria-label="Attach a file"
                  className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-ink-800 hover:text-fg"
                >
                  <Paperclip size={14} />
                </button>
              </Tip>

              {streaming ? (
                <Tip label="Stop" keys={["Esc"]} side="top">
                  <button
                    type="button"
                    onClick={stop}
                    aria-label="Stop the run"
                    className="group relative grid h-8 w-8 place-items-center rounded-full border border-line-strong bg-ink-800"
                  >
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, transparent, ${mode.accent}88, transparent)`,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="absolute inset-[1.5px] rounded-full bg-ink-850" />
                    <Square
                      size={9}
                      className="relative text-fg"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </button>
                </Tip>
              ) : (
                <Tip
                  label={value.trim().length === 0 ? "Write something first" : "Send"}
                  keys={["↵"]}
                  side="top"
                >
                  <button
                    type="button"
                    onClick={send}
                    disabled={value.trim().length === 0}
                    aria-label="Send message"
                    style={{ ["--accent" as string]: mode.accent }}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full transition-all duration-200",
                      value.trim().length === 0
                        ? "bg-ink-800 text-fg-faint"
                        : "bg-[color-mix(in_oklab,var(--accent)_88%,white)] text-ink-1000 hover:scale-105 active:scale-95",
                    )}
                  >
                    <ArrowUp size={15} strokeWidth={2.6} />
                  </button>
                </Tip>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 px-1">
          {streaming ? (
            <>
              <CursorMark
                size={13}
                state="working"
                accent={mode.accent}
                speed={state.fast ? 1.9 : 1.1}
                glow
              />
              <span className="text-shimmer text-[11px] font-medium">
                {mode.name} is working
              </span>
              <span className="text-[11px] text-fg-faint">
                — press <Kbd keys={["↵"]} /> to queue a follow-up
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-fg-faint">{mode.summary}</span>
              <span className="text-ink-600">·</span>
              <span className="text-[11px] text-fg-faint">
                {model.name}
                {state.effort === null ? "" : ` at ${state.effort} effort`}
                {state.fast ? ", Fast" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    );
  },
);
