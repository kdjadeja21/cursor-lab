"use client"

import { CursorMark } from "@/components/agent-window/cursor-logo"
import { EffortControl } from "@/components/agent-window/effort-control"
import { FastToggle } from "@/components/agent-window/fast-toggle"
import { ModeSwitcher } from "@/components/agent-window/mode-switcher"
import { ModelPicker } from "@/components/agent-window/model-picker"
import { MODE_META, type AgentMode, type EffortLevel, type ModelId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Square } from "lucide-react"
import { useLayoutEffect, useRef } from "react"

export function Composer({
  mode,
  modelId,
  effort,
  fast,
  value,
  running,
  modelOpen,
  onModeChange,
  onModelChange,
  onEffortChange,
  onFastChange,
  onChange,
  onSubmit,
  onStop,
  onModelOpenChange,
}: {
  mode: AgentMode
  modelId: ModelId
  effort: EffortLevel
  fast: boolean
  value: string
  running: boolean
  modelOpen: boolean
  onModeChange: (mode: AgentMode) => void
  onModelChange: (id: ModelId) => void
  onEffortChange: (level: EffortLevel) => void
  onFastChange: (fast: boolean) => void
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  onModelOpenChange: (open: boolean) => void
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [value])

  return (
    <div className="w-full max-w-3xl px-4 pb-5">
      <form
        data-mode={mode}
        onSubmit={(event) => {
          event.preventDefault()
          if (running) onStop()
          else onSubmit()
        }}
        className={cn(
          "composer-card relative overflow-hidden rounded-2xl bg-[#141414] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_80px_rgba(0,0,0,0.45)]",
          running && "is-running"
        )}
      >
        <textarea
          ref={areaRef}
          value={value}
          rows={2}
          placeholder={placeholderFor(mode)}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              if (!running) onSubmit()
            }
            if (event.key === "Escape" && running) {
              event.preventDefault()
              onStop()
            }
          }}
          className="block max-h-[220px] min-h-[56px] w-full resize-none bg-transparent text-[14px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-500"
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ModeSwitcher value={mode} onChange={onModeChange} />
          <ModelPicker
            value={modelId}
            fast={fast}
            open={modelOpen}
            onOpenChange={onModelOpenChange}
            onChange={onModelChange}
          />
          <div className="ml-auto flex items-center gap-1">
            <EffortControl value={effort} onChange={onEffortChange} />
            <FastToggle value={fast} onChange={onFastChange} />
            {running ? (
              <button
                type="button"
                onClick={onStop}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 transition hover:bg-white"
                aria-label="Stop"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!value.trim()}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Send"
              >
                <CursorMark className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>
      <p className="mt-2 px-1 text-center text-[11px] text-zinc-600">
        {MODE_META[mode].kicker} · frontend-only mock · Shift+Tab mode · ⌘/ model
      </p>
    </div>
  )
}

function placeholderFor(mode: AgentMode) {
  if (mode === "plan") return "Describe the feature. I’ll research, then write a plan…"
  if (mode === "ask") return "Ask anything about the codebase. Read-only."
  if (mode === "debug") return "What’s broken? I’ll form hypotheses…"
  return "Build, refactor, or fix something…"
}
