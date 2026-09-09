"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Repeat, Star } from "lucide-react";
import { Popover } from "radix-ui";
import { CursorMark } from "@/components/brand/CursorMark";
import { Kbd } from "@/components/ui/Kbd";
import { Tip } from "@/components/ui/Tip";
import { useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/cn";
import { EFFORTS, EFFORT_LIST, effortRank, usageLabel } from "@/lib/effort";
import { ROUTER_PREFERENCES } from "@/lib/models";

const BAR_MIN = 4;
const BAR_MAX = 15;

/** Accelerating repeat while a button is held down. */
function useHoldRepeat(onTick: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delay = useRef(300);

  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    delay.current = 300;
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(() => {
    onTick();
    const schedule = () => {
      timer.current = setTimeout(() => {
        onTick();
        delay.current = Math.max(60, delay.current * 0.72);
        schedule();
      }, delay.current);
    };
    clear();
    delay.current = 360;
    schedule();
  }, [clear, onTick]);

  return { start, stop: clear };
}

export function EffortDial() {
  const {
    state,
    model,
    supportedEfforts,
    hasEffortDial,
    setEffort,
    nudgeEffort,
    swapStarredEffort,
    toggleStarEffort,
    setRouterPreference,
  } = useAgent();

  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);

  const effort = state.effort;
  const current = effort === null ? null : EFFORTS[effort];
  const ordered = [...supportedEfforts].sort((a, b) => effortRank(a) - effortRank(b));
  const activeIndex = effort === null ? -1 : ordered.indexOf(effort);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (track === null || ordered.length === 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(1, rect.width);
      const index = Math.round(ratio * (ordered.length - 1));
      const clamped = Math.min(Math.max(index, 0), ordered.length - 1);
      const next = ordered[clamped];
      if (next !== state.effort) setEffort(next);
    },
    [ordered, setEffort, state.effort],
  );

  // Native listener so the wheel gesture can cancel page scroll.
  useEffect(() => {
    const node = pillRef.current;
    if (node === null || !hasEffortDial) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 2) return;
      nudgeEffort(delta < 0 ? 1 : -1);
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [hasEffortDial, nudgeEffort]);

  const decrease = useCallback(() => nudgeEffort(-1), [nudgeEffort]);
  const increase = useCallback(() => nudgeEffort(1), [nudgeEffort]);
  const hold = useHoldRepeat(increase);
  const holdDown = useHoldRepeat(decrease);

  if (!hasEffortDial) {
    if (model.isRouter) {
      const preference =
        ROUTER_PREFERENCES.find((item) => item.id === state.routerPreference) ??
        ROUTER_PREFERENCES[1];
      return (
        <Popover.Root>
          <Tip
            label="Optimise for"
            hint="Auto has no effort dial — tell the router what to weigh instead."
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                className="flex h-7 items-center gap-1.5 rounded-full border border-line bg-ink-850/80 px-2.5 text-[11.5px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                <span className="text-fg-subtle">Optimise</span>
                <span className="font-medium text-fg">{preference.label}</span>
              </button>
            </Popover.Trigger>
          </Tip>
          <Popover.Portal>
            <Popover.Content
              side="top"
              align="start"
              sideOffset={10}
              className="z-50 w-[248px] rounded-panel border border-line bg-ink-850/95 p-1.5 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl data-[state=open]:animate-pop"
            >
              {ROUTER_PREFERENCES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRouterPreference(item.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-[9px] px-2.5 py-2 text-left transition-colors",
                    item.id === state.routerPreference
                      ? "bg-agent/15 text-fg"
                      : "text-fg-muted hover:bg-ink-800",
                  )}
                >
                  <span className="text-[12px] font-medium">{item.label}</span>
                  <span className="text-[11px] text-fg-subtle">{item.blurb}</span>
                </button>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    return (
      <Tip
        label="No reasoning dial"
        hint={`${model.name} — ${model.effortNote ?? "this model has no effort parameter."}`}
      >
        <span className="flex h-7 cursor-default items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 text-[11.5px] text-fg-faint">
          <span className="flex items-end gap-[3px]" aria-hidden>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="w-[3px] rounded-full bg-ink-600"
                style={{ height: BAR_MIN + index * 2 }}
              />
            ))}
          </span>
          Effort n/a
        </span>
      </Tip>
    );
  }

  const accent = current?.color ?? "#7b8cff";
  const intensity = current?.intensity ?? 0.5;
  const otherStarred = state.starred.find(
    (id) => id !== state.effort && supportedEfforts.includes(id),
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div
          ref={pillRef}
          role="slider"
          tabIndex={0}
          aria-label="Reasoning effort"
          aria-valuemin={0}
          aria-valuemax={ordered.length - 1}
          aria-valuenow={activeIndex}
          aria-valuetext={current?.label}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              nudgeEffort(1);
            } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              nudgeEffort(-1);
            } else if (event.key === "Home") {
              event.preventDefault();
              setEffort(ordered[0]);
            } else if (event.key === "End") {
              event.preventDefault();
              setEffort(ordered[ordered.length - 1]);
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((value) => !value);
            }
          }}
          className={cn(
            "group relative flex h-7 cursor-ew-resize items-center gap-2 rounded-full border px-2.5 transition-colors duration-200 select-none",
            dragging || open
              ? "border-line-strong bg-ink-800"
              : "border-line bg-ink-850/80 hover:border-line-strong",
          )}
          style={{
            boxShadow: dragging
              ? `0 0 0 1px color-mix(in oklab, ${accent} 30%, transparent), 0 0 22px -8px ${accent}`
              : undefined,
          }}
        >
          {/* Keyed so every level change replays as a one-shot flash. */}
          <motion.span
            key={`flash-${effort}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 0 1px ${accent}, 0 0 26px -8px ${accent}` }}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />

          <CursorMark
            key={`mark-${effort}`}
            size={13}
            accent={accent}
            state={dragging ? "working" : "settle"}
            speed={0.8 + intensity * 2.4}
          />

          <div
            ref={trackRef}
            className="flex h-full items-end gap-[3px] py-[6px]"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              setFromClientX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (!dragging) return;
              setFromClientX(event.clientX);
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              setDragging(false);
            }}
            onPointerCancel={() => setDragging(false)}
          >
            {ordered.map((id, index) => {
              const meta = EFFORTS[id];
              const filled = index <= activeIndex;
              const height =
                BAR_MIN + ((BAR_MAX - BAR_MIN) * index) / Math.max(1, ordered.length - 1);
              return (
                <motion.span
                  key={id}
                  className="w-[3px] rounded-full"
                  animate={{
                    height,
                    backgroundColor: filled ? meta.color : "#2f343d",
                    opacity: filled ? 1 : 0.85,
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  style={{
                    boxShadow:
                      filled && index === activeIndex ? `0 0 8px -1px ${meta.color}` : undefined,
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            onDoubleClick={(event) => {
              event.preventDefault();
              swapStarredEffort();
            }}
            aria-label={`Reasoning effort: ${current?.label}. Open effort panel`}
            className="-mx-0.5 cursor-pointer text-[11.5px] leading-none font-medium tracking-tight"
            style={{ color: accent }}
          >
            {current?.short}
          </button>

          {state.fast ? (
            <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-fast/20" />
          ) : null}
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={12}
          className="z-50 w-[306px] overflow-hidden rounded-panel border border-line bg-ink-850/95 shadow-[0_28px_70px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl data-[state=open]:animate-pop"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <span className="text-[11px] font-medium tracking-wide text-fg-muted uppercase">
              Reasoning effort
            </span>
            <Kbd keys={["⌘", "⇧", "/"]} />
          </div>

          <div className="p-1.5">
            {EFFORT_LIST.map((meta) => {
              const supported = supportedEfforts.includes(meta.id);
              const active = meta.id === state.effort;
              const starred = state.starred.includes(meta.id);
              return (
                <div
                  key={meta.id}
                  className={cn(
                    "group/row flex items-center gap-2 rounded-[9px] px-2 py-1.5 transition-colors",
                    active ? "bg-ink-800" : supported ? "hover:bg-ink-800/70" : "opacity-40",
                  )}
                  style={
                    active
                      ? { boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${meta.color} 40%, transparent)` }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    disabled={!supported}
                    onClick={() => setEffort(meta.id)}
                    title={supported ? undefined : `${model.name} doesn't offer ${meta.label}`}
                    className="flex flex-1 items-center gap-2.5 text-left disabled:cursor-not-allowed"
                  >
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] text-[9.5px] font-semibold"
                      style={{
                        background: `color-mix(in oklab, ${meta.color} ${active ? 90 : 22}%, transparent)`,
                        color: active ? "#0b0c0f" : meta.color,
                      }}
                    >
                      {meta.tick}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-[12px]",
                        active ? "font-medium text-fg" : "text-fg-muted",
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-fg-faint">{meta.latency}</span>
                    <span className="w-[52px] text-right font-mono text-[10px] text-fg-subtle">
                      {Math.round(meta.usageMultiplier * (state.fast ? 2 : 1) * 10) / 10}×
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!supported}
                    onClick={() => toggleStarEffort(meta.id)}
                    aria-label={starred ? `Unstar ${meta.label}` : `Star ${meta.label}`}
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-[6px] transition-all",
                      starred
                        ? "text-fast opacity-100"
                        : "text-fg-faint opacity-0 group-hover/row:opacity-100 hover:text-fg-muted focus-visible:opacity-100",
                    )}
                  >
                    <Star size={11} fill={starred ? "currentColor" : "none"} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-line bg-ink-900/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-line bg-ink-850 p-0.5">
                <button
                  type="button"
                  aria-label="Lower effort"
                  onPointerDown={holdDown.start}
                  onPointerUp={holdDown.stop}
                  onPointerLeave={holdDown.stop}
                  className="grid h-5 w-5 place-items-center rounded-full text-fg-muted transition-colors hover:bg-ink-750 hover:text-fg active:scale-95"
                >
                  <Minus size={12} />
                </button>
                <button
                  type="button"
                  aria-label="Raise effort"
                  onPointerDown={hold.start}
                  onPointerUp={hold.stop}
                  onPointerLeave={hold.stop}
                  className="grid h-5 w-5 place-items-center rounded-full text-fg-muted transition-colors hover:bg-ink-750 hover:text-fg active:scale-95"
                >
                  <Plus size={12} />
                </button>
              </div>
              <span className="text-[10.5px] text-fg-faint">hold to ramp</span>
              <span className="flex-1" />
              <span className="font-mono text-[10.5px] text-fg-subtle">
                {effort === null ? "" : usageLabel(effort, state.fast)}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={state.effort ?? "none"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="mt-2 text-[11.5px] leading-relaxed text-fg-muted"
              >
                {current?.blurb}
              </motion.p>
            </AnimatePresence>

            {otherStarred !== undefined ? (
              <button
                type="button"
                onClick={swapStarredEffort}
                className="mt-2.5 flex w-full items-center gap-1.5 rounded-[8px] border border-line bg-ink-850 px-2 py-1.5 text-[11px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                <Repeat size={11} />
                Flip to {EFFORTS[otherStarred].label}
                <span className="flex-1" />
                <Kbd keys={["⌘", "⇧", "E"]} />
              </button>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
