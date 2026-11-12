"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronsUpDown, Pin, Search, Zap } from "lucide-react";
import { Popover } from "radix-ui";
import { ProviderLogo } from "@/components/brand/ProviderLogo";
import { Kbd } from "@/components/ui/Kbd";
import { Tip } from "@/components/ui/Tip";
import { useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { EFFORTS, effortRank } from "@/lib/effort";
import {
  BADGE_LABEL,
  MODELS,
  VENDOR_ORDER,
  formatContext,
  type Model,
} from "@/lib/models";

function haystack(model: Model): string {
  return [
    model.name,
    model.vendor,
    model.provider,
    ...model.badges,
    ...model.efforts,
    model.fast ? "fast" : "",
  ]
    .join(" ")
    .toLowerCase();
}

function EffortRange({ model }: { model: Model }) {
  if (model.efforts.length === 0) {
    return <span className="text-[10px] text-fg-faint">no dial</span>;
  }
  const sorted = [...model.efforts].sort((a, b) => effortRank(a) - effortRank(b));
  return (
    <span className="flex items-end gap-[2px]" aria-hidden>
      {sorted.map((id, index) => (
        <span
          key={id}
          className="w-[2.5px] rounded-full"
          style={{
            height: 4 + (7 * index) / Math.max(1, sorted.length - 1),
            background: EFFORTS[id].color,
            opacity: 0.75,
          }}
        />
      ))}
    </span>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex flex-1 flex-col gap-1">
      <span className="text-[9.5px] tracking-wide text-fg-faint uppercase">{label}</span>
      <span className="h-[3px] overflow-hidden rounded-full bg-ink-700">
        <motion.span
          className="block h-full rounded-full bg-fg-muted"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
    </span>
  );
}

export function ModelPicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, model, setModel, togglePin } = useAgent();
  const [query, setQuery] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const matches = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return MODELS;
    return MODELS.filter((candidate) => {
      const hay = haystack(candidate);
      return tokens.every((token) => hay.includes(token));
    });
  }, [query]);

  const groups = useMemo(() => {
    const pinned = matches.filter((candidate) => state.pinned.includes(candidate.id));
    const result: { label: string; models: Model[] }[] = [];
    if (pinned.length > 0 && query.length === 0) {
      result.push({ label: "Pinned", models: pinned });
    }
    for (const vendor of VENDOR_ORDER) {
      const items = matches.filter(
        (candidate) =>
          candidate.vendor === vendor &&
          !(query.length === 0 && state.pinned.includes(candidate.id)),
      );
      if (items.length > 0) result.push({ label: vendor, models: items });
    }
    return result;
  }, [matches, state.pinned, query]);

  const flat = useMemo(() => groups.flatMap((group) => group.models), [groups]);

  // Derived rather than synced: when a filter hides the highlighted row the
  // fallback chain takes over, so no effect has to reset it.
  const highlighted =
    flat.find((candidate) => candidate.id === highlightId) ??
    flat.find((candidate) => candidate.id === state.modelId) ??
    flat[0];
  const highlightIndex = flat.findIndex((candidate) => candidate.id === highlighted?.id);

  useEffect(() => {
    if (highlighted === undefined) return;
    rowRefs.current.get(highlighted.id)?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  function move(delta: number) {
    if (flat.length === 0) return;
    const next = Math.min(Math.max(highlightIndex + delta, 0), flat.length - 1);
    setHighlightId(flat[next].id);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setQuery("");
          setHighlightId(state.modelId);
        }
        onOpenChange(next);
      }}
    >
      <Tip label="Model" hint={model.blurb} keys={["⌘", "/"]}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-7 max-w-[168px] items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium transition-colors duration-200",
              open
                ? "border-line-strong bg-ink-800 text-fg"
                : "border-line bg-ink-850/80 text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            <ProviderLogo provider={model.provider} size={13} />
            <span className="truncate">{model.name}</span>
            <ChevronsUpDown size={11} className="shrink-0 text-fg-faint" />
          </button>
        </Popover.Trigger>
      </Tip>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          className="z-50 w-[392px] overflow-hidden rounded-panel border border-line bg-ink-850/95 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl data-[state=open]:animate-pop"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
            } else if (event.key === "Enter" && highlighted !== undefined) {
              event.preventDefault();
              setModel(highlighted.id);
              onOpenChange(false);
            }
          }}
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <Search size={13} className="text-fg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search models, or try “max”, “fast”, “cheap”"
              className="flex-1 bg-transparent text-[12.5px] text-fg placeholder:text-fg-faint focus:outline-none"
            />
            {query.length > 0 ? (
              <span className="font-mono text-[10px] text-fg-faint">{flat.length}</span>
            ) : (
              <Kbd keys={["↑", "↓"]} />
            )}
          </div>

          <div className="scroll-thin max-h-[286px] overflow-y-auto p-1.5">
            {groups.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-fg-subtle">
                Nothing matches “{query}”.
              </p>
            ) : null}

            {groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="px-2 pt-1.5 pb-1 text-[10px] font-medium tracking-wider text-fg-faint uppercase">
                  {group.label}
                </p>
                {group.models.map((candidate) => {
                  const selected = candidate.id === state.modelId;
                  const active = highlighted?.id === candidate.id;
                  const pinned = state.pinned.includes(candidate.id);
                  return (
                    <div key={candidate.id} className="group/row relative">
                      <button
                        ref={(node) => {
                          if (node === null) rowRefs.current.delete(candidate.id);
                          else rowRefs.current.set(candidate.id, node);
                        }}
                        type="button"
                        onMouseMove={() => {
                          if (candidate.id !== highlighted?.id) setHighlightId(candidate.id);
                        }}
                        onClick={() => {
                          setModel(candidate.id);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-[9px] py-1.5 pr-8 pl-2 text-left transition-colors",
                          active ? "bg-ink-800" : "hover:bg-ink-800/60",
                        )}
                      >
                        <ProviderLogo provider={candidate.provider} size={15} />
                        <span
                          className={cn(
                            "text-[12.5px]",
                            selected ? "font-medium text-fg" : "text-fg-muted",
                          )}
                        >
                          {candidate.name}
                        </span>
                        {candidate.badges.map((badge) => (
                          <span
                            key={badge}
                            className={cn(
                              "rounded-[5px] px-1.5 py-[1px] text-[9.5px] font-medium",
                              badge === "recommended" && "bg-agent/15 text-agent",
                              badge === "flagship" && "bg-plan/15 text-plan",
                              badge === "new" && "bg-ask/15 text-ask",
                              badge === "cheap" && "bg-ink-700 text-fg-subtle",
                              badge === "byok" && "bg-ink-700 text-fg-subtle",
                            )}
                          >
                            {BADGE_LABEL[badge]}
                          </span>
                        ))}
                        <span className="flex-1" />
                        {candidate.fast ? (
                          <Zap size={10} className="text-fast/60" strokeWidth={2.4} />
                        ) : null}
                        <EffortRange model={candidate} />
                        {selected ? (
                          <Check size={13} className="ml-1 text-agent" strokeWidth={2.6} />
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePin(candidate.id);
                        }}
                        aria-label={pinned ? `Unpin ${candidate.name}` : `Pin ${candidate.name}`}
                        className={cn(
                          "absolute top-1/2 right-1.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[7px] transition-opacity",
                          pinned
                            ? "text-fg-muted opacity-100"
                            : "text-fg-faint opacity-0 group-hover/row:opacity-100 hover:text-fg-muted focus-visible:opacity-100",
                        )}
                      >
                        <Pin
                          size={11}
                          fill={pinned ? "currentColor" : "none"}
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {highlighted !== undefined ? (
            <div className="border-t border-line bg-ink-900/70 px-3 py-2.5">
              <p className="text-[11.5px] leading-relaxed text-fg-muted">
                {highlighted.blurb}
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <MetricBar label="Speed" value={highlighted.metrics.speed} />
                <MetricBar label="Depth" value={highlighted.metrics.depth} />
                <MetricBar label="Cost" value={highlighted.metrics.cost} />
              </div>
              <div className="mt-2.5 flex items-center gap-2 font-mono text-[10px] text-fg-faint">
                <span>{formatContext(highlighted.contextTokens)}</span>
                <span className="text-ink-600">·</span>
                <span>
                  {highlighted.efforts.length === 0
                    ? (highlighted.effortNote ?? "no effort dial")
                    : `effort ${EFFORTS[highlighted.efforts[0]].label.toLowerCase()} → ${EFFORTS[
                        highlighted.efforts[highlighted.efforts.length - 1]
                      ].label.toLowerCase()}`}
                </span>
                <span className="text-ink-600">·</span>
                <span className={highlighted.fast ? "text-fast/70" : undefined}>
                  {highlighted.fast ? "Fast available" : "no Fast"}
                </span>
              </div>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
