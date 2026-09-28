import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-gradient-to-b from-brand-soft to-surface text-brand-strong shadow-xs">
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-xs leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
