"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import { CursorMark } from "@/components/brand/CursorMark";
import { Kbd } from "@/components/ui/Kbd";
import { Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import {
  EFFORT_HINT,
  EFFORT_LABEL,
  EFFORT_SHORT,
  type EffortLevel,
} from "@/lib/effort";
import { SHORTCUTS } from "@/lib/shortcuts";
import { useAgentActions, useAgentState, useCurrentModel } from "@/lib/store";

function Meter({ levels, index, className }: { levels: number; index: number; className?: string }) {
  return (
    <span className={cn("flex items-end gap-[2px]", className)} aria-hidden>
      {Array.from({ length: levels }).map((_, i) => (
        <motion.span
          key={i}
          animate={{ opacity: i <= index ? 1 : 0.28 }}
          transition={{ duration: 0.18 }}
          className="w-[3px] rounded-[1px] bg-current"
          style={{ height: 4 + i * 2 }}
        />
      ))}
    </span>
  );
}

export function EffortControl() {
  const { settings, panel } = useAgentState();
  const { setPanel, setEffort, stepEffort } = useAgentActions();
  const model = useCurrentModel();
  const levels = model.efforts;
  const level = settings.effort;
  const index = level ? levels.indexOf(level) : -1;
  const open = panel === "effort";

  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [charging, setCharging] = useState(false);
  const [dragging, setDragging] = useState(false);

  const close = useCallback(() => setPanel(null), [setPanel]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => railRef.current?.focus());
  }, [open]);

  const stopHold = useCallback(() => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    setCharging(false);
  }, []);

  useEffect(() => stopHold, [stopHold]);

  useEffect(() => {
    if (!charging) return;
    window.addEventListener("pointerup", stopHold);
    return () => window.removeEventListener("pointerup", stopHold);
  }, [charging, stopHold]);

  if (levels.length === 0) {
    return (
      <Tooltip
        label={
          model.id === "auto"
            ? "Auto picks a reasoning depth per request"
            : `${model.name} sets its own reasoning depth`
        }
      >
        <span className="flex h-7 cursor-default items-center gap-1.5 rounded-lg border border-dashed border-line-1 px-2 text-[12px] text-fg-3">
          <Meter levels={4} index={-1} />
          Auto
        </span>
      </Tooltip>
    );
  }

  const levelFromX = (clientX: number): EffortLevel => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return levels[index];
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return levels[Math.round(ratio * (levels.length - 1))];
  };

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setEffort(levelFromX(e.clientX));
  };
  const onTrackPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const next = levelFromX(e.clientX);
    if (next !== level) setEffort(next);
  };
  const onTrackPointerUp = () => setDragging(false);

  const startHold = (delta: number) => {
    stepEffort(delta);
    setCharging(delta > 0);
    holdTimer.current = setInterval(() => stepEffort(delta), 460);
  };

  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) < 2 && Math.abs(e.deltaX) < 2) return;
    stepEffort(e.deltaY < 0 || e.deltaX > 0 ? 1 : -1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      stepEffort(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      stepEffort(-1);
    } else if (e.key === "Home") {
      setEffort(levels[0]);
    } else if (e.key === "End") {
      setEffort(levels[levels.length - 1]);
    } else if (e.key === "Enter") {
      close();
    }
  };

  const fill = level ? Math.ceil(((index + 1) / levels.length) * 3) : 0;
  const pct = levels.length > 1 ? (index / (levels.length - 1)) * 100 : 100;

  return (
    <div ref={anchorRef} className="relative">
      <Tooltip label="Reasoning effort · scroll to adjust" keys={SHORTCUTS.effortUp.keys} disabled={open}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Effort: ${level ? EFFORT_LABEL[level] : "none"}`}
          onWheel={onWheel}
          onClick={() => setPanel(open ? null : "effort")}
          className={cn(
            "focus-ring flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[12px] font-medium transition-colors",
            open
              ? "border-accent-line bg-accent-soft text-fg-0"
              : "border-line-0 bg-bg-1 text-fg-1 hover:border-line-1 hover:text-fg-0",
          )}
        >
          <Meter levels={levels.length} index={index} className="text-accent" />
          <motion.span
            key={level}
            initial={{ y: 4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.16 }}
          >
            {level ? EFFORT_SHORT[level] : "—"}
          </motion.span>
        </button>
      </Tooltip>

      <Popover
        open={open}
        onClose={close}
        anchorRef={anchorRef}
        returnFocusRef={triggerRef}
        label="Reasoning effort"
        align="end"
        className="w-[296px] p-3.5"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-line-1 bg-bg-3">
            <CursorMark size={22} fill={fill} state={charging ? "working" : "idle"} speed={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold text-fg-0">Effort</span>
              <motion.span
                key={level}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[12px] font-semibold text-accent"
              >
                {level ? EFFORT_LABEL[level] : ""}
              </motion.span>
            </div>
            <motion.p
              key={`${level}-hint`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-0.5 text-[11px] text-fg-3"
            >
              {level ? EFFORT_HINT[level] : ""}
            </motion.p>
          </div>
        </div>

        <div
          ref={railRef}
          tabIndex={0}
          role="slider"
          aria-label="Reasoning effort"
          aria-valuemin={0}
          aria-valuemax={levels.length - 1}
          aria-valuenow={index}
          aria-valuetext={level ? EFFORT_LABEL[level] : undefined}
          onKeyDown={onKeyDown}
          onWheel={onWheel}
          className="focus-ring mt-3.5 flex items-center gap-2 rounded-md"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Less effort"
            disabled={index <= 0}
            onClick={() => stepEffort(-1)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line-1 bg-bg-3 text-fg-1 hover:text-fg-0 disabled:opacity-30"
          >
            <Minus size={12} />
          </button>

          <div
            ref={trackRef}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerUp}
            onPointerCancel={onTrackPointerUp}
            className={cn("relative flex-1 touch-none py-2.5", dragging ? "cursor-grabbing" : "cursor-pointer")}
          >
            <div className="relative h-[6px] rounded-full bg-bg-4">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                className="absolute inset-y-0 left-0 rounded-full bg-accent/80"
              />
              {levels.map((l, i) => (
                <span
                  key={l}
                  className={cn(
                    "absolute top-1/2 h-[10px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full",
                    i <= index ? "bg-bg-0/60" : "bg-fg-3/60",
                  )}
                  style={{ left: `${(i / (levels.length - 1)) * 100}%` }}
                />
              ))}
              <motion.div
                animate={{ left: `${pct}%`, scale: dragging ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-bg-0 shadow-[0_0_0_4px_rgb(var(--accent)/0.15)]"
              />
            </div>
            <div className="mt-2 flex justify-between px-px text-[10px] text-fg-3">
              {levels.map((l, i) => (
                <button
                  key={l}
                  type="button"
                  tabIndex={-1}
                  onClick={() => setEffort(l)}
                  className={cn(
                    "-mx-1 px-1 hover:text-fg-1",
                    i === index && "font-semibold text-fg-1",
                  )}
                >
                  {EFFORT_SHORT[l]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            aria-label="More effort (hold to charge)"
            disabled={index >= levels.length - 1 && !charging}
            onPointerDown={(e) => {
              e.preventDefault();
              startHold(1);
            }}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            className={cn(
              "relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border text-fg-1 hover:text-fg-0 disabled:opacity-30",
              charging ? "border-accent-line bg-accent-soft text-accent" : "border-line-1 bg-bg-3",
            )}
          >
            {charging && (
              <motion.span
                key={index}
                initial={{ height: "0%" }}
                animate={{ height: "100%" }}
                transition={{ duration: 0.46, ease: "linear" }}
                className="absolute inset-x-0 bottom-0 bg-accent/25"
              />
            )}
            <Plus size={12} className="relative" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10.5px] text-fg-3">
          <span>Drag, scroll, or hold + to charge</span>
          <span className="flex items-center gap-1">
            <Kbd keys={["⌥", "↑"]} /> <Kbd keys={["⌥", "↓"]} />
          </span>
        </div>
      </Popover>
    </div>
  );
}
