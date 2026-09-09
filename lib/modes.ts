import { Bug, Eye, Map, Sparkles, type LucideIcon } from "lucide-react";

export const MODE_IDS = ["agent", "plan", "ask", "debug"] as const;
export type ModeId = (typeof MODE_IDS)[number];

export type Mode = {
  id: ModeId;
  name: string;
  icon: LucideIcon;
  /** Hex accent, mirrored by the --color-{id} token in globals.css. */
  accent: string;
  /** Shown next to the mode name in the rail. */
  summary: string;
  detail: string;
  writes: "always" | "after-approval" | "never";
  tools: string[];
};

export const MODES: Record<ModeId, Mode> = {
  agent: {
    id: "agent",
    name: "Agent",
    icon: Sparkles,
    accent: "#6ea8ff",
    summary: "Edits files, runs commands",
    detail:
      "Full capability. Searches the codebase, writes files and runs terminal commands on its own.",
    writes: "always",
    tools: ["read", "search", "edit", "terminal"],
  },
  plan: {
    id: "plan",
    name: "Plan",
    icon: Map,
    accent: "#b18cff",
    summary: "Researches, writes a plan first",
    detail:
      "Investigates and drafts a reviewable plan. Nothing is written until you approve it.",
    writes: "after-approval",
    tools: ["read", "search", "plan"],
  },
  ask: {
    id: "ask",
    name: "Ask",
    icon: Eye,
    accent: "#46d6c0",
    summary: "Read-only answers",
    detail: "Explains and explores. Cannot edit files or run commands.",
    writes: "never",
    tools: ["read", "search"],
  },
  debug: {
    id: "debug",
    name: "Debug",
    icon: Bug,
    accent: "#ffb057",
    summary: "Reproduces, then fixes",
    detail:
      "Gathers runtime evidence with logs and instrumentation before proposing a fix.",
    writes: "always",
    tools: ["read", "search", "terminal", "edit", "logs"],
  },
};

export const MODE_LIST: Mode[] = MODE_IDS.map((id) => MODES[id]);

export function nextMode(current: ModeId, direction: 1 | -1 = 1): ModeId {
  const index = MODE_IDS.indexOf(current);
  const length = MODE_IDS.length;
  return MODE_IDS[(index + direction + length) % length];
}
