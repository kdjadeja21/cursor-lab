import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  description,
  back,
  actions,
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
