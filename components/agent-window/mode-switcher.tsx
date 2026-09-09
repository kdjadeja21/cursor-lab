"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MODE_META, MODE_ORDER, type AgentMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Bug, Map, MessageCircle, Sparkles } from "lucide-react"

const ICONS: Record<AgentMode, typeof Sparkles> = {
  agent: Sparkles,
  plan: Map,
  ask: MessageCircle,
  debug: Bug,
}

export function ModeSwitcher({
  value,
  onChange,
}: {
  value: AgentMode
  onChange: (mode: AgentMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Agent mode"
      className="relative flex items-center rounded-lg bg-zinc-950/80 p-0.5 ring-1 ring-white/8"
    >
      {MODE_ORDER.map((mode) => {
        const Icon = ICONS[mode]
        const selected = value === mode
        return (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                role="tab"
                aria-selected={selected}
                variant="ghost"
                size="xs"
                onClick={() => onChange(mode)}
                className={cn(
                  "relative h-7 gap-1.5 rounded-md px-2 text-[12px] font-medium text-zinc-500 hover:bg-transparent hover:text-zinc-200",
                  selected && "text-zinc-50"
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-md bg-zinc-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                ) : null}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{MODE_META[mode].label}</span>
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56">
              <p className="font-medium">{MODE_META[mode].label}</p>
              <p className="text-background/70">{MODE_META[mode].hint}</p>
              <p className="mt-1 text-[10px] tracking-wide text-background/55 uppercase">
                Shift+Tab
              </p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
