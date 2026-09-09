import type { ModelId } from "@/lib/types"

export type ModelProvider = "cursor" | "anthropic" | "openai" | "google" | "xai"

export type ModelDef = {
  id: ModelId
  name: string
  subtitle: string
  provider: ModelProvider
  providerLabel: string
}

export const MODELS: ModelDef[] = [
  {
    id: "composer-2.5",
    name: "Composer 2.5",
    subtitle: "Cursor’s coding model",
    provider: "cursor",
    providerLabel: "Cursor",
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    subtitle: "Deepest reasoning",
    provider: "anthropic",
    providerLabel: "Anthropic",
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    subtitle: "Balanced and sharp",
    provider: "anthropic",
    providerLabel: "Anthropic",
  },
  {
    id: "gpt-5.6",
    name: "GPT-5.6",
    subtitle: "OpenAI frontier",
    provider: "openai",
    providerLabel: "OpenAI",
  },
  {
    id: "gemini-3.8",
    name: "Gemini 3.8",
    subtitle: "Google DeepMind",
    provider: "google",
    providerLabel: "Google",
  },
  {
    id: "grok-4.6",
    name: "Grok 4.6",
    subtitle: "xAI",
    provider: "xai",
    providerLabel: "xAI",
  },
]

export const MODEL_BY_ID = Object.fromEntries(
  MODELS.map((model) => [model.id, model])
) as Record<ModelId, ModelDef>

export const MODEL_GROUPS: { provider: ModelProvider; label: string }[] = [
  { provider: "cursor", label: "Cursor" },
  { provider: "anthropic", label: "Anthropic" },
  { provider: "openai", label: "OpenAI" },
  { provider: "google", label: "Google" },
  { provider: "xai", label: "xAI" },
]
