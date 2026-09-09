"use client"

import { CursorMark, EffortRings } from "@/components/agent-window/cursor-logo"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EFFORT_LABEL, EFFORT_LEVELS, type EffortLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

function indexOf(level: EffortLevel) {
  return EFFORT_LEVELS.indexOf(level)
}

export function EffortControl({
  value,
  onChange,
}: {
  value: EffortLevel
  onChange: (level: EffortLevel) => void
}) {
  const [open, setOpen] = useState(false)
  const [charging, setCharging] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)
  const holdRef = useRef<number | null>(null)
  const dragging = useRef(false)
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    return () => {
      if (holdRef.current) {
        window.clearTimeout(holdRef.current)
        window.clearInterval(holdRef.current)
      }
    }
  }, [])

  function setFromClientX(clientX: number) {
    const rail = railRef.current
    if (!rail) return
    const rect = rail.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const next = EFFORT_LEVELS[Math.round(t * (EFFORT_LEVELS.length - 1))]
    onChange(next)
  }

  function startCharge() {
    setCharging(true)
    if (holdRef.current) {
      window.clearTimeout(holdRef.current)
      window.clearInterval(holdRef.current)
    }
    const bump = () => {
      const i = indexOf(valueRef.current)
      onChange(EFFORT_LEVELS[Math.min(EFFORT_LEVELS.length - 1, i + 1)])
    }
    holdRef.current = window.setTimeout(() => {
      bump()
      holdRef.current = window.setInterval(bump, 480)
    }, 260)
  }

  function stopCharge() {
    setCharging(false)
    if (holdRef.current) {
      window.clearTimeout(holdRef.current)
      window.clearInterval(holdRef.current)
      holdRef.current = null
    }
  }

  const idx = indexOf(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            type="button"
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-zinc-200 hover:bg-white/5 aria-expanded:bg-white/8"
            aria-label={`Effort ${EFFORT_LABEL[value]}`}
          >
            <EffortRings level={idx} size={22} />
            <span className="hidden font-medium md:inline">{EFFORT_LABEL[value]}</span>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Effort · ⌥↑ ⌥↓</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[320px] gap-3 overflow-visible p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-zinc-100">Effort</p>
            <p className="text-[12px] text-zinc-500">
              Drag the cube, or hold it to charge.
            </p>
          </div>
          <span className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
            {EFFORT_LABEL[value]}
          </span>
        </div>

        <div className="px-4">
          <div
            ref={railRef}
            className="relative mt-1 h-12 cursor-ew-resize touch-none select-none"
            onPointerDown={(event) => {
              dragging.current = true
              event.currentTarget.setPointerCapture(event.pointerId)
              setFromClientX(event.clientX)
            }}
            onPointerMove={(event) => {
              if (!dragging.current) return
              setFromClientX(event.clientX)
            }}
            onPointerUp={() => {
              dragging.current = false
            }}
          >
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
              style={{
                background:
                  "linear-gradient(90deg, #3f3f46 0%, #a1a1aa 55%, #fafafa 100%)",
              }}
            />
            {EFFORT_LEVELS.map((level, tick) => (
              <button
                key={level}
                type="button"
                className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300"
                style={{ left: `${(tick / (EFFORT_LEVELS.length - 1)) * 100}%` }}
                onClick={() => onChange(level)}
                aria-label={EFFORT_LABEL[level]}
              />
            ))}
            <button
              type="button"
              className={cn(
                "absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-zinc-950 ring-1 ring-white/20 shadow-[0_0_24px_rgba(255,255,255,0.12)]"
              )}
              style={{ left: `${(idx / (EFFORT_LEVELS.length - 1)) * 100}%` }}
              onPointerDown={(event) => {
                event.stopPropagation()
                startCharge()
              }}
              onPointerUp={stopCharge}
              onPointerCancel={stopCharge}
              onPointerLeave={stopCharge}
              aria-label="Hold to increase effort"
            >
              <span className={cn(charging && "scale-110 transition-transform")}>
                <CursorMark className={cn("size-4 text-white", charging && "animate-pulse")} />
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-between text-[10px] tracking-wide text-zinc-500 uppercase">
          <span>Low</span>
          <span>Max</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
