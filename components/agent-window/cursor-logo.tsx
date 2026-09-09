"use client"

import { cn } from "@/lib/utils"
import { useId } from "react"

const CURSOR_MARK =
  "M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"

export function CursorMark({
  className,
  title = "Cursor",
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={CURSOR_MARK} />
    </svg>
  )
}

export type CubeMotion = "idle" | "think" | "stream" | "charge"

export function CursorLogo({
  size = 48,
  motion = "idle",
  intensity = 2,
  form = "auto",
  className,
}: {
  size?: number
  motion?: CubeMotion
  intensity?: number
  form?: "auto" | "mark" | "cube"
  className?: string
}) {
  const renderCube = form === "cube" || (form === "auto" && size >= 28)
  const rings =
    size < 40 ? 0 : Math.min(size >= 72 ? 5 : 3, Math.max(0, intensity))

  if (!renderCube) {
    return (
      <span
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <CursorMark className="size-[78%] text-zinc-100" />
      </span>
    )
  }

  return (
    <span
      className={cn("cursor-logo", `is-${motion}`, className)}
      style={{ width: size, height: size, ["--cube" as string]: `${size}px` }}
      aria-hidden
    >
      {Array.from({ length: rings }).map((_, index) => (
        <span
          key={index}
          className="cursor-orbit"
          style={{
            animationDelay: `${index * 0.18}s`,
            inset: `${-6 - index * 5}px`,
            opacity: 0.22 + index * 0.08,
          }}
        />
      ))}
      <span className="cursor-glow" />
      <span className="cursor-scene">
        <span className="cursor-cube">
          <span className="cursor-face front">
            <CursorMark className="size-[58%] text-white" />
          </span>
          <span className="cursor-face back" />
          <span className="cursor-face right" />
          <span className="cursor-face left" />
          <span className="cursor-face top" />
          <span className="cursor-face bottom" />
        </span>
      </span>
    </span>
  )
}

export function EffortRings({
  level,
  size = 28,
  charging = false,
  className,
}: {
  level: number
  size?: number
  charging?: boolean
  className?: string
}) {
  const gid = useId()
  const rings = level + 1
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        className={cn("absolute inset-0", charging && "animate-spin")}
        style={{ animationDuration: charging ? "1.2s" : undefined }}
        aria-hidden
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const r = 6 + index * 2.4
          const active = index < rings
          return (
            <circle
              key={index}
              cx="16"
              cy="16"
              r={r}
              fill="none"
              stroke={active ? `url(#${gid})` : "rgba(255,255,255,0.08)"}
              strokeWidth={active ? 1.15 : 0.8}
              className={active ? "cursor-ring-active" : undefined}
            />
          )
        })}
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>
      </svg>
      <CursorMark className="relative z-10 size-[46%] text-zinc-100" />
    </span>
  )
}
