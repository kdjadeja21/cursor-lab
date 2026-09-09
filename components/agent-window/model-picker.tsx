"use client"

import { ModelLogo, ModelLogoBadge } from "@/components/logos/model-logo"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MODEL_BY_ID, MODEL_GROUPS, MODELS } from "@/lib/models"
import type { ModelId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export function ModelPicker({
  value,
  fast,
  open,
  onOpenChange,
  onChange,
}: {
  value: ModelId
  fast: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (id: ModelId) => void
}) {
  const model = MODEL_BY_ID[value]

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            type="button"
            className={cn(
              "inline-flex h-7 max-w-[220px] items-center gap-1.5 rounded-md px-1.5 text-[12px] text-zinc-200 transition-colors",
              "hover:bg-white/5 aria-expanded:bg-white/8"
            )}
            aria-label={`Model ${model.name}`}
          >
            <ModelLogoBadge provider={model.provider} />
            <span className="truncate font-medium">{model.name}</span>
            {fast ? (
              <span className="rounded-full bg-amber-400/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-amber-300 uppercase">
                Fast
              </span>
            ) : null}
            <ChevronDown className="size-3 text-zinc-500" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Model · ⌘/</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <Command>
          <CommandInput placeholder="Search models…" />
          <CommandList>
            <CommandEmpty>No model matches.</CommandEmpty>
            {MODEL_GROUPS.map((group) => (
              <CommandGroup key={group.provider} heading={group.label}>
                {MODELS.filter((item) => item.provider === group.provider).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.name} ${item.subtitle} ${item.providerLabel}`}
                    data-checked={item.id === value}
                    onSelect={() => {
                      onChange(item.id)
                      onOpenChange(false)
                    }}
                  >
                    <ModelLogo provider={item.provider} className="size-4" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{item.name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
