import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "positive" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-surface-muted text-ink-muted",
  brand: "border-brand/20 bg-brand-soft text-brand-strong",
  positive: "border-positive/25 bg-positive-soft text-positive",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
};

const dots: Record<BadgeTone, string> = {
  neutral: "bg-ink-subtle",
  brand: "bg-brand",
  positive: "bg-positive",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  children,
  className,
}: {
  tone?: BadgeTone;
  /** Adds a status dot, which reads faster than colour alone in dense rows. */
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            "size-1.5 rounded-full",
            dots[tone],
            pulse && "animate-pulse",
          )}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}

const METHOD_TONES: Record<string, string> = {
  GET: "border-accent/30 bg-accent/10 text-accent",
  POST: "border-positive/25 bg-positive-soft text-positive",
  PUT: "border-warning/30 bg-warning-soft text-warning",
  PATCH: "border-warning/30 bg-warning-soft text-warning",
  DELETE: "border-danger/25 bg-danger-soft text-danger",
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
        METHOD_TONES[method] ?? METHOD_TONES.GET,
      )}
    >
      {method}
    </span>
  );
}
