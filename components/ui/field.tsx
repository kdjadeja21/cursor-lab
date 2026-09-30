"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const controlClasses =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle hover:border-ink-subtle/45 focus:border-brand focus:ring-2 focus:ring-brand/18 focus:outline-none disabled:bg-surface-muted disabled:text-ink-subtle";

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium tracking-wide text-ink-muted"
    >
      {children}
    </label>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-ink-subtle">{children}</p>;
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  adornment?: ReactNode;
}

export function TextField({
  label,
  hint,
  adornment,
  className,
  ...props
}: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {adornment ? (
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-subtle">
            {adornment}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(controlClasses, adornment && "pl-8", className)}
          {...props}
        />
      </div>
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export interface TextAreaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: ReactNode;
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className={cn(
          controlClasses,
          "resize-y font-mono text-xs leading-relaxed",
          className,
        )}
        {...props}
      />
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: ReactNode;
}

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          className={cn(controlClasses, "appearance-none pr-8", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
      </div>
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}
