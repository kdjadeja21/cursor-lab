"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type CursorMarkState = "idle" | "thinking" | "working" | "done" | "error";

type Props = {
  state?: CursorMarkState;
  /** 1 = default cadence. Higher is faster. */
  speed?: number;
  size?: number;
  className?: string;
  /** Number of faces filled (0-3). Used by the effort control to "charge" the cube. */
  fill?: number;
  title?: string;
};

const TOP = "M12 2 L20.66 7 L12 12 L3.34 7 Z";
const LEFT = "M3.34 7 L12 12 L12 22 L3.34 17 Z";
const RIGHT = "M12 12 L20.66 7 L20.66 17 L12 22 Z";
const OUTLINE = "M12 2 L20.66 7 L20.66 17 L12 22 L3.34 17 L3.34 7 Z";
const EDGES = "M12 12 L12 22 M12 12 L20.66 7 M12 12 L3.34 7";

const FACES = [TOP, RIGHT, LEFT] as const;

function faceOpacity(state: CursorMarkState, index: number, fill?: number) {
  if (fill !== undefined) return index < fill ? 0.95 : 0.12;
  switch (state) {
    case "idle":
      return [0.9, 0.45, 0.22][index];
    case "done":
      return 0.9;
    case "error":
      return [0.9, 0.5, 0.3][index];
    case "thinking":
    case "working":
      return 0.35;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

export function CursorMark({
  state = "idle",
  speed = 1,
  size = 20,
  className,
  fill,
  title,
}: Props) {
  const animating = state === "thinking" || state === "working";
  const base = state === "working" ? 1.05 : 1.6;
  const duration = base / Math.max(0.25, speed);
  const color =
    state === "error" ? "rgb(248 113 113)" : "rgb(var(--accent))";

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? "img" : "presentation"}
      aria-label={title}
      className={cn(
        "shrink-0 transition-[filter] duration-500",
        animating && "[animation:cube-glow_var(--d)_ease-in-out_infinite]",
        state === "done" && "[animation:breathe_0.7s_ease-out_1]",
        className,
      )}
      style={{ color, ["--d" as string]: `${duration * 2}s` } as CSSProperties}
    >
      {FACES.map((d, i) => (
        <path
          key={d}
          d={d}
          fill="currentColor"
          style={
            {
              opacity: faceOpacity(state, i, fill),
              transition: "opacity 320ms ease",
              animation: animating
                ? `cube-face ${duration}s ease-in-out ${(-i * duration) / 3}s infinite`
                : undefined,
            } as CSSProperties
          }
        />
      ))}
      <path
        d={OUTLINE}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <path
        d={EDGES}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.75}
      />
    </svg>
  );
}
