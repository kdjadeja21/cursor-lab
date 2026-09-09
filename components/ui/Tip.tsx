"use client";

import { Tooltip } from "radix-ui";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/cn";

export function TipProvider({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={260} skipDelayDuration={120}>
      {children}
    </Tooltip.Provider>
  );
}

export function Tip({
  children,
  label,
  hint,
  keys,
  side = "top",
  align = "center",
  className,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  hint?: React.ReactNode;
  keys?: string[];
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            "z-50 max-w-[248px] rounded-[10px] border border-line bg-ink-800/95 px-2.5 py-2 text-[11.5px] leading-relaxed text-fg shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl",
            "data-[state=delayed-open]:animate-pop",
            className,
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="font-medium">{label}</span>
            {keys ? <Kbd keys={keys} /> : null}
          </span>
          {hint ? (
            <span className="mt-1 block text-[11px] text-fg-subtle">{hint}</span>
          ) : null}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
