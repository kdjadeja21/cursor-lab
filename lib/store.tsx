"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { runScript, uid } from "@/lib/engine";
import { snapEffort, stepEffort, type EffortLevel } from "@/lib/effort";
import { DEFAULT_MODEL_ID, getModel } from "@/lib/models";
import { nextMode, type Mode } from "@/lib/modes";
import type {
  AssistantMessage,
  Block,
  EngineEvent,
  Message,
} from "@/lib/types";

export type Panel = "model" | "effort" | null;

export type Settings = {
  mode: Mode;
  modelId: string;
  effort: EffortLevel | null;
  fast: boolean;
  pinned: string[];
};

export type AgentState = {
  settings: Settings;
  messages: Message[];
  draft: string;
  context: string[];
  panel: Panel;
  runningId: string | null;
  hydrated: boolean;
  chatTitle: string;
};

type Action =
  | { type: "hydrate"; settings: Partial<Settings> }
  | { type: "setMode"; mode: Mode }
  | { type: "cycleMode"; delta: 1 | -1 }
  | { type: "setModel"; modelId: string }
  | { type: "setEffort"; effort: EffortLevel }
  | { type: "stepEffort"; delta: number }
  | { type: "setFast"; fast: boolean }
  | { type: "toggleFast" }
  | { type: "togglePin"; modelId: string }
  | { type: "setDraft"; draft: string }
  | { type: "addContext"; item: string }
  | { type: "removeContext"; item: string }
  | { type: "setPanel"; panel: Panel }
  | { type: "send"; text: string; userId: string; assistantId: string }
  | { type: "engine"; assistantId: string; event: EngineEvent }
  | { type: "stop" }
  | { type: "newChat" }
  | { type: "decideDiff"; blockId: string; decision: "kept" | "undone" }
  | { type: "approvePlan"; blockId: string };

const STORAGE_KEY = "cursor-lab.agent.settings.v1";

const defaultModel = getModel(DEFAULT_MODEL_ID);

export const initialState: AgentState = {
  settings: {
    mode: "agent",
    modelId: defaultModel.id,
    effort: defaultModel.defaultEffort,
    fast: false,
    pinned: ["claude-fable-5.1", "composer-2.5"],
  },
  messages: [],
  draft: "",
  context: ["Composer.tsx"],
  panel: null,
  runningId: null,
  hydrated: false,
  chatTitle: "New chat",
};

function updateBlock(
  blocks: Block[],
  id: string,
  fn: (b: Block) => Block,
): Block[] {
  return blocks.map((b) => (b.id === id ? fn(b) : b));
}

function applyEngine(msg: AssistantMessage, ev: EngineEvent): AssistantMessage {
  switch (ev.type) {
    case "block:add":
      return { ...msg, blocks: [...msg.blocks, ev.block] };
    case "thinking:append":
      return {
        ...msg,
        blocks: updateBlock(msg.blocks, ev.blockId, (b) =>
          b.kind === "thinking" ? { ...b, text: b.text + ev.text } : b,
        ),
      };
    case "thinking:done":
      return {
        ...msg,
        blocks: updateBlock(msg.blocks, ev.blockId, (b) =>
          b.kind === "thinking" ? { ...b, done: true, endedAt: Date.now() } : b,
        ),
      };
    case "tool:done":
      return {
        ...msg,
        blocks: updateBlock(msg.blocks, ev.blockId, (b) =>
          b.kind === "tool" ? { ...b, status: "done", detail: ev.detail } : b,
        ),
      };
    case "text:append":
      return {
        ...msg,
        blocks: updateBlock(msg.blocks, ev.blockId, (b) =>
          b.kind === "text" ? { ...b, text: b.text + ev.text } : b,
        ),
      };
    case "text:done":
      return {
        ...msg,
        blocks: updateBlock(msg.blocks, ev.blockId, (b) =>
          b.kind === "text" ? { ...b, done: true } : b,
        ),
      };
    case "done":
      return { ...msg, status: "done", finishedAt: Date.now() };
    default: {
      const exhaustive: never = ev;
      return exhaustive;
    }
  }
}

function finalizeStopped(msg: AssistantMessage): AssistantMessage {
  return {
    ...msg,
    status: "stopped",
    finishedAt: Date.now(),
    blocks: msg.blocks.map((b) => {
      switch (b.kind) {
        case "thinking":
          return b.done ? b : { ...b, done: true, endedAt: Date.now() };
        case "tool":
          return b.status === "done" ? b : { ...b, status: "done", detail: "stopped" };
        case "text":
          return b.done ? b : { ...b, done: true };
        case "diff":
        case "plan":
          return b;
        default: {
          const exhaustive: never = b;
          return exhaustive;
        }
      }
    }),
  };
}

function withModel(settings: Settings, modelId: string): Settings {
  const model = getModel(modelId);
  return {
    ...settings,
    modelId: model.id,
    effort: snapEffort(settings.effort, model.efforts),
    fast: model.fast ? settings.fast : false,
  };
}

export function reducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "hydrate": {
      const merged = { ...state.settings, ...action.settings };
      return { ...state, hydrated: true, settings: withModel(merged, merged.modelId) };
    }
    case "setMode":
      return { ...state, settings: { ...state.settings, mode: action.mode } };
    case "cycleMode":
      return {
        ...state,
        settings: { ...state.settings, mode: nextMode(state.settings.mode, action.delta) },
      };
    case "setModel":
      return { ...state, settings: withModel(state.settings, action.modelId) };
    case "setEffort": {
      const model = getModel(state.settings.modelId);
      if (!model.efforts.includes(action.effort)) return state;
      return { ...state, settings: { ...state.settings, effort: action.effort } };
    }
    case "stepEffort": {
      const model = getModel(state.settings.modelId);
      return {
        ...state,
        settings: {
          ...state.settings,
          effort: stepEffort(state.settings.effort, model.efforts, action.delta),
        },
      };
    }
    case "setFast": {
      const model = getModel(state.settings.modelId);
      if (!model.fast) return state;
      return { ...state, settings: { ...state.settings, fast: action.fast } };
    }
    case "toggleFast": {
      const model = getModel(state.settings.modelId);
      if (!model.fast) return state;
      return { ...state, settings: { ...state.settings, fast: !state.settings.fast } };
    }
    case "togglePin": {
      const pinned = state.settings.pinned.includes(action.modelId)
        ? state.settings.pinned.filter((id) => id !== action.modelId)
        : [...state.settings.pinned, action.modelId];
      return { ...state, settings: { ...state.settings, pinned } };
    }
    case "setDraft":
      return { ...state, draft: action.draft };
    case "addContext":
      return state.context.includes(action.item)
        ? state
        : { ...state, context: [...state.context, action.item] };
    case "removeContext":
      return { ...state, context: state.context.filter((c) => c !== action.item) };
    case "setPanel":
      return { ...state, panel: action.panel };
    case "send": {
      const user: Message = {
        id: action.userId,
        role: "user",
        text: action.text,
        context: state.context,
        createdAt: Date.now(),
      };
      const assistant: AssistantMessage = {
        id: action.assistantId,
        role: "assistant",
        blocks: [],
        status: "running",
        mode: state.settings.mode,
        modelId: state.settings.modelId,
        effort: state.settings.effort,
        fast: state.settings.fast,
        startedAt: Date.now(),
      };
      return {
        ...state,
        draft: "",
        panel: null,
        runningId: assistant.id,
        chatTitle:
          state.messages.length === 0
            ? action.text.slice(0, 48) + (action.text.length > 48 ? "…" : "")
            : state.chatTitle,
        messages: [...state.messages, user, assistant],
      };
    }
    case "engine": {
      const messages = state.messages.map((m) =>
        m.id === action.assistantId && m.role === "assistant" && m.status === "running"
          ? applyEngine(m, action.event)
          : m,
      );
      const runningId =
        action.event.type === "done" && state.runningId === action.assistantId
          ? null
          : state.runningId;
      return { ...state, messages, runningId };
    }
    case "stop": {
      if (!state.runningId) return state;
      return {
        ...state,
        runningId: null,
        messages: state.messages.map((m) =>
          m.id === state.runningId && m.role === "assistant" ? finalizeStopped(m) : m,
        ),
      };
    }
    case "newChat":
      return {
        ...state,
        messages: [],
        draft: "",
        panel: null,
        runningId: null,
        chatTitle: "New chat",
      };
    case "decideDiff":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.role === "assistant"
            ? {
                ...m,
                blocks: updateBlock(m.blocks, action.blockId, (b) =>
                  b.kind === "diff" ? { ...b, decision: action.decision } : b,
                ),
              }
            : m,
        ),
      };
    case "approvePlan":
      return {
        ...state,
        settings: { ...state.settings, mode: "agent" },
        messages: state.messages.map((m) =>
          m.role === "assistant"
            ? {
                ...m,
                blocks: updateBlock(m.blocks, action.blockId, (b) =>
                  b.kind === "plan" ? { ...b, approved: true } : b,
                ),
              }
            : m,
        ),
      };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

type AgentActions = {
  setMode: (mode: Mode) => void;
  cycleMode: (delta?: 1 | -1) => void;
  setModel: (modelId: string) => void;
  setEffort: (effort: EffortLevel) => void;
  stepEffort: (delta: number) => void;
  setFast: (fast: boolean) => void;
  toggleFast: () => void;
  togglePin: (modelId: string) => void;
  setDraft: (draft: string) => void;
  addContext: (item: string) => void;
  removeContext: (item: string) => void;
  setPanel: (panel: Panel) => void;
  send: (text?: string) => void;
  stop: () => void;
  newChat: () => void;
  decideDiff: (blockId: string, decision: "kept" | "undone") => void;
  approvePlan: (blockId: string, title: string) => void;
};

const StateContext = createContext<AgentState | null>(null);
const ActionsContext = createContext<AgentActions | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "hydrate", settings: raw ? JSON.parse(raw) : {} });
    } catch {
      dispatch({ type: "hydrate", settings: {} });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  }, [state.settings, state.hydrated]);

  const startRun = useCallback((text: string, mode?: Mode) => {
    const current = stateRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const userId = uid("u");
    const assistantId = uid("a");
    dispatch({ type: "send", text, userId, assistantId });

    const cfg = {
      mode: mode ?? current.settings.mode,
      modelId: current.settings.modelId,
      effort: current.settings.effort,
      fast: current.settings.fast,
      prompt: text,
      context: current.context,
      signal: controller.signal,
    };
    void (async () => {
      for await (const event of runScript(cfg)) {
        if (controller.signal.aborted) break;
        dispatch({ type: "engine", assistantId, event });
      }
    })();
  }, []);

  const actions = useMemo<AgentActions>(
    () => ({
      setMode: (mode) => dispatch({ type: "setMode", mode }),
      cycleMode: (delta = 1) => dispatch({ type: "cycleMode", delta }),
      setModel: (modelId) => dispatch({ type: "setModel", modelId }),
      setEffort: (effort) => dispatch({ type: "setEffort", effort }),
      stepEffort: (delta) => dispatch({ type: "stepEffort", delta }),
      setFast: (fast) => dispatch({ type: "setFast", fast }),
      toggleFast: () => dispatch({ type: "toggleFast" }),
      togglePin: (modelId) => dispatch({ type: "togglePin", modelId }),
      setDraft: (draft) => dispatch({ type: "setDraft", draft }),
      addContext: (item) => dispatch({ type: "addContext", item }),
      removeContext: (item) => dispatch({ type: "removeContext", item }),
      setPanel: (panel) => dispatch({ type: "setPanel", panel }),
      send: (text) => {
        const value = (text ?? stateRef.current.draft).trim();
        if (!value || stateRef.current.runningId) return;
        startRun(value);
      },
      stop: () => {
        abortRef.current?.abort();
        dispatch({ type: "stop" });
      },
      newChat: () => {
        abortRef.current?.abort();
        dispatch({ type: "newChat" });
      },
      decideDiff: (blockId, decision) => dispatch({ type: "decideDiff", blockId, decision }),
      approvePlan: (blockId, title) => {
        dispatch({ type: "approvePlan", blockId });
        if (stateRef.current.runningId) return;
        startRun(`Implement the plan: ${title}`, "agent");
      },
    }),
    [startRun],
  );

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAgentState() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useAgentState must be used within AgentProvider");
  return ctx;
}

export function useAgentActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useAgentActions must be used within AgentProvider");
  return ctx;
}

export function useCurrentModel() {
  const { settings } = useAgentState();
  return getModel(settings.modelId);
}
