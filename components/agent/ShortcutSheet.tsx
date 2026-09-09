"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { Kbd } from "@/components/ui/Kbd";
import { SHORTCUTS } from "@/lib/keys";

const GROUPS = ["Controls", "Conversation", "Window"] as const;

export function ShortcutSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-1000/70 backdrop-blur-sm data-[state=open]:animate-rise" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-window border border-line bg-ink-900/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] backdrop-blur-2xl data-[state=open]:animate-pop">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
            <CursorMark size={17} state="thinking" accent="#6ea8ff" speed={0.6} />
            <Dialog.Title className="text-[13px] font-medium text-fg">Shortcuts</Dialog.Title>
            <span className="flex-1" />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="grid h-6 w-6 place-items-center rounded-[7px] text-fg-faint transition-colors hover:bg-ink-800 hover:text-fg"
              >
                <X size={13} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="px-4 pt-3 text-[11.5px] leading-relaxed text-fg-subtle">
            Every control in the composer is reachable from the keyboard, including Fast — which
            has no shortcut in Cursor today.
          </Dialog.Description>

          <div className="space-y-3.5 px-4 py-3.5">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="mb-1.5 text-[10px] font-medium tracking-wider text-fg-faint uppercase">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {SHORTCUTS.filter((shortcut) => shortcut.group === group).map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center gap-2 rounded-[8px] px-1.5 py-1.5 transition-colors hover:bg-ink-850/60"
                    >
                      <span className="text-[12px] text-fg-muted">{shortcut.label}</span>
                      {shortcut.isNew === true ? (
                        <span className="rounded-[5px] bg-ask/15 px-1.5 py-[1px] text-[9px] font-medium text-ask">
                          new
                        </span>
                      ) : null}
                      <span className="flex-1" />
                      <Kbd keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
