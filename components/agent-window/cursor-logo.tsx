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

export function CursorCubeSvg({ className }: { className?: string }) {
  const gid = useId()
  return (
    <svg viewBox="0 0 120 132" className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id={`${gid}-left`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${gid}-right`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <filter id={`${gid}-shadow`} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${gid}-shadow)`}>
        <path d="M60 8 L112 38 L60 68 L8 38 Z" fill={`url(#${gid}-top)`} />
        <path d="M8 38 L60 68 L60 124 L8 94 Z" fill={`url(#${gid}-left)`} />
        <path d="M60 68 L112 38 L112 94 L60 124 Z" fill={`url(#${gid}-right)`} />
        <path
          d="M60 8 L112 38 L60 68 L8 38 Z"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.8"
        />
        <g transform="translate(74 56)">
          <path
            fill="#fff"
            d="M0 1.2 0 31.4 8.6 23.6 14.2 37.2 18.8 35.2 13.4 21.8 24.2 21.8Z"
          />
        </g>
      </g>
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
  const rings = size < 44 ? 0 : Math.min(size >= 72 ? 4 : 2, Math.max(0, intensity))

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
            inset: `${-8 - index * 7}px`,
            opacity: 0.2 + index * 0.1,
          }}
        />
      ))}
      <span className="cursor-glow" />
      <CursorCubeSvg className="cursor-iso" />
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
