import type {
  AgentMode,
  ChatMessage,
  DebugHypothesis,
  EffortLevel,
  PlanDoc,
  TodoItem,
  ToolCall,
} from "@/lib/types"

export type MockEvent =
  | { type: "thinking"; text: string }
  | { type: "tool"; tool: ToolCall }
  | { type: "tool-update"; id: string; patch: Partial<ToolCall> }
  | { type: "todos"; todos: TodoItem[] }
  | { type: "text"; delta: string }
  | { type: "plan"; plan: PlanDoc }
  | { type: "citations"; citations: { file: string; lines?: string }[] }
  | { type: "hypotheses"; hypotheses: DebugHypothesis[] }
  | { type: "done" }

const THINK_MS: Record<EffortLevel, number> = {
  low: 420,
  medium: 780,
  high: 1260,
  "extra-high": 1880,
  max: 2460,
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const timer = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

async function streamWords(
  text: string,
  fast: boolean,
  signal: AbortSignal,
  onDelta: (delta: string) => void
) {
  const parts = text.split(/(\s+)/)
  for (const part of parts) {
    onDelta(part)
    await wait(fast ? 8 : 16, signal)
  }
}

function thinkingFor(mode: AgentMode, effort: EffortLevel, prompt: string) {
  const depth =
    effort === "low"
      ? "Stay tight — smallest change that answers this."
      : effort === "max" || effort === "extra-high"
        ? "Go deep: map the architecture, consider edge cases, then act."
        : "Read the relevant surface, then move."

  const byMode: Record<AgentMode, string> = {
    agent: `${depth}\nThe user asked: “${prompt.slice(0, 140)}”. I’ll inspect the composer and thread, then edit.`,
    plan: `${depth}\nThis should be a reviewable plan, not a diff yet. Research first.`,
    ask: `${depth}\nRead-only. Cite files. Do not propose edits as if they were applied.`,
    debug: `${depth}\nForm hypotheses, look for a reproduction path, then instrument.`,
  }
  return byMode[mode]
}

function agentScript(prompt: string, effort: EffortLevel) {
  const rich = effort === "high" || effort === "extra-high" || effort === "max"
  const todos: TodoItem[] = rich
    ? [
        { id: "t1", label: "Inspect composer controls", done: false },
        { id: "t2", label: "Surface effort and Fast", done: false },
        { id: "t3", label: "Wire mock stream intensity", done: false },
      ]
    : []

  const tools: Omit<ToolCall, "status">[] = [
    {
      id: uid("read"),
      kind: "read",
      title: "Read components/agent-window/composer.tsx",
      detail: "68 lines",
    },
    {
      id: uid("read"),
      kind: "search",
      title: "Search effort Fast mode picker",
      detail: "12 results",
    },
  ]

  if (rich) {
    tools.push({
      id: uid("edit"),
      kind: "edit",
      title: "Edit composer.tsx",
      detail: "Promote effort + Fast to first-class controls",
      diff: {
        file: "components/agent-window/composer.tsx",
        removed: "  <ModelPicker />",
        added: "  <EffortControl />\n  <FastToggle />",
      },
    })
    tools.push({
      id: uid("term"),
      kind: "terminal",
      title: "npm run lint",
      detail: "exit 0",
    })
  }

  const answer = rich
    ? `Pulled effort and Fast out of the buried model submenu so the composer always shows **who is answering** and **how hard** it is thinking.\n\n- Mode is a sliding segmented control (Shift+Tab).\n- The model chip keeps the official logo + name — never “High Fast” alone.\n- Effort is a rail around the Cursor cube. Drag or hold to charge.\n- Fast is its own lightning toggle.\n\nAsked: “${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}”`
    : `Updated the composer so mode, model, effort, and Fast are separate controls. The cube still drives loading. For “${prompt.slice(0, 72)}”, that’s the smallest complete change.`

  return { todos, tools, answer }
}

function planDoc(prompt: string): PlanDoc {
  return {
    title: "Make the Agents Window feel like a product",
    summary: `A frontend-only redesign of mode, model, effort, and Fast — prompted by: “${prompt.slice(0, 100)}${prompt.length > 100 ? "…" : ""}”`,
    steps: [
      {
        title: "Treat mode as a stage, not a menu",
        detail:
          "Agent / Plan / Ask / Debug as a sliding segmented control. Each mode restyles the composer and the mock transcript.",
      },
      {
        title: "Keep the model identity visible",
        detail:
          "Searchable picker with official marks. Collapsed chip is always logo + name, with Fast as a sibling chip.",
      },
      {
        title: "Make effort physical",
        detail:
          "Five-level rail. Drag the cube or hold to charge. Orbit rings and think-time scale with intensity.",
      },
      {
        title: "Let Fast be obvious",
        detail:
          "A lightning toggle in the composer, independent of effort. Shorter mock latency when on.",
      },
    ],
  }
}

function askAnswer(prompt: string) {
  return `**Ask mode is read-only.** Effort and Fast are independent axes from the model: effort is how long the cube thinks, Fast is latency of the same weights.\n\nIn the current picker, those knobs used to hide behind hover → Edit, so the chip collapsed to “High Fast” and you lost the model name. The redesign keeps:\n\n1. Mode — what the agent is allowed to touch\n2. Model — who is answering (logo always shown)\n3. Effort — how hard it thinks\n4. Fast — how quickly tokens arrive\n\nYour question: “${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}”`
}

function debugPack(prompt: string): {
  hypotheses: DebugHypothesis[]
  answer: string
} {
  return {
    hypotheses: [
      {
        title: "Collapsed picker overwrites the model label",
        likelihood: "high",
        detail:
          "When effort + Fast are encoded in the same chip, the model name loses the layout slot.",
      },
      {
        title: "Fast defaulting on new chats",
        likelihood: "medium",
        detail:
          "New threads inherit Fast=on from Composer defaults, looking like a sticky bug.",
      },
      {
        title: "Hold-to-charge vs click-to-open collision",
        likelihood: "low",
        detail:
          "If both live on the same hit target, short clicks never open the rail.",
      },
    ],
    answer: `Reproduced a display gap: the composer chip can show effort/Fast without the model identity. Fix is three controls, not one overloaded label.\n\nPrompt: “${prompt.slice(0, 100)}${prompt.length > 100 ? "…" : ""}”`,
  }
}

export async function runMockAgent(input: {
  prompt: string
  mode: AgentMode
  effort: EffortLevel
  fast: boolean
  signal: AbortSignal
  onEvent: (event: MockEvent) => void
}) {
  const { prompt, mode, effort, fast, signal, onEvent } = input
  const thinkMs = Math.round(THINK_MS[effort] * (fast ? 0.42 : 1))

  onEvent({ type: "thinking", text: thinkingFor(mode, effort, prompt) })
  await wait(thinkMs, signal)

  if (mode === "ask") {
    onEvent({
      type: "tool",
      tool: {
        id: uid("read"),
        kind: "read",
        title: "Read lib/types.ts",
        detail: "Mode · effort · Fast",
        status: "running",
      },
    })
    await wait(fast ? 180 : 360, signal)
    onEvent({
      type: "citations",
      citations: [
        { file: "components/agent-window/composer.tsx", lines: "1–80" },
        { file: "components/agent-window/effort-control.tsx" },
        { file: "lib/types.ts", lines: "1–40" },
      ],
    })
    await streamWords(askAnswer(prompt), fast, signal, (delta) =>
      onEvent({ type: "text", delta })
    )
    onEvent({ type: "done" })
    return
  }

  if (mode === "plan") {
    onEvent({
      type: "tool",
      tool: {
        id: uid("search"),
        kind: "search",
        title: "Explore agent window surfaces",
        detail: "composer, picker, thread",
        status: "running",
      },
    })
    await wait(fast ? 220 : 480, signal)
    onEvent({ type: "plan", plan: planDoc(prompt) })
    await streamWords(
      "Researched the composer. Here’s a plan you can edit before anything is written.",
      fast,
      signal,
      (delta) => onEvent({ type: "text", delta })
    )
    onEvent({ type: "done" })
    return
  }

  if (mode === "debug") {
    onEvent({
      type: "tool",
      tool: {
        id: uid("term"),
        kind: "terminal",
        title: "Reproduce picker collapse",
        detail: "watching composer chip",
        status: "running",
      },
    })
    await wait(fast ? 260 : 520, signal)
    const pack = debugPack(prompt)
    onEvent({ type: "hypotheses", hypotheses: pack.hypotheses })
    await streamWords(pack.answer, fast, signal, (delta) =>
      onEvent({ type: "text", delta })
    )
    onEvent({ type: "done" })
    return
  }

  const script = agentScript(prompt, effort)
  if (script.todos.length) {
    onEvent({ type: "todos", todos: script.todos })
  }

  for (const [index, tool] of script.tools.entries()) {
    onEvent({ type: "tool", tool: { ...tool, status: "running" } })
    await wait(fast ? 160 : 320 + index * 40, signal)
    onEvent({
      type: "tool-update",
      id: tool.id,
      patch: { status: "done" },
    })
    if (script.todos.length) {
      onEvent({
        type: "todos",
        todos: script.todos.map((todo, todoIndex) => ({
          ...todo,
          done: todoIndex <= index,
        })),
      })
    }
  }

  await streamWords(script.answer, fast, signal, (delta) =>
    onEvent({ type: "text", delta })
  )
  onEvent({ type: "done" })
}

export function applyMockEvent(
  message: ChatMessage,
  event: MockEvent
): ChatMessage {
  switch (event.type) {
    case "thinking":
      return { ...message, thinking: event.text, status: "thinking" }
    case "tool":
      return {
        ...message,
        status: "streaming",
        tools: [...(message.tools ?? []), event.tool],
      }
    case "tool-update":
      return {
        ...message,
        tools: (message.tools ?? []).map((tool) =>
          tool.id === event.id ? { ...tool, ...event.patch } : tool
        ),
      }
    case "todos":
      return { ...message, todos: event.todos, status: "streaming" }
    case "text":
      return {
        ...message,
        content: message.content + event.delta,
        status: "streaming",
      }
    case "plan":
      return { ...message, plan: event.plan, status: "streaming" }
    case "citations":
      return { ...message, citations: event.citations, status: "streaming" }
    case "hypotheses":
      return { ...message, hypotheses: event.hypotheses, status: "streaming" }
    case "done":
      return { ...message, status: "done" }
  }
}
