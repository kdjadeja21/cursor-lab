"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ModeSelector from "@/components/agent/ModeSelector";
import ModelPicker from "@/components/agent/ModelPicker";
import FastToggle from "@/components/agent/FastToggle";
import EffortControl from "@/components/agent/EffortControl";
import ChatMessage from "@/components/agent/ChatMessage";
import LoadingState from "@/components/agent/LoadingState";
import Composer from "@/components/agent/Composer";
import CursorLogo from "@/components/agent/logos/CursorLogo";
import {
  EFFORTS,
  MODELS,
  type AgentMode,
  type EffortLevel,
} from "@/lib/models";
import type { ChatMessageData } from "@/lib/chat";
import { uid } from "@/lib/chat";
import { mockReply, thinkingStages, withIds } from "@/lib/mock";

const SUGGESTIONS = [
  { title: "Refactor the composer", sub: "Extract + autosize + Enter-to-send" },
  { title: "Plan a settings page", sub: "Propose steps before editing" },
  { title: "Explain this codebase", sub: "Ask mode · no edits made" },
];

export default function Home() {
  const [mode, setMode] = useState<AgentMode>("agent");
  const [modelId, setModelId] = useState("auto");
  const [effort, setEffort] = useState<EffortLevel>(2);
  const [fast, setFast] = useState(true);
  const [effortOpen, setEffortOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [stages, setStages] = useState<string[]>([]);
  const [stageIndex, setStageIndex] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const model = useMemo(
    () => MODELS.find((m) => m.id === modelId) ?? MODELS[0],
    [modelId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, stageIndex]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const handleStop = () => {
    clearAll();
    setBusy(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming ? { ...m, streaming: false } : m,
      ),
    );
  };

  const handleNewChat = () => {
    clearAll();
    setBusy(false);
    setMessages([]);
    setInput("");
  };

  const handleSend = (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || busy) return;

    const userMsg: ChatMessageData = {
      id: uid(),
      role: "user",
      text,
      mode: mode[0].toUpperCase() + mode.slice(1),
      modelName: model.name,
      effortLabel: `${EFFORTS[effort].label}${fast ? " · Fast" : ""}`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    const runStages = thinkingStages(mode, effort, fast);
    setStages(runStages);
    setStageIndex(0);

    const stageMs = fast ? 520 : 800;
    runStages.forEach((_, i) => {
      later(() => setStageIndex(i), i * stageMs);
    });

    const thinkTotal = runStages.length * stageMs + 350;
    const reply = mockReply({
      prompt: text,
      mode,
      modelName: model.name,
      effort,
    });

    later(() => {
      const id = uid();
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant",
          text: "",
          streaming: true,
          modelName: model.name,
          effortLabel: `${EFFORTS[effort].label}${fast ? " · Fast" : ""}`,
          tools: withIds(reply.tools, 0),
        },
      ]);

      // stream body text
      const full = reply.body;
      const chunk = fast ? 6 : 3;
      let n = 0;
      const streamMs = fast ? 18 : 32;
      const tick = () => {
        n = Math.min(full.length, n + chunk);
        const slice = full.slice(0, n);
        const doneCount =
          n > full.length * 0.66
            ? reply.tools.length
            : n > full.length * 0.33
              ? Math.max(1, reply.tools.length - 1)
              : 0;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, text: slice, tools: withIds(reply.tools, doneCount) }
              : m,
          ),
        );
        if (n < full.length) {
          timers.current.push(setTimeout(tick, streamMs));
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    streaming: false,
                    code: reply.code,
                    tools: withIds(reply.tools, reply.tools.length),
                  }
                : m,
            ),
          );
          setBusy(false);
        }
      };
      timers.current.push(setTimeout(tick, 250));
    }, thinkTotal);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#08090c]" />
        <div className="animate-glow absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-180px] left-[8%] h-[320px] w-[420px] rounded-full bg-[#3b3f52]/25 blur-[110px]" />
        <div className="absolute right-[6%] bottom-[10%] h-[260px] w-[300px] rounded-full bg-[#1d2b4a]/40 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* pane */}
      <div className="relative flex h-[min(800px,calc(100vh-64px))] w-full max-w-[472px] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#101116]/95 shadow-[0_40px_120px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* header */}
        <header className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
          <span className="flex gap-1.5">
            <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
          </span>
          <span className="mx-1 h-4 w-px bg-white/10" />
          <CursorLogo size={20} spinning={busy} />
          <h1 className="text-[13.5px] font-semibold tracking-tight text-white">
            Agent
          </h1>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-px font-mono text-[10px] text-white/45">
            main
          </span>
          <span className="ml-auto flex items-center gap-1">
            <button
              onClick={handleNewChat}
              title="New chat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <button
              title="History"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M4 5v5h5M4.5 10a8 8 0 1 1-.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <button
              title="Share"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V4m0 0L8 8m4-4l4 4M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </span>
        </header>

        {/* toolbar */}
        <div className="space-y-2 border-b border-white/8 px-3.5 py-3">
          <ModeSelector mode={mode} onChange={setMode} />
          <div className="flex items-stretch gap-2">
            <ModelPicker model={model} onChange={(m) => setModelId(m.id)} />
            <FastToggle fast={fast} onChange={setFast} />
          </div>
        </div>

        {/* chat */}
        <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto px-3.5 py-4">
          {messages.length === 0 && !busy ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="relative inline-flex">
                <span className="animate-ring-ping absolute inset-0 rounded-2xl bg-white/15" />
                <CursorLogo size={52} />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-white">
                What should we build?
              </h2>
              <p className="mt-1 max-w-[300px] text-[12.5px] leading-relaxed text-white/45">
                {mode === "agent"
                  ? "Agent edits code, runs commands and verifies the diff."
                  : mode === "plan"
                    ? "Plan explores first and proposes steps for approval."
                    : "Ask answers from your codebase without editing."}{" "}
                Pick a model, dial effort, toggle Fast.
              </p>
              <div className="mt-5 w-full space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => handleSend(s.title)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8 text-white/60 transition group-hover:bg-white/15 group-hover:text-white">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-[12.5px] font-medium text-white/85">
                        {s.title}
                      </span>
                      <span className="block text-[11px] text-white/40">{s.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <ChatMessage key={m.id} msg={m} />
              ))}
              {busy &&
                !messages.some((m) => m.streaming) && (
                  <LoadingState
                    stages={stages}
                    stageIndex={stageIndex}
                    modelName={model.name}
                  />
                )}
            </div>
          )}
        </div>

        {/* footer: effort + composer */}
        <div className="space-y-2 border-t border-white/8 bg-[#0d0e12]/80 px-3.5 py-3">
          {busy && (
            <button
              onClick={handleStop}
              className="animate-pop flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] py-1.5 text-[12px] font-medium text-white/80 transition hover:bg-white/10"
            >
              <span className="h-2.5 w-2.5 rounded-[3px] bg-white" />
              Stop generating
            </button>
          )}
          <EffortControl
            effort={effort}
            fast={fast}
            onChange={setEffort}
            collapsed={!effortOpen}
            onToggleCollapse={() => setEffortOpen((v) => !v)}
          />
          <Composer
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            sending={busy}
          />
        </div>
      </div>

      <p className="absolute bottom-4 hidden text-[11px] text-white/30 md:block">
        Interactive prototype · fully frontend — responses are simulated
      </p>
    </div>
  );
}
