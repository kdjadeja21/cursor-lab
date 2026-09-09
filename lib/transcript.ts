import type { EffortId } from "@/lib/effort";
import type { ModeId } from "@/lib/modes";

export type ToolKind = "read" | "search" | "terminal" | "edit" | "web" | "logs";

export type DiffLine = {
  type: "context" | "add" | "remove";
  text: string;
};

export type TodoStatus = "pending" | "active" | "done";

export type Block =
  | { id: string; kind: "text"; text: string; streaming: boolean }
  | {
      id: string;
      kind: "thinking";
      label: string;
      lines: string[];
      seconds: number;
      active: boolean;
      open: boolean;
    }
  | {
      id: string;
      kind: "tool";
      tool: ToolKind;
      title: string;
      target?: string;
      lines: string[];
      meta?: string;
      status: "running" | "done";
      open: boolean;
    }
  | {
      id: string;
      kind: "todo";
      items: { text: string; status: TodoStatus }[];
    }
  | {
      id: string;
      kind: "diff";
      file: string;
      added: number;
      removed: number;
      lines: DiffLine[];
      decision: "pending" | "accepted" | "rejected";
      open: boolean;
    }
  | {
      id: string;
      kind: "plan";
      title: string;
      steps: string[];
      approved: boolean;
    };

export type Attachment = {
  id: string;
  name: string;
  kind: "file" | "image" | "folder";
};

export type RunSettings = {
  mode: ModeId;
  modelId: string;
  effort: EffortId | null;
  fast: boolean;
};

export type Message =
  | ({
      id: string;
      role: "user";
      text: string;
      attachments: Attachment[];
    } & RunSettings)
  | ({
      id: string;
      role: "assistant";
      blocks: Block[];
      status: "streaming" | "done" | "stopped";
      elapsedMs: number;
    } & RunSettings)
  | {
      id: string;
      role: "note";
      text: string;
      tone: "mode" | "info";
    };

export function countDiff(lines: DiffLine[]) {
  return {
    added: lines.filter((line) => line.type === "add").length,
    removed: lines.filter((line) => line.type === "remove").length,
  };
}
