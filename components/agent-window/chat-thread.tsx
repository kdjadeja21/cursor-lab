"use client"

import { CursorLogo } from "@/components/agent-window/cursor-logo"
import { Button } from "@/components/ui/button"
import type {
  ChatMessage,
  DebugHypothesis,
  EffortLevel,
  PlanDoc,
  ToolCall,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  FileText,
  ListTodo,
  Search,
  SquarePen,
  Terminal,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

const TOOL_ICON = {
  read: FileText,
  edit: SquarePen,
  terminal: Terminal,
  search: Search,
} as const

export function ChatThread({
  messages,
  effort,
  fast,
  onBuildPlan,
}: {
  messages: ChatMessage[]
  effort: EffortLevel
  fast: boolean
  onBuildPlan: (messageId: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [stick, setStick] = useState(true)

  useEffect(() => {
    if (!stick) return
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, stick])

  return (
    <div
      ref={scrollerRef}
      className="relative min-h-0 flex-1 overflow-y-auto"
      onScroll={(event) => {
        const el = event.currentTarget
        setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        {messages.map((message) =>
          message.role === "user" ? (
            <UserBubble key={message.id} text={message.content} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              effort={effort}
              fast={fast}
              onBuild={() => onBuildPlan(message.id)}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>
      <AnimatePresence>
        {!stick ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              setStick(true)
              bottomRef.current?.scrollIntoView({ behavior: "smooth" })
            }}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-zinc-900 px-3 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10"
          >
            <ChevronDown className="size-3" />
            Jump to latest
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl bg-zinc-800/90 px-3.5 py-2.5 text-[14px] leading-6 text-zinc-100 ring-1 ring-white/6">
        {text}
      </div>
    </div>
  )
}

function AssistantMessage({
  message,
  effort,
  fast,
  onBuild,
}: {
  message: ChatMessage
  effort: EffortLevel
  fast: boolean
  onBuild: () => void
}) {
  const busy = message.status === "thinking" || message.status === "streaming"
  const intensity =
    effort === "low" ? 1 : effort === "medium" ? 2 : effort === "high" ? 3 : 4
  const cubeMotion =
    message.status === "thinking"
      ? "think"
      : message.status === "streaming"
        ? "stream"
        : "idle"

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <CursorLogo
          size={28}
          form="cube"
          motion={fast && busy ? "stream" : cubeMotion}
          intensity={busy ? intensity : 0}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {message.thinking ? (
          <ThinkingBlock text={message.thinking} active={message.status === "thinking"} />
        ) : null}
        {message.todos?.length ? <TodoList items={message.todos} /> : null}
        {message.tools?.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
        {message.hypotheses?.length ? <HypothesisList items={message.hypotheses} /> : null}
        {message.plan ? (
          <PlanCard plan={message.plan} onBuild={onBuild} />
        ) : null}
        {message.content ? <RichText text={message.content} /> : null}
        {message.citations?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {message.citations.map((citation) => (
              <span
                key={citation.file}
                className="rounded-md bg-white/4 px-2 py-1 font-mono text-[11px] text-zinc-400 ring-1 ring-white/8"
              >
                {citation.file}
                {citation.lines ? `:${citation.lines}` : ""}
              </span>
            ))}
          </div>
        ) : null}
        {message.status === "thinking" && !message.content ? (
          <p className="text-[13px] text-zinc-500">
            {fast ? "Thinking fast" : "Thinking"}
            <span className="ml-1 inline-flex gap-0.5">
              <span className="cursor-dot" />
              <span className="cursor-dot" />
              <span className="cursor-dot" />
            </span>
          </p>
        ) : null}
        {message.status === "stopped" ? (
          <p className="text-[12px] text-zinc-500">Stopped</p>
        ) : null}
      </div>
    </div>
  )
}

function ThinkingBlock({ text, active }: { text: string; active: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-zinc-400"
      >
        <CursorLogo size={16} form="mark" motion={active ? "think" : "idle"} />
        <span className="flex-1">{active ? "Thinking" : "Thought"}</span>
        <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <p className="border-t border-white/6 px-3 py-2 text-[12px] leading-5 whitespace-pre-wrap text-zinc-500">
          {text}
        </p>
      ) : null}
    </div>
  )
}

function TodoList({ items }: { items: ChatMessage["todos"] }) {
  if (!items) return null
  return (
    <div className="space-y-1 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/6">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
        <ListTodo className="size-3" />
        Todos
      </p>
      {items.map((item) => (
        <p
          key={item.id}
          className={cn(
            "flex items-center gap-2 text-[13px]",
            item.done ? "text-zinc-500 line-through" : "text-zinc-200"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              item.done ? "bg-emerald-400" : "bg-zinc-500"
            )}
          />
          {item.label}
        </p>
      ))}
    </div>
  )
}

function ToolRow({ tool }: { tool: ToolCall }) {
  const Icon = TOOL_ICON[tool.kind]
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/6">
      <div className="flex items-center gap-2 text-[13px]">
        <Icon className="size-3.5 text-zinc-500" />
        <span className="font-medium text-zinc-200">{tool.title}</span>
        <span className="ml-auto font-mono text-[11px] text-zinc-500">
          {tool.status === "running" ? "running" : "done"}
        </span>
      </div>
      {tool.detail ? (
        <p className="mt-1 pl-6 font-mono text-[11px] text-zinc-500">{tool.detail}</p>
      ) : null}
      {tool.diff ? (
        <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] leading-5">
          <span className="text-zinc-500">{tool.diff.file}</span>
          {"\n"}
          <span className="text-red-300/90">- {tool.diff.removed}</span>
          {"\n"}
          <span className="text-emerald-300/90">+ {tool.diff.added}</span>
        </pre>
      ) : null}
    </div>
  )
}

function HypothesisList({ items }: { items: DebugHypothesis[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl bg-orange-400/6 px-3 py-2 ring-1 ring-orange-300/15"
        >
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-zinc-100">{item.title}</p>
            <span className="rounded-full bg-white/8 px-1.5 py-px text-[10px] tracking-wide text-orange-200 uppercase">
              {item.likelihood}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-zinc-400">{item.detail}</p>
        </div>
      ))}
    </div>
  )
}

function PlanCard({ plan, onBuild }: { plan: PlanDoc; onBuild: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-sky-400/6 ring-1 ring-sky-300/20">
      <div className="border-b border-sky-300/10 px-3 py-2">
        <p className="text-[11px] font-medium tracking-wide text-sky-200/80 uppercase">
          Plan
        </p>
        <p className="text-[14px] font-medium text-zinc-50">{plan.title}</p>
        <p className="mt-1 text-[12px] leading-5 text-zinc-400">{plan.summary}</p>
      </div>
      <ol className="space-y-2 px-3 py-3">
        {plan.steps.map((step, index) => (
          <li key={step.title} className="flex gap-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/8 text-[11px] text-zinc-300">
              {index + 1}
            </span>
            <div>
              <p className="text-[13px] font-medium text-zinc-100">{step.title}</p>
              <p className="text-[12px] leading-5 text-zinc-500">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="px-3 pb-3">
        <Button
          type="button"
          size="sm"
          disabled={plan.built}
          onClick={onBuild}
          className="rounded-full"
        >
          {plan.built ? "Building with Agent" : "Build with Agent"}
        </Button>
      </div>
    </div>
  )
}

function RichText({ text }: { text: string }) {
  const blocks = text.split("\n")
  return (
    <div className="space-y-2 text-[14px] leading-6 text-zinc-200">
      {blocks.map((line, index) => {
        if (!line) return <div key={index} className="h-2" />
        const bits = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={index}>
            {bits.map((bit, bitIndex) =>
              bit.startsWith("**") ? (
                <strong key={bitIndex} className="font-semibold text-zinc-50">
                  {bit.slice(2, -2)}
                </strong>
              ) : (
                <span key={bitIndex}>{bit}</span>
              )
            )}
          </p>
        )
      })}
    </div>
  )
}
