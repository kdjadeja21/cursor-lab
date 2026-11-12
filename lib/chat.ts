export type ToolStatus = "done" | "running" | "pending";

export interface ToolCall {
  id: string;
  label: string;
  file?: string;
  status: ToolStatus;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  mode?: string;
  modelName?: string;
  effortLabel?: string;
  code?: { file: string; lang: string; code: string };
  tools?: ToolCall[];
  diffStats?: { added: number; removed: number };
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
