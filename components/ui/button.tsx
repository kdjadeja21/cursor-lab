import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_2px_rgba(16,16,48,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-brand-strong active:translate-y-px",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-xs hover:border-ink-subtle/50 hover:bg-surface-muted active:translate-y-px",
  subtle: "bg-brand-soft text-brand-strong hover:bg-brand/12",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  danger:
    "border border-danger/25 bg-danger-soft text-danger hover:border-danger/40 hover:bg-danger/12",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
  icon: "size-8 justify-center",
};

/** Shared classes so links can be styled as buttons without nesting elements. */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-55",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
