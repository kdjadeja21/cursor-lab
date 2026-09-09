"use client";

import { useId } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * The Cursor mark, decomposed so each isometric face can be lit separately.
 * OUTER + HOLE with an even-odd fill reproduces the official silhouette; the
 * two face polygons tile the cut-out region so it can be rendered as glass.
 */
const OUTER =
  "M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0";
const HOLE =
  "M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23";
const FACE_TOP = "M2.66 6.34H21.21L12 12.33Z";
const FACE_RIGHT = "M21.21 6.34 12.23 22.92 12 12.33Z";
const INK = `${OUTER} ${HOLE}`;

export type MarkState = "idle" | "thinking" | "working" | "settle" | "error";

type CursorMarkProps = {
  /** Rendered pixel size of the square mark. */
  size?: number;
  state?: MarkState;
  /** Animation rate multiplier. Fast mode and high effort push this up. */
  speed?: number;
  /** Drives the ink gradient, the face glass and the halo. */
  accent?: string;
  /** Soft halo behind the mark. */
  glow?: boolean;
  label?: string;
  className?: string;
};

export function CursorMark({
  size = 20,
  state = "idle",
  speed = 1,
  accent = "#cfd5e1",
  glow = false,
  label,
  className,
}: CursorMarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduced = useReducedMotion();
  const rate = Math.max(0.25, speed);
  const animated = !reduced && (state === "thinking" || state === "working");

  const loop = (duration: number, delay = 0): Transition => ({
    duration: duration / rate,
    delay,
    repeat: Infinity,
    ease: "easeInOut",
  });

  const faceGlass = (index: number) => {
    if (reduced || state === "idle" || state === "error") {
      return { animate: { opacity: 0.2 + index * 0.06 }, transition: { duration: 0.3 } };
    }
    if (state === "settle") {
      return { animate: { opacity: 0.34 }, transition: { duration: 0.5 } };
    }
    // Light appears to orbit the cube: faces brighten in sequence.
    return {
      animate: { opacity: [0.14, 0.72, 0.14] },
      transition: loop(state === "working" ? 1.5 : 2.2, (index * 0.22) / rate),
    };
  };

  const shellAnimate = (() => {
    if (reduced) return { scale: 1, rotate: 0, opacity: 1 };
    switch (state) {
      case "thinking":
        return { scale: [1, 1.05, 1], rotate: 0, opacity: 1 };
      case "working":
        return { scale: [1, 1.08, 1], rotate: [0, 2.5, 0, -2.5, 0], opacity: 1 };
      case "settle":
        return { scale: [1.18, 1], rotate: 0, opacity: 1 };
      case "error":
        return { scale: 1, rotate: [0, -6, 6, -3, 0], opacity: 1 };
      case "idle":
        return { scale: 1, rotate: 0, opacity: 1 };
      default: {
        const never: never = state;
        return never;
      }
    }
  })();

  const shellTransition: Transition = (() => {
    switch (state) {
      case "thinking":
        return loop(2.6);
      case "working":
        return loop(1.8);
      case "settle":
        return { type: "spring", stiffness: 460, damping: 14 };
      case "error":
        return { duration: 0.42, ease: "easeInOut" };
      case "idle":
        return { duration: 0.3 };
      default: {
        const never: never = state;
        return never;
      }
    }
  })();

  const inkTop = state === "error" ? "#ffd9dc" : "#ffffff";
  const inkBottom = state === "error" ? "#f8737f" : accent;

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {glow ? (
        <motion.span
          className="pointer-events-none absolute -inset-[55%] rounded-full blur-[10px]"
          style={{
            background: `radial-gradient(circle, ${state === "error" ? "#f8737f" : accent}55 0%, transparent 68%)`,
          }}
          animate={animated ? { opacity: [0.35, 0.9, 0.35] } : { opacity: 0.4 }}
          transition={animated ? loop(2.1) : { duration: 0.3 }}
        />
      ) : null}

      <motion.svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="relative overflow-visible"
        animate={shellAnimate}
        transition={shellTransition}
      >
        <defs>
          <linearGradient id={`ink-${uid}`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={inkTop} />
            <stop offset="100%" stopColor={inkBottom} />
          </linearGradient>
          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clip-${uid}`}>
            <path d={OUTER} />
          </clipPath>
        </defs>

        <motion.path d={FACE_TOP} fill={accent} {...faceGlass(0)} />
        <motion.path d={FACE_RIGHT} fill={accent} {...faceGlass(1)} />
        <path d={INK} fillRule="evenodd" fill={`url(#ink-${uid})`} />

        {animated ? (
          <g clipPath={`url(#clip-${uid})`}>
            <motion.rect
              y="-6"
              width="7"
              height="36"
              fill={`url(#sheen-${uid})`}
              style={{ rotate: -18, transformOrigin: "center" }}
              initial={{ x: -14 }}
              animate={{ x: [-14, 26] }}
              transition={{
                duration: (state === "working" ? 1.3 : 1.9) / rate,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.15,
              }}
            />
          </g>
        ) : null}
      </motion.svg>
    </span>
  );
}

/** Static, single-colour mark for dense rows and favicons. */
export function CursorGlyph({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d={INK} fillRule="evenodd" fill="currentColor" />
    </svg>
  );
}
