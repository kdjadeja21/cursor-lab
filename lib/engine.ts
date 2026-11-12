import { EFFORT_DEPTH, EFFORT_TIME } from "@/lib/effort";
import { getModel } from "@/lib/models";
import type { Mode } from "@/lib/modes";
import type {
  Block,
  DiffLine,
  EngineEvent,
  RunConfig,
  ToolKind,
} from "@/lib/types";

let counter = 0;
export function uid(prefix = "b") {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

class Aborted extends Error {
  constructor() {
    super("aborted");
  }
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new Aborted());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function tokenize(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [text];
}

type Timing = { scale: number; depth: number };

function timing(cfg: RunConfig): Timing {
  const model = getModel(cfg.modelId);
  const effortScale = cfg.effort ? EFFORT_TIME[cfg.effort] : 0.9;
  const fastScale = cfg.fast ? 0.5 : 1;
  return {
    scale: effortScale * fastScale * model.latency,
    depth: cfg.effort ? EFFORT_DEPTH[cfg.effort] : 1,
  };
}

function topic(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim().replace(/[.?!]+$/, "");
  if (cleaned.length <= 64) return cleaned;
  return `${cleaned.slice(0, 61)}…`;
}

const READ_TARGETS = [
  "app/page.tsx",
  "components/agent/Composer.tsx",
  "lib/store.tsx",
  "app/api/search/route.ts",
  "lib/auth/middleware.ts",
  "components/Sidebar.tsx",
];

const GREP_TARGETS = [
  "useEffect(",
  "revalidatePath",
  "getServerSession",
  "TODO",
  "localStorage",
];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function tool(kind: ToolKind, label: string, target: string): Block {
  return { kind: "tool", id: uid("t"), tool: kind, label, target, status: "pending" };
}

const DIFF_LINES: DiffLine[] = [
  { type: "ctx", text: "export function Composer({ onSend }: Props) {" },
  { type: "del", text: "  const [value, setValue] = useState(\"\");" },
  { type: "add", text: "  const [value, setValue] = useState(initialDraft);" },
  { type: "add", text: "  const pending = useOptimistic(items, applyDraft);" },
  { type: "ctx", text: "" },
  { type: "ctx", text: "  const submit = () => {" },
  { type: "del", text: "    onSend(value);" },
  { type: "add", text: "    startTransition(() => onSend(value.trim()));" },
  { type: "ctx", text: "  };" },
];

function thinkingText(mode: Mode, subject: string, depth: number): string[] {
  const base: Record<Mode, string[]> = {
    agent: [
      `The user wants to ${subject.toLowerCase()}. `,
      "I should look at how the composer manages state before changing anything. ",
      "The store already exposes a reducer, so the cleanest path is an optimistic branch in the reducer rather than component-local state. ",
    ],
    plan: [
      `Scoping "${subject}". `,
      "I need to understand the current data flow, the boundaries that would move, and what stays stable. ",
      "A good plan here has independent, verifiable steps and calls out the risky one early. ",
    ],
    ask: [
      `Question: ${subject}. `,
      "Let me find the concrete implementation so the answer can cite real files instead of guessing. ",
    ],
    debug: [
      `Symptom: ${subject}. `,
      "Two hypotheses stand out: a server/client render mismatch from reading localStorage during render, or a stale memo. ",
      "I'll instrument the suspicious path first and verify before proposing a fix. ",
    ],
  };
  const extra = [
    "Checking whether any existing tests cover this path so I can extend them instead of adding new scaffolding. ",
    "Considering the failure modes: what happens on an aborted request, and is the state recoverable? ",
    "Weighing a smaller, reversible change against a broader refactor. The smaller one wins unless it leaves duplicated logic. ",
    "Cross-referencing the type definitions so the change compiles without widening any unions. ",
  ];
  return [...base[mode], ...extra.slice(0, depth)];
}

async function* streamThinking(
  cfg: RunConfig,
  t: Timing,
  subject: string,
): AsyncGenerator<EngineEvent> {
  const id = uid("th");
  const block: Block = {
    kind: "thinking",
    id,
    text: "",
    done: false,
    startedAt: Date.now(),
  };
  yield { type: "block:add", block };
  await wait(380 * t.scale, cfg.signal);
  for (const sentence of thinkingText(cfg.mode, subject, t.depth)) {
    for (const tok of tokenize(sentence)) {
      yield { type: "thinking:append", blockId: id, text: tok };
      await wait(18 * t.scale + Math.random() * 14, cfg.signal);
    }
    await wait(140 * t.scale, cfg.signal);
  }
  yield { type: "thinking:done", blockId: id };
}

async function* runTool(
  cfg: RunConfig,
  t: Timing,
  block: Block,
  ms: number,
  detail?: string,
): AsyncGenerator<EngineEvent> {
  yield { type: "block:add", block };
  await wait(ms * t.scale, cfg.signal);
  yield { type: "tool:done", blockId: block.id, detail };
}

async function* streamText(
  cfg: RunConfig,
  t: Timing,
  text: string,
): AsyncGenerator<EngineEvent> {
  const id = uid("tx");
  yield { type: "block:add", block: { kind: "text", id, text: "", done: false } };
  for (const tok of tokenize(text)) {
    yield { type: "text:append", blockId: id, text: tok };
    await wait((cfg.fast ? 9 : 16) * Math.min(1.4, t.scale) + Math.random() * 10, cfg.signal);
  }
  yield { type: "text:done", blockId: id };
}

async function* investigate(
  cfg: RunConfig,
  t: Timing,
  count: number,
): AsyncGenerator<EngineEvent> {
  for (let i = 0; i < count; i += 1) {
    if (i % 2 === 0) {
      yield* runTool(
        cfg,
        t,
        tool("read", "Read", pick(READ_TARGETS, i)),
        420 + i * 90,
        `${40 + i * 23} lines`,
      );
    } else {
      yield* runTool(
        cfg,
        t,
        tool("grep", "Searched", pick(GREP_TARGETS, i)),
        520 + i * 60,
        `${3 + i} matches`,
      );
    }
  }
}

async function* agentScript(cfg: RunConfig, t: Timing): AsyncGenerator<EngineEvent> {
  const subject = topic(cfg.prompt);
  yield* streamThinking(cfg, t, subject);
  yield* investigate(cfg, t, 2 + t.depth);
  yield* streamText(
    cfg,
    t,
    `I'll ${subject.charAt(0).toLowerCase()}${subject.slice(1)} by keeping the change inside the existing reducer so the composer stays declarative.`,
  );
  yield* runTool(
    cfg,
    t,
    tool("edit", "Edited", "components/agent/Composer.tsx"),
    900,
  );
  const diff: Block = {
    kind: "diff",
    id: uid("d"),
    file: "components/agent/Composer.tsx",
    additions: DIFF_LINES.filter((l) => l.type === "add").length,
    deletions: DIFF_LINES.filter((l) => l.type === "del").length,
    lines: DIFF_LINES,
  };
  yield { type: "block:add", block: diff };
  await wait(300 * t.scale, cfg.signal);
  if (t.depth >= 2) {
    yield* runTool(cfg, t, tool("run", "Ran", "npm run lint"), 1400, "no errors");
  }
  yield* streamText(
    cfg,
    t,
    "The draft is now optimistic: the list updates immediately and reconciles when the transition settles. Lint passes. Keep the change if it reads well, or undo it and I'll try a smaller variant.",
  );
  yield { type: "done" };
}

async function* planScript(cfg: RunConfig, t: Timing): AsyncGenerator<EngineEvent> {
  const subject = topic(cfg.prompt);
  yield* streamThinking(cfg, t, subject);
  yield* investigate(cfg, t, 2 + t.depth);
  yield* streamText(
    cfg,
    t,
    `Here's a plan for "${subject}". Each step is independently verifiable, and the riskiest one is deliberately second so we learn early.`,
  );
  const plan: Block = {
    kind: "plan",
    id: uid("p"),
    title: subject,
    steps: [
      "Add a typed contract for the new boundary and land it behind a flag",
      "Move the risky read path first and verify with the existing tests",
      "Migrate writes, keeping the old path as a fallback for one release",
      "Remove the fallback, delete dead code, and update the docs",
    ],
    approved: false,
  };
  yield { type: "block:add", block: plan };
  await wait(200 * t.scale, cfg.signal);
  yield* streamText(
    cfg,
    t,
    "Approve the plan to hand it to Agent mode, or tell me what to change.",
  );
  yield { type: "done" };
}

async function* askScript(cfg: RunConfig, t: Timing): AsyncGenerator<EngineEvent> {
  const subject = topic(cfg.prompt);
  yield* streamThinking(cfg, t, subject);
  yield* investigate(cfg, t, 1 + Math.min(2, t.depth));
  yield* streamText(
    cfg,
    t,
    `Short version: the middleware in lib/auth/middleware.ts wraps every route under app/(protected) and calls getServerSession once per request. The session is cached on the request object, so downstream loaders read it for free.\n\nTwo things worth knowing: redirects happen before rendering, so unauthenticated users never hit a server component, and the cache key includes the tenant header, which is why switching tenants forces a re-fetch.\n\nI didn't change anything. Switch to Agent if you'd like me to.`,
  );
  yield { type: "done" };
}

async function* debugScript(cfg: RunConfig, t: Timing): AsyncGenerator<EngineEvent> {
  const subject = topic(cfg.prompt);
  yield* streamThinking(cfg, t, subject);
  yield* streamText(
    cfg,
    t,
    "Two hypotheses. I'll instrument both and let the evidence decide.",
  );
  yield* runTool(cfg, t, tool("read", "Read", "components/Sidebar.tsx"), 500, "112 lines");
  yield* runTool(cfg, t, tool("edit", "Added logs", "components/Sidebar.tsx"), 700, "3 probes");
  yield* runTool(cfg, t, tool("run", "Ran", "npm run dev -- --turbo"), 1600, "reproduced");
  if (t.depth >= 1) {
    yield* runTool(cfg, t, tool("grep", "Searched", "localStorage.getItem"), 500, "2 matches");
  }
  yield* streamText(
    cfg,
    t,
    "Confirmed: the sidebar reads localStorage during the first render, so the server HTML and the client's first paint disagree. Hypothesis two (stale memo) is ruled out; the memo keys are stable.\n\nFix: read persisted state in an effect and render the default until hydration completes. I've left the probes in place; say the word and I'll apply the fix and remove them.",
  );
  yield { type: "done" };
}

export async function* runScript(cfg: RunConfig): AsyncGenerator<EngineEvent> {
  const t = timing(cfg);
  try {
    switch (cfg.mode) {
      case "agent":
        yield* agentScript(cfg, t);
        break;
      case "plan":
        yield* planScript(cfg, t);
        break;
      case "ask":
        yield* askScript(cfg, t);
        break;
      case "debug":
        yield* debugScript(cfg, t);
        break;
      default: {
        const exhaustive: never = cfg.mode;
        return exhaustive;
      }
    }
  } catch (err) {
    if (err instanceof Aborted) return;
    throw err;
  }
}
