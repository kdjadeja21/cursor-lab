"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Pin, Search, Zap } from "lucide-react";
import { ProviderLogo, providerLabel } from "@/components/brand/ProviderLogo";
import { Kbd } from "@/components/ui/Kbd";
import { Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { EFFORT_SHORT } from "@/lib/effort";
import { MODELS, PROVIDER_ORDER, TAG_LABEL, type Model, type ModelTag } from "@/lib/models";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState, useCurrentModel } from "@/lib/store";

type Group = { key: string; title: string; models: Model[] };

function matches(model: Model, q: string) {
  if (!q) return true;
  const hay = [
    model.name,
    model.provider,
    providerLabel(model.provider),
    ...model.tags.map((t) => TAG_LABEL[t]),
    model.efforts.includes("max") ? "max" : "",
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((part) => hay.includes(part));
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-10 text-fg-3">{label}</span>
      <span className="flex flex-1 gap-[3px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] flex-1 rounded-sm",
              i < Math.round(value * 5) ? "bg-fg-1" : "bg-line-1",
            )}
          />
        ))}
      </span>
    </div>
  );
}

function TagPill({ tag }: { tag: ModelTag }) {
  return (
    <span
      className={cn(
        "rounded-[4px] border px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide",
        tag === "new" || tag === "recommended"
          ? "border-accent-line bg-accent-soft text-accent"
          : "border-line-1 text-fg-2",
      )}
    >
      {TAG_LABEL[tag]}
    </span>
  );
}

export function ModelPicker() {
  const { settings, panel } = useAgentState();
  const { setPanel, setModel, togglePin } = useAgentActions();
  const model = useCurrentModel();
  const open = panel === "model";

  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(model.id);

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const visible = MODELS.filter((m) => matches(m, q));
    const pinned = visible.filter((m) => settings.pinned.includes(m.id));
    const out: Group[] = [];
    if (pinned.length && !q) out.push({ key: "pinned", title: "Pinned", models: pinned });
    for (const p of PROVIDER_ORDER) {
      const models = visible.filter((m) => m.provider === p);
      if (models.length) {
        out.push({ key: p, title: p === "cursor" ? "Cursor" : providerLabel(p), models });
      }
    }
    return out;
  }, [query, settings.pinned]);

  const flat = useMemo(() => groups.flatMap((g) => g.models.map((m) => `${g.key}:${m.id}`)), [groups]);
  const cursorModel = MODELS.find((m) => cursor.split(":").pop() === m.id) ?? model;

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(`${settings.pinned.includes(model.id) ? "pinned" : model.provider}:${model.id}`);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, model, settings.pinned]);

  useEffect(() => {
    if (!flat.includes(cursor) && flat.length) setCursor(flat[0]);
  }, [flat, cursor]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-key="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const close = useCallback(() => setPanel(null), [setPanel]);

  const choose = (id: string) => {
    setModel(id);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const i = flat.indexOf(cursor);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(flat[Math.min(flat.length - 1, i + 1)] ?? cursor);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(flat[Math.max(0, i - 1)] ?? cursor);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(cursorModel.id);
    } else if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      togglePin(cursorModel.id);
    }
  };

  return (
    <div ref={anchorRef} className="relative">
      <Tooltip label="Model" keys={SHORTCUTS.model.keys} disabled={open}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setPanel(open ? null : "model")}
          className={cn(
            "focus-ring flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[12px] font-medium transition-colors",
            open
              ? "border-accent-line bg-accent-soft text-fg-0"
              : "border-line-0 bg-bg-1 text-fg-1 hover:border-line-1 hover:text-fg-0",
          )}
        >
          <ProviderLogo provider={model.provider} size={13} className="text-fg-0" />
          <span className="max-w-[104px] truncate">{model.name}</span>
          {settings.fast && model.fast && (
            <Zap size={11} className="fill-accent text-accent" strokeWidth={2.4} />
          )}
          <ChevronDown size={12} className={cn("text-fg-3 transition-transform", open && "rotate-180")} />
        </button>
      </Tooltip>

      <Popover
        open={open}
        onClose={close}
        anchorRef={anchorRef}
        returnFocusRef={triggerRef}
        label="Choose a model"
        className="w-[428px]"
      >
        <div className="flex items-center gap-2 border-b border-line-0 px-3 py-2">
          <Search size={13} className="text-fg-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search models, or try “fast”, “thinking”, “1m”…"
            className="flex-1 bg-transparent text-[12.5px] text-fg-0 placeholder:text-fg-3 focus:outline-none"
            aria-label="Search models"
            role="combobox"
            aria-expanded="true"
            aria-controls="model-list"
            aria-activedescendant={`model-${cursor}`}
          />
          <Kbd keys={["Esc"]} />
        </div>

        <div className="flex h-[312px]">
          <div
            id="model-list"
            role="listbox"
            ref={listRef}
            className="w-[236px] shrink-0 overflow-y-auto border-r border-line-0 py-1.5"
          >
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-[12px] text-fg-3">No models match “{query}”.</p>
            )}
            {groups.map((g) => (
              <div key={g.key} className="mb-1">
                <div className="px-3 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-fg-3">
                  {g.title}
                </div>
                {g.models.map((m) => {
                  const key = `${g.key}:${m.id}`;
                  const isCursor = key === cursor;
                  const selected = m.id === model.id;
                  const pinned = settings.pinned.includes(m.id);
                  return (
                    <div
                      key={key}
                      id={`model-${key}`}
                      data-key={key}
                      role="option"
                      aria-selected={selected}
                      onPointerMove={() => setCursor(key)}
                      onClick={() => choose(m.id)}
                      className={cn(
                        "group mx-1.5 flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[12.5px]",
                        isCursor ? "bg-bg-4 text-fg-0" : "text-fg-1",
                      )}
                    >
                      <ProviderLogo provider={m.provider} size={13} />
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.tags.includes("new") && <TagPill tag="new" />}
                      <button
                        type="button"
                        aria-label={pinned ? "Unpin" : "Pin"}
                        aria-pressed={pinned}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(m.id);
                        }}
                        className={cn(
                          "focus-ring rounded p-0.5 text-fg-3 hover:text-fg-0",
                          pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <Pin size={11} className={cn(pinned && "fill-fg-2 text-fg-2")} />
                      </button>
                      {selected && <Check size={13} className="text-accent" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-1 bg-bg-3 text-fg-0">
                <ProviderLogo provider={cursorModel.provider} size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-fg-0">{cursorModel.name}</div>
                <div className="text-[11px] text-fg-3">{providerLabel(cursorModel.provider)}</div>
              </div>
            </div>
            <p className="text-[11.5px] leading-[1.5] text-fg-2">{cursorModel.description}</p>
            <div className="flex flex-col gap-1.5">
              <Bar label="Speed" value={cursorModel.speed} />
              <Bar label="Depth" value={cursorModel.depth} />
              <Bar label="Cost" value={cursorModel.cost} />
            </div>
            <div className="flex flex-wrap gap-1">
              {cursorModel.tags.filter((t) => t !== "new").map((t) => (
                <TagPill key={t} tag={t} />
              ))}
              {cursorModel.efforts.length > 0 && (
                <span className="rounded-[4px] border border-line-1 px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide text-fg-2">
                  Effort {EFFORT_SHORT[cursorModel.efforts[0]]}–{EFFORT_SHORT[cursorModel.efforts[cursorModel.efforts.length - 1]]}
                </span>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between text-[10.5px] text-fg-3">
              <span className="flex items-center gap-1">
                <Kbd keys={["↑", "↓"]} /> navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd keys={["↵"]} /> select
              </span>
              <span className="flex items-center gap-1">
                <Kbd keys={["⌘", "P"]} /> pin
              </span>
            </div>
          </div>
        </div>
      </Popover>
    </div>
  );
}
