"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  clampEffort,
  cycleEffort,
  stepEffort,
  type EffortId,
} from "@/lib/effort";
import { MODES, nextMode, type ModeId } from "@/lib/modes";
import { getModel, type Model, type RouterPreference } from "@/lib/models";
import { buildRun, type Step } from "@/lib/scripts";
import type {
  Attachment,
  Block,
  Message,
  RunSettings,
  TodoStatus,
} from "@/lib/transcript";

type Status = "idle" | "streaming";

type BlockPatch =
  | Partial<Extract<Block, { kind: "text" }>>
  | Partial<Extract<Block, { kind: "thinking" }>>
  | Partial<Extract<Block, { kind: "tool" }>>
  | Partial<Extract<Block, { kind: "diff" }>>
  | Partial<Extract<Block, { kind: "plan" }>>;

type AgentState = {
  mode: ModeId;
  modelId: string;
  effort: EffortId | null;
  fast: boolean;
  routerPreference: RouterPreference;
  pinned: string[];
  /** Up to two levels you flip between; double-tap the dial to swap. */
  starred: EffortId[];
  messages: Message[];
  status: Status;
  queue: string[];
  lastPrompt: string;
};

type Action =
  | { type: "set-mode"; mode: ModeId; note: boolean }
  | { type: "set-model"; modelId: string }
  | { type: "set-effort"; effort: EffortId }
  | { type: "toggle-fast" }
  | { type: "set-router"; preference: RouterPreference }
  | { type: "toggle-pin"; modelId: string }
  | { type: "toggle-star"; effort: EffortId }
  | { type: "push-user"; id: string; text: string; attachments: Attachment[] }
  | { type: "push-note"; id: string; text: string; tone: "mode" | "info" }
  | { type: "start-run"; id: string; override?: Partial<RunSettings> }
  | { type: "append-block"; messageId: string; block: Block }
  | {
      type: "patch-block";
      messageId: string;
      blockId: string;
      patch: BlockPatch;
    }
  | { type: "append-text"; messageId: string; blockId: string; chunk: string }
  | {
      type: "patch-todo";
      messageId: string;
      blockId: string;
      index: number;
      status: TodoStatus;
    }
  | { type: "toggle-block"; messageId: string; blockId: string }
  | { type: "finish-run"; messageId: string; elapsedMs: number; stopped: boolean }
  | {
      type: "decide-diff";
      messageId: string;
      blockId: string;
      decision: "accepted" | "rejected";
    }
  | { type: "enqueue"; text: string }
  | { type: "dequeue" }
  | { type: "drop-queued"; text: string }
  | { type: "clear-queue" }
  | { type: "new-chat" };

const INITIAL: AgentState = {
  mode: "agent",
  modelId: "claude-opus-5",
  effort: "high",
  fast: false,
  routerPreference: "balance",
  pinned: ["composer-2.5", "claude-opus-5"],
  starred: ["medium", "xhigh"],
  messages: [],
  status: "idle",
  queue: [],
  lastPrompt: "",
};

function mapBlocks(
  state: AgentState,
  messageId: string,
  update: (blocks: Block[]) => Block[],
): AgentState {
  return {
    ...state,
    messages: state.messages.map((message) =>
      message.id === messageId && message.role === "assistant"
        ? { ...message, blocks: update(message.blocks) }
        : message,
    ),
  };
}

function reducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "set-mode": {
      if (action.mode === state.mode) return state;
      const messages = action.note
        ? [
            ...state.messages,
            {
              id: `note-${Date.now()}`,
              role: "note" as const,
              text: `${MODES[action.mode].name} mode — fresh context from here`,
              tone: "mode" as const,
            },
          ]
        : state.messages;
      return { ...state, mode: action.mode, messages };
    }
    case "set-model": {
      const model = getModel(action.modelId);
      const effort =
        model.efforts.length === 0
          ? null
          : clampEffort(state.effort ?? model.defaultEffort ?? "medium", model.efforts);
      return {
        ...state,
        modelId: action.modelId,
        effort,
        fast: model.fast ? state.fast : false,
      };
    }
    case "set-effort":
      return { ...state, effort: action.effort };
    case "toggle-fast": {
      if (!getModel(state.modelId).fast) return state;
      return { ...state, fast: !state.fast };
    }
    case "set-router":
      return { ...state, routerPreference: action.preference };
    case "toggle-pin":
      return {
        ...state,
        pinned: state.pinned.includes(action.modelId)
          ? state.pinned.filter((id) => id !== action.modelId)
          : [...state.pinned, action.modelId],
      };
    case "toggle-star": {
      if (state.starred.includes(action.effort)) {
        return { ...state, starred: state.starred.filter((id) => id !== action.effort) };
      }
      return { ...state, starred: [...state.starred, action.effort].slice(-2) };
    }
    case "push-user":
      return {
        ...state,
        lastPrompt: action.text,
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: "user",
            text: action.text,
            attachments: action.attachments,
            mode: state.mode,
            modelId: state.modelId,
            effort: state.effort,
            fast: state.fast,
          },
        ],
      };
    case "push-note":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: "note", text: action.text, tone: action.tone },
        ],
      };
    case "start-run":
      return {
        ...state,
        status: "streaming",
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: "assistant",
            blocks: [],
            status: "streaming",
            elapsedMs: 0,
            mode: action.override?.mode ?? state.mode,
            modelId: action.override?.modelId ?? state.modelId,
            effort: action.override?.effort ?? state.effort,
            fast: action.override?.fast ?? state.fast,
          },
        ],
      };
    case "append-block":
      return mapBlocks(state, action.messageId, (blocks) => [...blocks, action.block]);
    case "patch-block":
      return mapBlocks(state, action.messageId, (blocks) =>
        blocks.map((block) =>
          block.id === action.blockId
            ? ({ ...block, ...action.patch } as Block)
            : block,
        ),
      );
    case "append-text":
      return mapBlocks(state, action.messageId, (blocks) =>
        blocks.map((block) =>
          block.id === action.blockId && block.kind === "text"
            ? { ...block, text: block.text + action.chunk }
            : block,
        ),
      );
    case "patch-todo":
      return mapBlocks(state, action.messageId, (blocks) =>
        blocks.map((block) => {
          if (block.id !== action.blockId || block.kind !== "todo") return block;
          return {
            ...block,
            items: block.items.map((item, index) =>
              index === action.index ? { ...item, status: action.status } : item,
            ),
          };
        }),
      );
    case "toggle-block":
      return mapBlocks(state, action.messageId, (blocks) =>
        blocks.map((block) => {
          if (block.id !== action.blockId) return block;
          if (
            block.kind === "thinking" ||
            block.kind === "tool" ||
            block.kind === "diff"
          ) {
            return { ...block, open: !block.open };
          }
          return block;
        }),
      );
    case "finish-run":
      return {
        ...state,
        status: "idle",
        messages: state.messages.map((message) => {
          if (message.id !== action.messageId || message.role !== "assistant") {
            return message;
          }
          return {
            ...message,
            status: action.stopped ? "stopped" : "done",
            elapsedMs: action.elapsedMs,
            blocks: message.blocks.map((block) => {
              if (block.kind === "text") return { ...block, streaming: false };
              if (block.kind === "thinking") return { ...block, active: false };
              if (block.kind === "tool" && block.status === "running") {
                return { ...block, status: "done" as const };
              }
              return block;
            }),
          };
        }),
      };
    case "decide-diff":
      return mapBlocks(state, action.messageId, (blocks) =>
        blocks.map((block) =>
          block.id === action.blockId && block.kind === "diff"
            ? { ...block, decision: action.decision }
            : block,
        ),
      );
    case "enqueue":
      return { ...state, queue: [...state.queue, action.text] };
    case "dequeue":
      return { ...state, queue: state.queue.slice(1) };
    case "drop-queued":
      return { ...state, queue: state.queue.filter((item) => item !== action.text) };
    case "clear-queue":
      return state.queue.length === 0 ? state : { ...state, queue: [] };
    case "new-chat":
      return { ...state, messages: [], status: "idle", queue: [] };
    default: {
      const never: never = action;
      return never;
    }
  }
}

export type AgentApi = {
  state: AgentState;
  model: Model;
  supportedEfforts: EffortId[];
  hasEffortDial: boolean;
  setMode: (mode: ModeId) => void;
  cycleMode: (direction?: 1 | -1) => void;
  setModel: (modelId: string) => void;
  setEffort: (effort: EffortId) => void;
  nudgeEffort: (direction: 1 | -1) => void;
  cycleEffortLevel: () => void;
  swapStarredEffort: () => void;
  toggleStarEffort: (effort: EffortId) => void;
  toggleFast: () => void;
  setRouterPreference: (preference: RouterPreference) => void;
  togglePin: (modelId: string) => void;
  submit: (text: string, attachments?: Attachment[]) => void;
  stop: () => void;
  newChat: () => void;
  retryLast: () => void;
  decideDiff: (
    messageId: string,
    blockId: string,
    decision: "accepted" | "rejected",
  ) => void;
  approvePlan: (messageId: string, blockId: string) => void;
  toggleBlock: (messageId: string, blockId: string) => void;
  dropQueued: (text: string) => void;
};

const AgentContext = createContext<AgentApi | null>(null);

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const runIdRef = useRef(0);
  const stoppedRef = useRef(false);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const sleep = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        resolve();
      }, ms);
      timers.current.add(timer);
    });
  }, []);

  const model = useMemo(() => getModel(state.modelId), [state.modelId]);
  const supportedEfforts = model.efforts;
  const hasEffortDial = supportedEfforts.length > 0;

  const play = useCallback(
    async (messageId: string, steps: Step[], settings: RunSettings) => {
      const runId = ++runIdRef.current;
      stoppedRef.current = false;
      const startedAt = Date.now();
      const live = () => runIdRef.current === runId && !stoppedRef.current;
      const tokenDelay = settings.fast ? 11 : 24;

      for (const step of steps) {
        if (!live()) break;

        switch (step.type) {
          case "thinking": {
            const blockId = nextId("think");
            dispatch({
              type: "append-block",
              messageId,
              block: {
                id: blockId,
                kind: "thinking",
                label: step.label,
                lines: [],
                seconds: 0,
                active: true,
                open: true,
              },
            });
            const perLine = Math.max(260, step.ms / Math.max(1, step.lines.length));
            for (let index = 0; index < step.lines.length; index += 1) {
              await sleep(perLine);
              if (!live()) break;
              dispatch({
                type: "patch-block",
                messageId,
                blockId,
                patch: {
                  lines: step.lines.slice(0, index + 1),
                  seconds: Math.round(((index + 1) * perLine) / 1000),
                },
              });
            }
            if (!live()) break;
            dispatch({
              type: "patch-block",
              messageId,
              blockId,
              patch: {
                active: false,
                open: false,
                seconds: Math.max(1, Math.round(step.ms / 1000)),
              },
            });
            break;
          }
          case "tool": {
            const blockId = nextId("tool");
            dispatch({
              type: "append-block",
              messageId,
              block: {
                id: blockId,
                kind: "tool",
                tool: step.tool,
                title: step.title,
                target: step.target,
                lines: [],
                meta: step.meta,
                status: "running",
                open: false,
              },
            });
            await sleep(step.ms);
            if (!live()) break;
            dispatch({
              type: "patch-block",
              messageId,
              blockId,
              patch: { status: "done", lines: step.lines },
            });
            break;
          }
          case "text": {
            const blockId = nextId("text");
            dispatch({
              type: "append-block",
              messageId,
              block: { id: blockId, kind: "text", text: "", streaming: true },
            });
            const tokens = step.text.match(/\S+\s*/g) ?? [step.text];
            let buffer = "";
            for (let index = 0; index < tokens.length; index += 1) {
              buffer += tokens[index];
              // Flush in small groups so React isn't re-rendering per word.
              if (index % 2 === 1 || index === tokens.length - 1) {
                await sleep(tokenDelay * 2);
                if (!live()) break;
                dispatch({ type: "append-text", messageId, blockId, chunk: buffer });
                buffer = "";
              }
            }
            if (!live()) break;
            dispatch({
              type: "patch-block",
              messageId,
              blockId,
              patch: { streaming: false },
            });
            break;
          }
          case "todo": {
            const blockId = nextId("todo");
            dispatch({
              type: "append-block",
              messageId,
              block: {
                id: blockId,
                kind: "todo",
                items: step.items.map((text, index) => ({
                  text,
                  status: index === 0 ? "active" : "pending",
                })),
              },
            });
            for (let index = 0; index < step.items.length; index += 1) {
              await sleep(step.advanceMs);
              if (!live()) break;
              dispatch({
                type: "patch-todo",
                messageId,
                blockId,
                index,
                status: "done",
              });
              if (index + 1 < step.items.length) {
                dispatch({
                  type: "patch-todo",
                  messageId,
                  blockId,
                  index: index + 1,
                  status: "active",
                });
              }
            }
            break;
          }
          case "diff": {
            const added = step.lines.filter((line) => line.type === "add").length;
            const removed = step.lines.filter((line) => line.type === "remove").length;
            dispatch({
              type: "append-block",
              messageId,
              block: {
                id: nextId("diff"),
                kind: "diff",
                file: step.file,
                added,
                removed,
                lines: step.lines,
                decision: "pending",
                open: true,
              },
            });
            await sleep(340);
            break;
          }
          case "plan": {
            dispatch({
              type: "append-block",
              messageId,
              block: {
                id: nextId("plan"),
                kind: "plan",
                title: step.title,
                steps: step.steps,
                approved: false,
              },
            });
            await sleep(360);
            break;
          }
          case "wait": {
            await sleep(step.ms);
            break;
          }
          default: {
            const never: never = step;
            return never;
          }
        }
      }

      if (runIdRef.current !== runId) return;
      dispatch({
        type: "finish-run",
        messageId,
        elapsedMs: Date.now() - startedAt,
        stopped: stoppedRef.current,
      });
    },
    [sleep],
  );

  const settings: RunSettings = useMemo(
    () => ({
      mode: state.mode,
      modelId: state.modelId,
      effort: state.effort,
      fast: state.fast,
    }),
    [state.mode, state.modelId, state.effort, state.fast],
  );

  const startRun = useCallback(
    (
      text: string,
      options: {
        attachments?: Attachment[];
        override?: Partial<RunSettings>;
        /** Replays a prompt without re-adding the user's message. */
        silent?: boolean;
      } = {},
    ) => {
      const runSettings = { ...settings, ...options.override };
      if (options.silent !== true) {
        dispatch({
          type: "push-user",
          id: nextId("user"),
          text,
          attachments: options.attachments ?? [],
        });
      }
      const messageId = nextId("assistant");
      dispatch({ type: "start-run", id: messageId, override: options.override });
      void play(messageId, buildRun(text, runSettings), runSettings);
    },
    [play, settings],
  );

  const submit = useCallback(
    (text: string, attachments: Attachment[] = []) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      if (state.status === "streaming") {
        dispatch({ type: "enqueue", text: trimmed });
        return;
      }
      startRun(trimmed, { attachments });
    },
    [startRun, state.status],
  );

  // Follow-ups queued during a run start once the transcript settles.
  useEffect(() => {
    if (state.status !== "idle" || state.queue.length === 0) return;
    const next = state.queue[0];
    const timer = setTimeout(() => {
      dispatch({ type: "dequeue" });
      startRun(next);
    }, 420);
    return () => clearTimeout(timer);
  }, [state.status, state.queue, startRun]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    runIdRef.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    const streaming = state.messages.findLast(
      (message) => message.role === "assistant" && message.status === "streaming",
    );
    dispatch({ type: "clear-queue" });
    if (streaming) {
      dispatch({
        type: "finish-run",
        messageId: streaming.id,
        elapsedMs: 0,
        stopped: true,
      });
    }
  }, [state.messages]);

  const api: AgentApi = useMemo(() => {
    const settingsEffort = state.effort;
    return {
      state,
      model,
      supportedEfforts,
      hasEffortDial,
      setMode: (mode: ModeId) =>
        dispatch({ type: "set-mode", mode, note: state.messages.length > 0 }),
      cycleMode: (direction: 1 | -1 = 1) =>
        dispatch({
          type: "set-mode",
          mode: nextMode(state.mode, direction),
          note: state.messages.length > 0,
        }),
      setModel: (modelId: string) => dispatch({ type: "set-model", modelId }),
      setEffort: (effort: EffortId) => dispatch({ type: "set-effort", effort }),
      nudgeEffort: (direction: 1 | -1) => {
        if (!hasEffortDial || settingsEffort === null) return;
        dispatch({
          type: "set-effort",
          effort: stepEffort(settingsEffort, supportedEfforts, direction),
        });
      },
      cycleEffortLevel: () => {
        if (!hasEffortDial || settingsEffort === null) return;
        dispatch({
          type: "set-effort",
          effort: cycleEffort(settingsEffort, supportedEfforts),
        });
      },
      swapStarredEffort: () => {
        if (!hasEffortDial || settingsEffort === null) return;
        const options = state.starred.filter((effort) =>
          supportedEfforts.includes(effort),
        );
        if (options.length === 0) return;
        const other = options.find((effort) => effort !== settingsEffort) ?? options[0];
        dispatch({ type: "set-effort", effort: other });
      },
      toggleStarEffort: (effort: EffortId) => dispatch({ type: "toggle-star", effort }),
      toggleFast: () => dispatch({ type: "toggle-fast" }),
      setRouterPreference: (preference: RouterPreference) =>
        dispatch({ type: "set-router", preference }),
      togglePin: (modelId: string) => dispatch({ type: "toggle-pin", modelId }),
      submit,
      stop,
      newChat: () => {
        stoppedRef.current = true;
        runIdRef.current += 1;
        timers.current.forEach(clearTimeout);
        timers.current.clear();
        dispatch({ type: "new-chat" });
      },
      retryLast: () => {
        if (state.lastPrompt.length === 0) return;
        startRun(state.lastPrompt);
      },
      decideDiff: (messageId, blockId, decision) =>
        dispatch({ type: "decide-diff", messageId, blockId, decision }),
      approvePlan: (messageId, blockId) => {
        dispatch({
          type: "patch-block",
          messageId,
          blockId,
          patch: { approved: true },
        });
        dispatch({
          type: "push-note",
          id: nextId("note"),
          text: "Plan approved — handing it to Agent mode",
          tone: "info",
        });
        dispatch({ type: "set-mode", mode: "agent", note: false });
        window.setTimeout(() => {
          startRun(state.lastPrompt, { override: { mode: "agent" }, silent: true });
        }, 520);
      },
      toggleBlock: (messageId, blockId) =>
        dispatch({ type: "toggle-block", messageId, blockId }),
      dropQueued: (text: string) => dispatch({ type: "drop-queued", text }),
    };
  }, [state, model, supportedEfforts, hasEffortDial, submit, stop, startRun]);

  return <AgentContext.Provider value={api}>{children}</AgentContext.Provider>;
}

export function useAgent(): AgentApi {
  const context = useContext(AgentContext);
  if (context === null) {
    throw new Error("useAgent must be used inside <AgentProvider>");
  }
  return context;
}
