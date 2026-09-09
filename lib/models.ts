export type ProviderId =
  | "auto"
  | "composer"
  | "anthropic"
  | "openai"
  | "google"
  | "xai";

export type ModelTag = "fast" | "max" | "thinking" | "new" | null;

export interface AIModel {
  id: string;
  name: string;
  provider: ProviderId;
  group: string;
  tag: ModelTag;
  tagLabel?: string;
  description: string;
}

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  auto: "Auto",
  composer: "Composer",
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  xai: "xAI",
};

export const MODELS: AIModel[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "auto",
    group: "Recommended",
    tag: null,
    description: "Routes to the best model for each task",
  },
  {
    id: "composer-1",
    name: "Composer 1",
    provider: "composer",
    group: "Recommended",
    tag: "new",
    tagLabel: "New",
    description: "Cursor's agentic coding model",
  },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    group: "Anthropic",
    tag: "max",
    tagLabel: "Max",
    description: "Deepest reasoning for hard problems",
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    group: "Anthropic",
    tag: null,
    description: "Balanced speed and quality",
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    group: "Anthropic",
    tag: "fast",
    tagLabel: "Fast",
    description: "Quick edits and lookups",
  },
  {
    id: "gpt-5-2",
    name: "GPT-5.2",
    provider: "openai",
    group: "OpenAI",
    tag: "thinking",
    tagLabel: "Thinking",
    description: "Strong generalist with tools",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    group: "OpenAI",
    tag: "fast",
    tagLabel: "Fast",
    description: "Snappy for small tasks",
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "google",
    group: "Google",
    tag: null,
    description: "Long context specialist",
  },
  {
    id: "grok-4-1",
    name: "Grok 4.1",
    provider: "xai",
    group: "xAI",
    tag: null,
    description: "Bold, fast-moving coder",
  },
];

export type AgentMode = "agent" | "plan" | "ask";

export const MODES: {
  id: AgentMode;
  label: string;
  shortcut: string;
  description: string;
}[] = [
  {
    id: "agent",
    label: "Agent",
    shortcut: "⌘.",
    description: "Reads, edits and runs code autonomously",
  },
  {
    id: "plan",
    label: "Plan",
    shortcut: "⌘P",
    description: "Explores and proposes a step-by-step plan first",
  },
  {
    id: "ask",
    label: "Ask",
    shortcut: "⌘L",
    description: "Answers about your codebase, no edits",
  },
];

export type EffortLevel = 0 | 1 | 2 | 3;

export const EFFORTS: {
  level: EffortLevel;
  label: string;
  hint: string;
  latency: string;
}[] = [
  {
    level: 0,
    label: "Low",
    hint: "Quick pass · 1–2 tool calls",
    latency: "~10s",
  },
  {
    level: 1,
    label: "Med",
    hint: "Balanced sweep · 4–8 tool calls",
    latency: "~30s",
  },
  {
    level: 2,
    label: "High",
    hint: "Deep reasoning · 12–20 tool calls",
    latency: "~1–2m",
  },
  {
    level: 3,
    label: "Max",
    hint: "Full exploration · 30+ tool calls",
    latency: "2m+",
  },
];
