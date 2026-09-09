export type AgentMode = "agent" | "plan" | "ask" | "debug"

export type EffortLevel = "low" | "medium" | "high" | "extra-high" | "max"

export type ModelId =
  | "composer-2.5"
  | "claude-opus-5"
  | "claude-sonnet-5"
  | "gpt-5.6"
  | "gemini-3.8"
  | "grok-4.6"

export type ToolKind = "read" | "edit" | "terminal" | "search"

export type ToolCall = {
  id: string
  kind: ToolKind
  title: string
  detail?: string
  status: "running" | "done"
  diff?: { file: string; removed: string; added: string }
}

export type PlanDoc = {
  title: string
  summary: string
  steps: { title: string; detail: string }[]
  built?: boolean
}

export type Citation = {
  file: string
  lines?: string
}

export type TodoItem = {
  id: string
  label: string
  done: boolean
}

export type DebugHypothesis = {
  title: string
  likelihood: "high" | "medium" | "low"
  detail: string
}

export type MessageStatus = "thinking" | "streaming" | "done" | "stopped"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  tools?: ToolCall[]
  plan?: PlanDoc
  citations?: Citation[]
  todos?: TodoItem[]
  hypotheses?: DebugHypothesis[]
  status?: MessageStatus
}

export type Chat = {
  id: string
  title: string
  mode: AgentMode
  modelId: ModelId
  effort: EffortLevel
  fast: boolean
  messages: ChatMessage[]
  updatedAt: number
}

export const EFFORT_LEVELS: EffortLevel[] = [
  "low",
  "medium",
  "high",
  "extra-high",
  "max",
]

export const EFFORT_LABEL: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  "extra-high": "Extra High",
  max: "Max",
}

export const MODE_ORDER: AgentMode[] = ["agent", "plan", "ask", "debug"]

export const MODE_META: Record<
  AgentMode,
  { label: string; hint: string; kicker: string }
> = {
  agent: {
    label: "Agent",
    hint: "Edit files, run commands, ship the change",
    kicker: "Can write code",
  },
  plan: {
    label: "Plan",
    hint: "Research first, then a reviewable plan",
    kicker: "Review before build",
  },
  ask: {
    label: "Ask",
    hint: "Read-only answers from the codebase",
    kicker: "No edits",
  },
  debug: {
    label: "Debug",
    hint: "Hypotheses and runtime evidence",
    kicker: "Investigate",
  },
}
