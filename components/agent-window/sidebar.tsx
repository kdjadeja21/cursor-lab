"use client"

import { CursorMark } from "@/components/agent-window/cursor-logo"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MODE_META, type Chat } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

export function Sidebar({
  chats,
  activeId,
  onSelect,
  onNew,
}: {
  chats: Chat[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-[#101010]">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <CursorMark className="size-3.5 text-zinc-100" />
        <span className="text-[13px] font-medium tracking-tight text-zinc-200">
          Agents
        </span>
      </div>
      <div className="px-2 pb-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onNew}
          className="w-full justify-start gap-2 rounded-lg bg-white/5 text-zinc-200 hover:bg-white/10"
        >
          <Plus className="size-3.5" />
          New agent
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-4">
          {chats.map((chat) => {
            const active = chat.id === activeId
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelect(chat.id)}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-white/8" : "hover:bg-white/4"
                )}
              >
                <p className="truncate text-[13px] font-medium text-zinc-100">
                  {chat.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span>{MODE_META[chat.mode].label}</span>
                  <span className="text-zinc-700">·</span>
                  <span>{relativeTime(chat.updatedAt)}</span>
                </p>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function relativeTime(ts: number) {
  const delta = Date.now() - ts
  const mins = Math.max(1, Math.round(delta / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}
