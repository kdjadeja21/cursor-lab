export const MODES = ["agent", "plan", "ask", "debug"] as const;
export type Mode = (typeof MODES)[number];

export type ModeMeta = {
  id: Mode;
  label: string;
  description: string;
  placeholder: string;
  emptyTitle: string;
  emptyBody: string;
  suggestions: string[];
};

export const MODE_META: Record<Mode, ModeMeta> = {
  agent: {
    id: "agent",
    label: "Agent",
    description: "Reads, edits and runs code autonomously.",
    placeholder: "Plan, search, build anything…",
    emptyTitle: "What should we build?",
    emptyBody: "Agent can read your codebase, edit files and run commands.",
    suggestions: [
      "Add optimistic updates to the todo list",
      "Migrate the settings page to server actions",
      "Fix the flaky auth test",
    ],
  },
  plan: {
    id: "plan",
    label: "Plan",
    description: "Designs an approach before touching code.",
    placeholder: "Describe what you want to change…",
    emptyTitle: "Let's think it through first",
    emptyBody: "Plan explores the code and proposes steps you can approve.",
    suggestions: [
      "Plan a migration from REST to tRPC",
      "How should we add multi-tenancy?",
      "Design a caching layer for search",
    ],
  },
  ask: {
    id: "ask",
    label: "Ask",
    description: "Answers questions without changing files.",
    placeholder: "Ask anything about this codebase…",
    emptyTitle: "Ask about your code",
    emptyBody: "Ask is read-only. It cites files and explains how things work.",
    suggestions: [
      "How does auth middleware work here?",
      "Where is the pricing logic?",
      "Explain the build pipeline",
    ],
  },
  debug: {
    id: "debug",
    label: "Debug",
    description: "Forms hypotheses and instruments code to verify them.",
    placeholder: "Describe the bug or paste an error…",
    emptyTitle: "What's broken?",
    emptyBody: "Debug narrows the cause with logs and targeted checks.",
    suggestions: [
      "Sidebar hydration mismatch on reload",
      "Why does /api/search time out?",
      "Memory grows during long sessions",
    ],
  },
};

export function nextMode(mode: Mode, delta: 1 | -1 = 1): Mode {
  const i = MODES.indexOf(mode);
  return MODES[(i + delta + MODES.length) % MODES.length];
}
