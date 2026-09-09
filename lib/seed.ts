import type { Chat } from "@/lib/types"

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export const SUGGESTIONS = [
  "Redesign how effort and Fast are selected",
  "Why does the model chip say High Fast?",
  "Plan a calmer composer for Plan vs Ask",
  "Debug the collapsed picker hiding Grok",
]

export function titleFromPrompt(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, " ")
  if (trimmed.length <= 42) return trimmed
  return `${trimmed.slice(0, 42)}…`
}

export const SEED_CHAT: Chat = {
  id: "chat-seed-composer",
  title: "Redesign the agent composer",
  mode: "agent",
  modelId: "composer-2.5",
  effort: "high",
  fast: false,
  updatedAt: Date.now() - 1000 * 60 * 12,
  messages: [
    {
      id: "m-seed-user",
      role: "user",
      content:
        "The composer hides effort and Fast behind hover → Edit, and the chip sometimes shows “High Fast” instead of the model. Redesign it so mode, model, effort, and Fast are obvious.",
    },
    {
      id: "m-seed-assistant",
      role: "assistant",
      status: "done",
      thinking:
        "Mode, model, effort, and Fast are four axes. They should not share one collapsed label. Keep the Cursor cube as the loading language.",
      todos: [
        { id: "s1", label: "Segmented mode control", done: true },
        { id: "s2", label: "Logo + model name always visible", done: true },
        { id: "s3", label: "Effort rail with hold-to-charge", done: true },
      ],
      tools: [
        {
          id: "seed-read",
          kind: "read",
          title: "Read composer.tsx",
          detail: "Toolbar is one overloaded dropdown",
          status: "done",
        },
        {
          id: "seed-edit",
          kind: "edit",
          title: "Edit composer.tsx",
          detail: "First-class mode, model, effort, Fast",
          status: "done",
          diff: {
            file: "components/agent-window/composer.tsx",
            removed: "  <OptionsMenu />",
            added: "  <EffortControl />\n  <FastToggle />",
          },
        },
      ],
      content:
        "Split the composer into four controls. The model chip always keeps its logo and name. Effort is a cube you drag or hold. Fast is a lightning toggle. Loading is the Cursor cube — breathing when idle, orbiting while it thinks, pulsing as tokens land.",
    },
  ],
}
