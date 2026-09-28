import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "surface-card",
        interactive &&
          "transition-[box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {children}
      </h3>
      {action}
    </div>
  );
}
