import type { AgentMode, EffortLevel } from "./models";
import { EFFORTS } from "./models";
import type { ToolCall } from "./chat";
import { uid } from "./chat";

export function thinkingStages(
  mode: AgentMode,
  effort: EffortLevel,
  fast: boolean,
): string[] {
  const base =
    mode === "plan"
      ? ["Reading codebase context", "Mapping affected files", "Drafting plan"]
      : mode === "ask"
        ? ["Searching codebase", "Gathering references"]
        : ["Reading context", "Planning edits", "Applying changes"];

  const extra: string[] =
    effort >= 2
      ? mode === "agent"
        ? ["Running checks", "Verifying diff"]
        : ["Expanding evidence", "Ranking options"]
      : [];

  const maxExtra: string[] =
    effort === 3 ? ["Exploring edge cases", "Final review"] : [];

  const stages = [...base, ...extra, ...maxExtra];
  return fast ? stages.slice(0, Math.max(2, stages.length - 1)) : stages;
}

export function mockReply(params: {
  prompt: string;
  mode: AgentMode;
  modelName: string;
  effort: EffortLevel;
}): {
  body: string;
  code?: { file: string; lang: string; code: string };
  tools: Omit<ToolCall, "id" | "status">[];
} {
  const { prompt, mode, modelName, effort } = params;
  const short = prompt.trim().slice(0, 72) || "your request";
  const effortLabel = EFFORTS[effort].label;

  if (mode === "ask") {
    return {
      body: `Based on the codebase, "${short}" maps to two areas: the agent pane state in \`AgentWindow\` and the composer submit path. ${modelName} found 3 references with high confidence at ${effortLabel} effort — no edits made in Ask mode. Want me to turn the top match into a Plan?`,
      tools: [
        { label: "Searched codebase", file: "12 matches" },
        { label: "Read references", file: "AgentWindow.tsx" },
      ],
    };
  }

  if (mode === "plan") {
    return {
      body: `Plan for "${short}" (${effortLabel} effort):\n1. Add controlled state for mode, model and effort in the agent pane\n2. Extract the composer into its own component with autosize + Enter-to-send\n3. Mock streaming so the loading state can be reviewed without a backend\nSay the word and I'll implement it as an Agent run.`,
      tools: [
        { label: "Explored repo", file: "6 files" },
        { label: "Mapped edits", file: "components/agent" },
      ],
    };
  }

  return {
    body: `Done — handled "${short}" at ${effortLabel} effort with ${modelName}. I updated the agent pane state, extracted the composer, and wired the animated loading sequence so you can feel the full run. Review the diff below, then run checks.`,
    code: {
      file: "components/agent/AgentWindow.tsx",
      lang: "tsx",
      code: `const [mode, setMode] = useState<AgentMode>("agent");\nconst [effort, setEffort] = useState<EffortLevel>(2);\nconst [fast, setFast] = useState(true);\n\n<ModeSelector mode={mode} onChange={setMode} />\n<EffortControl effort={effort} onChange={setEffort} />`,
    },
    tools: [
      { label: "Read context", file: "AgentWindow.tsx" },
      { label: "Edited component", file: "Composer.tsx" },
      { label: "Ran checks", file: "lint + build" },
    ],
  };
}

export function withIds(
  tools: Omit<ToolCall, "id" | "status">[],
  doneCount: number,
): ToolCall[] {
  return tools.map((t, i) => ({
    ...t,
    id: uid(),
    status: i < doneCount ? "done" : i === doneCount ? "running" : "pending",
  }));
}
