"use client"

import { ChatThread } from "@/components/agent-window/chat-thread"
import { Composer } from "@/components/agent-window/composer"
import { CursorLogo, CursorMark } from "@/components/agent-window/cursor-logo"
import { Sidebar } from "@/components/agent-window/sidebar"
import { applyMockEvent, runMockAgent } from "@/lib/mock-agent"
import { createId, SEED_CHAT, SUGGESTIONS, titleFromPrompt } from "@/lib/seed"
import {
  EFFORT_LEVELS,
  MODE_META,
  MODE_ORDER,
  type AgentMode,
  type Chat,
  type ChatMessage,
  type EffortLevel,
  type ModelId,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { PanelLeft, Plus } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Draft = {
  mode: AgentMode
  modelId: ModelId
  effort: EffortLevel
  fast: boolean
}

const INITIAL_DRAFT: Draft = {
  mode: "agent",
  modelId: "composer-2.5",
  effort: "high",
  fast: false,
}

export function AgentsWindow() {
  const [chats, setChats] = useState<Chat[]>([SEED_CHAT])
  const [activeId, setActiveId] = useState<string | null>(SEED_CHAT.id)
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT)
  const [input, setInput] = useState("")
  const [running, setRunning] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const runTarget = useRef<{ chatId: string; messageId: string } | null>(null)

  const active = useMemo(
    () => chats.find((chat) => chat.id === activeId) ?? null,
    [chats, activeId]
  )

  const settings = active
    ? {
        mode: active.mode,
        modelId: active.modelId,
        effort: active.effort,
        fast: active.fast,
      }
    : draft

  const patchActive = useCallback(
    (patch: Partial<Chat> | ((chat: Chat) => Chat)) => {
      if (!activeId) {
        if (typeof patch !== "function") {
          setDraft((current) => ({
            mode: patch.mode ?? current.mode,
            modelId: patch.modelId ?? current.modelId,
            effort: patch.effort ?? current.effort,
            fast: patch.fast ?? current.fast,
          }))
        }
        return
      }
      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== activeId) return chat
          return typeof patch === "function" ? patch(chat) : { ...chat, ...patch }
        })
      )
    },
    [activeId]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setRunning(false)
    const target = runTarget.current
    if (!target) return
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== target.chatId) return chat
        return {
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === target.messageId && message.status !== "done"
              ? { ...message, status: "stopped" as const }
              : message
          ),
        }
      })
    )
  }, [])

  const runOnChat = useCallback(
    async (chatId: string, assistantId: string, prompt: string, next: Draft) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      runTarget.current = { chatId, messageId: assistantId }
      setRunning(true)
      try {
        await runMockAgent({
          prompt,
          mode: next.mode,
          effort: next.effort,
          fast: next.fast,
          signal: controller.signal,
          onEvent: (event) => {
            setChats((current) =>
              current.map((chat) => {
                if (chat.id !== chatId) return chat
                return {
                  ...chat,
                  updatedAt: Date.now(),
                  messages: chat.messages.map((message) =>
                    message.id === assistantId ? applyMockEvent(message, event) : message
                  ),
                }
              })
            )
          },
        })
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setRunning(false)
          runTarget.current = null
        }
      }
    },
    []
  )

  const send = useCallback(
    (raw?: string) => {
      const prompt = (raw ?? input).trim()
      if (!prompt || running) return

      const user: ChatMessage = { id: createId("user"), role: "user", content: prompt }
      const assistant: ChatMessage = {
        id: createId("asst"),
        role: "assistant",
        content: "",
        status: "thinking",
      }

      if (!active) {
        const chat: Chat = {
          id: createId("chat"),
          title: titleFromPrompt(prompt),
          ...draft,
          messages: [user, assistant],
          updatedAt: Date.now(),
        }
        setChats((current) => [chat, ...current])
        setActiveId(chat.id)
        setInput("")
        void runOnChat(chat.id, assistant.id, prompt, draft)
        return
      }

      const next: Draft = {
        mode: active.mode,
        modelId: active.modelId,
        effort: active.effort,
        fast: active.fast,
      }
      setChats((current) =>
        current.map((chat) =>
          chat.id === active.id
            ? {
                ...chat,
                title: chat.messages.length ? chat.title : titleFromPrompt(prompt),
                messages: [...chat.messages, user, assistant],
                updatedAt: Date.now(),
              }
            : chat
        )
      )
      setInput("")
      void runOnChat(active.id, assistant.id, prompt, next)
    },
    [active, draft, input, runOnChat, running]
  )

  const buildPlan = useCallback(
    (messageId: string) => {
      if (!active || running) return
      const prompt = "Build this plan."
      const user: ChatMessage = { id: createId("user"), role: "user", content: prompt }
      const assistant: ChatMessage = {
        id: createId("asst"),
        role: "assistant",
        content: "",
        status: "thinking",
      }
      const next: Draft = {
        mode: "agent",
        modelId: active.modelId,
        effort: active.effort,
        fast: active.fast,
      }
      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== active.id) return chat
          return {
            ...chat,
            mode: "agent",
            updatedAt: Date.now(),
            messages: [
              ...chat.messages.map((message) =>
                message.id === messageId && message.plan
                  ? { ...message, plan: { ...message.plan, built: true } }
                  : message
              ),
              user,
              assistant,
            ],
          }
        })
      )
      void runOnChat(active.id, assistant.id, prompt, next)
    },
    [active, runOnChat, running]
  )

  const newChat = useCallback(() => {
    if (running) stop()
    setDraft(
      active
        ? {
            mode: active.mode,
            modelId: active.modelId,
            effort: active.effort,
            fast: active.fast,
          }
        : INITIAL_DRAFT
    )
    setActiveId(null)
    setInput("")
  }, [active, running, stop])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault()
        const order = MODE_ORDER
        const idx = order.indexOf(settings.mode)
        const next = order[(idx + 1) % order.length]
        patchActive({ mode: next })
        return
      }
      if (meta && event.key === "/") {
        event.preventDefault()
        setModelOpen((open) => !open)
        return
      }
      if (event.ctrlKey && event.shiftKey && event.key === "/") {
        event.preventDefault()
        patchActive({ fast: !settings.fast })
        return
      }
      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault()
        const idx = EFFORT_LEVELS.indexOf(settings.effort)
        const nextIdx =
          event.key === "ArrowUp"
            ? Math.min(EFFORT_LEVELS.length - 1, idx + 1)
            : Math.max(0, idx - 1)
        patchActive({ effort: EFFORT_LEVELS[nextIdx] })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [patchActive, settings.effort, settings.fast, settings.mode])

  return (
    <div className="flex h-svh min-h-0 flex-col bg-[#0c0c0c] text-zinc-100">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-white/6 px-3">
        <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-zinc-100 md:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <CursorMark className="size-3.5" />
          Agents
        </div>
        <span className="hidden text-[12px] text-zinc-500 sm:inline">
          {MODE_META[settings.mode].hint}
        </span>
        <button
          type="button"
          onClick={newChat}
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-zinc-300 hover:bg-white/5"
        >
          <Plus className="size-3.5" />
          New agent
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <aside
          className={cn(
            "w-[252px] shrink-0 border-r border-white/6",
            sidebarOpen ? "flex" : "hidden",
            "max-md:absolute max-md:inset-y-11 max-md:left-0 max-md:z-20 max-md:shadow-2xl",
            "md:flex"
          )}
        >
          <Sidebar
            chats={chats}
            activeId={activeId}
            onSelect={(id) => {
              if (running) stop()
              setActiveId(id)
              setSidebarOpen(false)
            }}
            onNew={newChat}
          />
        </aside>
        {sidebarOpen ? (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-black/50 md:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col">
          {active && active.messages.length ? (
            <ChatThread
              messages={active.messages}
              effort={active.effort}
              fast={active.fast}
              onBuildPlan={buildPlan}
            />
          ) : (
            <EmptyState
              mode={settings.mode}
              onPrompt={(prompt) => send(prompt)}
            />
          )}
          <div className="flex justify-center">
            <Composer
              mode={settings.mode}
              modelId={settings.modelId}
              effort={settings.effort}
              fast={settings.fast}
              value={input}
              running={running}
              modelOpen={modelOpen}
              onModeChange={(mode) => patchActive({ mode })}
              onModelChange={(modelId) => patchActive({ modelId })}
              onEffortChange={(effort) => patchActive({ effort })}
              onFastChange={(fast) => patchActive({ fast })}
              onChange={setInput}
              onSubmit={() => send()}
              onStop={stop}
              onModelOpenChange={setModelOpen}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function EmptyState({
  mode,
  onPrompt,
}: {
  mode: AgentMode
  onPrompt: (prompt: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <CursorLogo size={88} form="cube" motion="idle" intensity={3} />
      <h1 className="mt-8 text-center text-[28px] font-medium tracking-tight text-zinc-50">
        Plan, ask, or build anything
      </h1>
      <p className="mt-2 max-w-md text-center text-[14px] leading-6 text-zinc-500">
        {MODE_META[mode].hint}. The cube is the loading language — idle, thinking,
        streaming, charging effort.
      </p>
      <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPrompt(suggestion)}
            className="rounded-full bg-white/4 px-3 py-1.5 text-[12px] text-zinc-300 ring-1 ring-white/8 transition hover:bg-white/8 hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
