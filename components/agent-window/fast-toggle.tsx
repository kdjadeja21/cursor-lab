"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

export function FastToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (fast: boolean) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={value}
          onClick={() => onChange(!value)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors",
            value
              ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/25"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          )}
        >
          <Zap className={cn("size-3.5", value && "fill-amber-300 text-amber-300")} />
          Fast
        </button>
      </TooltipTrigger>
      <TooltipContent>Fast · Ctrl+Shift+/</TooltipContent>
    </Tooltip>
  )
}
