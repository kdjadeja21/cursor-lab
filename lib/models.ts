import type { ProviderId } from "@/components/brand/ProviderLogo";
import type { EffortId } from "@/lib/effort";

export type ModelBadge = "recommended" | "flagship" | "new" | "cheap" | "byok";

export type Model = {
  id: string;
  name: string;
  provider: ProviderId;
  /** Group heading in the picker. */
  vendor: string;
  /** Reasoning levels this model actually exposes. Empty means no dial. */
  efforts: EffortId[];
  defaultEffort: EffortId | null;
  fast: boolean;
  /** Why Fast is unavailable, shown in the disabled toggle's tooltip. */
  fastReason?: string;
  /** Why there is no effort dial, shown in place of it. */
  effortNote?: string;
  contextTokens: number;
  badges: ModelBadge[];
  blurb: string;
  /** 0..1 bars in the picker detail pane. */
  metrics: { speed: number; depth: number; cost: number };
  isRouter?: boolean;
};

const FULL: EffortId[] = ["low", "medium", "high", "xhigh", "max"];
const WITH_NONE: EffortId[] = ["none", "low", "medium", "high", "xhigh", "max"];

export const MODELS: Model[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "cursor",
    vendor: "Cursor",
    efforts: [],
    defaultEffort: null,
    fast: false,
    fastReason: "The router picks speed for you, per request.",
    effortNote: "Router chooses per turn",
    contextTokens: 272_000,
    badges: ["recommended"],
    blurb:
      "Cursor Router picks a model per turn. Set what to optimise for instead of an effort level.",
    metrics: { speed: 0.72, depth: 0.7, cost: 0.35 },
    isRouter: true,
  },
  {
    id: "composer-2.5",
    name: "Composer 2.5",
    provider: "cursor",
    vendor: "Cursor",
    efforts: [],
    defaultEffort: null,
    fast: true,
    effortNote: "Composer sets its own depth",
    contextTokens: 200_000,
    badges: ["cheap"],
    blurb:
      "Cursor's own model, tuned for the editor. No reasoning dial — it decides how hard to think.",
    metrics: { speed: 0.96, depth: 0.55, cost: 0.15 },
  },
  {
    id: "grok-4.6",
    name: "Grok 4.6",
    provider: "xai",
    vendor: "xAI",
    efforts: ["low", "medium", "high", "xhigh"],
    defaultEffort: "high",
    fast: true,
    contextTokens: 480_000,
    badges: ["flagship"],
    blurb: "Cursor's flagship pick. Holds long contexts together on hard, sprawling tasks.",
    metrics: { speed: 0.62, depth: 0.92, cost: 0.62 },
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    vendor: "Anthropic",
    efforts: FULL,
    defaultEffort: "high",
    fast: true,
    contextTokens: 320_000,
    badges: [],
    blurb: "Deepest multi-step reasoning. The one to reach for when a refactor spans systems.",
    metrics: { speed: 0.42, depth: 0.97, cost: 0.9 },
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    vendor: "Anthropic",
    efforts: FULL,
    defaultEffort: "medium",
    fast: false,
    fastReason: "Anthropic doesn't ship a Fast variant of Sonnet 5.",
    contextTokens: 272_000,
    badges: [],
    blurb: "The dependable middle. Most day-to-day feature work lands fine here.",
    metrics: { speed: 0.75, depth: 0.78, cost: 0.4 },
  },
  {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    vendor: "Anthropic",
    efforts: FULL,
    defaultEffort: "medium",
    fast: false,
    fastReason: "Fast isn't available for Fable 5.1 yet.",
    contextTokens: 272_000,
    badges: ["new"],
    blurb: "Strong at reading unfamiliar code and explaining what it found.",
    metrics: { speed: 0.68, depth: 0.83, cost: 0.5 },
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    vendor: "OpenAI",
    efforts: WITH_NONE,
    defaultEffort: "medium",
    fast: true,
    contextTokens: 400_000,
    badges: [],
    blurb: "Wide effort range — from a no-reasoning pass all the way up to max.",
    metrics: { speed: 0.6, depth: 0.9, cost: 0.7 },
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    vendor: "OpenAI",
    efforts: WITH_NONE,
    defaultEffort: "low",
    fast: true,
    contextTokens: 400_000,
    badges: [],
    blurb: "Terra trades a little depth for latency. Nice with Fast on for tight loops.",
    metrics: { speed: 0.84, depth: 0.72, cost: 0.45 },
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    vendor: "Google",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    fast: false,
    fastReason: "Flash is already the fast tier — there's no Fast variant.",
    contextTokens: 1_000_000,
    badges: ["cheap"],
    blurb: "A million tokens of context for very little. Great for sweeping a big repo.",
    metrics: { speed: 0.93, depth: 0.6, cost: 0.12 },
  },
  {
    id: "muse-spark-1.3",
    name: "Muse Spark 1.3",
    provider: "muse",
    vendor: "Muse",
    efforts: ["minimal", "low", "medium", "high", "xhigh", "max"],
    defaultEffort: "low",
    fast: false,
    fastReason: "Muse hasn't published a Fast tier.",
    contextTokens: 256_000,
    badges: ["new"],
    blurb: "Unusually good at UI work. Has a minimal tier below low for tiny edits.",
    metrics: { speed: 0.8, depth: 0.68, cost: 0.3 },
  },
  {
    id: "glm-5.3",
    name: "GLM-5.3",
    provider: "byok",
    vendor: "Your API keys",
    efforts: [],
    defaultEffort: null,
    fast: false,
    fastReason: "Custom endpoints don't expose Cursor's parameters.",
    effortNote: "Set on your provider",
    contextTokens: 128_000,
    badges: ["byok"],
    blurb:
      "Added with your own key. Cursor has no parameter definitions for it, so effort and Fast are configured provider-side.",
    metrics: { speed: 0.7, depth: 0.7, cost: 0.05 },
  },
];

export const MODEL_BY_ID: Record<string, Model> = Object.fromEntries(
  MODELS.map((model) => [model.id, model]),
);

export const VENDOR_ORDER = [
  "Cursor",
  "Anthropic",
  "OpenAI",
  "xAI",
  "Google",
  "Muse",
  "Your API keys",
] as const;

export function getModel(id: string): Model {
  return MODEL_BY_ID[id] ?? MODELS[0];
}

export const ROUTER_PREFERENCES = [
  {
    id: "cost",
    label: "Cost",
    blurb: "Cheapest model that can finish the job.",
  },
  {
    id: "balance",
    label: "Balance",
    blurb: "Cursor's default trade-off.",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    blurb: "Always route to the strongest model available.",
  },
] as const;

export type RouterPreference = (typeof ROUTER_PREFERENCES)[number]["id"];

export const BADGE_LABEL: Record<ModelBadge, string> = {
  recommended: "Recommended",
  flagship: "Flagship",
  new: "New",
  cheap: "Cheap",
  byok: "Your key",
};

export function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M context`;
  return `${Math.round(tokens / 1000)}k context`;
}
