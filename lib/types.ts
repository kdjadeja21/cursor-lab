import type { EffortLevel } from "@/lib/effort";
import type { Mode } from "@/lib/modes";

export type ToolKind = "read" | "grep" | "list" | "edit" | "run";

export type ThinkingBlock = {
  kind: "thinking";
  id: string;
  text: string;
  done: boolean;
  startedAt: number;
  endedAt?: number;
};

export type ToolBlock = {
  kind: "tool";
  id: string;
  tool: ToolKind;
  label: string;
  target: string;
  status: "pending" | "done";
  detail?: string;
};

export type TextBlock = {
  kind: "text";
  id: string;
  text: string;
  done: boolean;
};

export type DiffLine = { type: "add" | "del" | "ctx"; text: string };

export type DiffBlock = {
  kind: "diff";
  id: string;
  file: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  decision?: "kept" | "undone";
};

export type PlanBlock = {
  kind: "plan";
  id: string;
  title: string;
  steps: string[];
  approved: boolean;
};

export type Block = ThinkingBlock | ToolBlock | TextBlock | DiffBlock | PlanBlock;

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
  context: string[];
  createdAt: number;
};

export type AssistantMessage = {
  id: string;
  role: "assistant";
  blocks: Block[];
  status: "running" | "done" | "stopped";
  mode: Mode;
  modelId: string;
  effort: EffortLevel | null;
  fast: boolean;
  startedAt: number;
  finishedAt?: number;
};

export type Message = UserMessage | AssistantMessage;

export type EngineEvent =
  | { type: "block:add"; block: Block }
  | { type: "thinking:append"; blockId: string; text: string }
  | { type: "thinking:done"; blockId: string }
  | { type: "tool:done"; blockId: string; detail?: string }
  | { type: "text:append"; blockId: string; text: string }
  | { type: "text:done"; blockId: string }
  | { type: "done" };

export type RunConfig = {
  mode: Mode;
  modelId: string;
  effort: EffortLevel | null;
  fast: boolean;
  prompt: string;
  context: string[];
  signal: AbortSignal;
};
