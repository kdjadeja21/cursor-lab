import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "positive" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-surface-muted text-ink-muted",
  brand: "border-brand/25 bg-brand-soft text-brand-strong",
  positive: "border-positive/25 bg-positive/10 text-positive",
  warning: "border-warning/30 bg-warning/12 text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
