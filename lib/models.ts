import type { EffortLevel } from "@/lib/effort";

export type Provider =
  | "cursor"
  | "anthropic"
  | "openai"
  | "google"
  | "xai"
  | "deepseek";

export type ModelTag = "thinking" | "fast" | "1m" | "new" | "recommended";

export type Model = {
  id: string;
  name: string;
  provider: Provider;
  /** Reasoning-effort levels this model exposes; empty when it has none. */
  efforts: readonly EffortLevel[];
  defaultEffort: EffortLevel | null;
  /** Whether a Fast (priority-throughput) variant exists. */
  fast: boolean;
  fastMultiplier?: number;
  tags: ModelTag[];
  description: string;
  /** Rough 0-1 scores used purely for the picker's detail bars. */
  speed: number;
  depth: number;
  cost: number;
  /** Relative multiplier on scripted latency. */
  latency: number;
};

export const PROVIDER_ORDER: Provider[] = [
  "cursor",
  "anthropic",
  "openai",
  "google",
  "xai",
  "deepseek",
];

export const MODELS: Model[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "cursor",
    efforts: [],
    defaultEffort: null,
    fast: false,
    tags: ["recommended"],
    description:
      "Routes each request to the best available model for the task and current load.",
    speed: 0.8,
    depth: 0.7,
    cost: 0.4,
    latency: 0.9,
  },
  {
    id: "composer-2.5",
    name: "Composer 2.5",
    provider: "cursor",
    efforts: [],
    defaultEffort: null,
    fast: true,
    fastMultiplier: 1.5,
    tags: ["fast", "new"],
    description:
      "Cursor's frontier coding model. Tuned for multi-file edits and low latency; sets its own depth.",
    speed: 0.95,
    depth: 0.7,
    cost: 0.35,
    latency: 0.6,
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    efforts: ["low", "medium", "high", "xhigh", "max"],
    defaultEffort: "high",
    fast: true,
    fastMultiplier: 2,
    tags: ["thinking", "fast", "1m"],
    description:
      "Anthropic's most capable model. Best for long-horizon agentic work and hard refactors.",
    speed: 0.45,
    depth: 1,
    cost: 1,
    latency: 1.3,
  },
  {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    efforts: ["low", "medium", "high", "xhigh", "max"],
    defaultEffort: "medium",
    fast: false,
    tags: ["thinking", "new"],
    description:
      "Balanced reasoning with a strong sense of code style. Great default for daily agent work.",
    speed: 0.65,
    depth: 0.85,
    cost: 0.6,
    latency: 1,
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    efforts: ["low", "medium", "high", "max"],
    defaultEffort: "medium",
    fast: false,
    tags: ["thinking"],
    description: "Fast and precise. Ideal for focused edits and quick questions.",
    speed: 0.8,
    depth: 0.7,
    cost: 0.4,
    latency: 0.8,
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    efforts: ["low", "medium", "high", "xhigh"],
    defaultEffort: "medium",
    fast: true,
    fastMultiplier: 2,
    tags: ["thinking", "fast"],
    description:
      "OpenAI's general-purpose reasoning model. Strong at planning and explaining trade-offs.",
    speed: 0.6,
    depth: 0.85,
    cost: 0.65,
    latency: 1,
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    efforts: ["low", "medium", "high", "xhigh", "max"],
    defaultEffort: "high",
    fast: true,
    fastMultiplier: 2,
    tags: ["thinking", "fast", "1m"],
    description:
      "Largest OpenAI model with a 1M-token window. Use for whole-repository reasoning.",
    speed: 0.4,
    depth: 1,
    cost: 1,
    latency: 1.4,
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    fast: false,
    tags: ["1m"],
    description:
      "Google's low-latency model with a 1M-token context. Excellent for large file reads.",
    speed: 0.9,
    depth: 0.6,
    cost: 0.25,
    latency: 0.65,
  },
  {
    id: "grok-4.6",
    name: "Grok 4.6",
    provider: "xai",
    efforts: ["low", "medium", "high", "xhigh"],
    defaultEffort: "medium",
    fast: true,
    fastMultiplier: 1.5,
    tags: ["thinking", "fast"],
    description: "xAI's reasoning model. Direct, terse, and quick on debugging tasks.",
    speed: 0.7,
    depth: 0.75,
    cost: 0.5,
    latency: 0.9,
  },
  {
    id: "deepseek-v4",
    name: "DeepSeek V4",
    provider: "deepseek",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    fast: false,
    tags: [],
    description: "Open-weights reasoning model. Cost-efficient for routine changes.",
    speed: 0.6,
    depth: 0.65,
    cost: 0.15,
    latency: 1.1,
  },
];

export const DEFAULT_MODEL_ID = "claude-fable-5.1";

export function getModel(id: string): Model {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export const TAG_LABEL: Record<ModelTag, string> = {
  thinking: "Thinking",
  fast: "Fast",
  "1m": "1M ctx",
  new: "New",
  recommended: "Recommended",
};
