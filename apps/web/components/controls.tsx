import type { ReactNode } from "react";
import type { Choice } from "@/lib/labels";

export function Segmented<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly Choice<T>[];
  onChange: (value: T) => void;
}) {
  const columns =
    options.length <= 2
      ? "grid-cols-2"
      : options.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <div className={`mt-2 grid gap-2 ${columns}`}>
        {options.map((option) => {
          const on = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              className={`min-h-16 rounded-lg border px-3 py-2 text-left ${
                on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:bg-soft"
              }`}
              onClick={() => onChange(option.value)}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span
                className={`mt-1 block text-xs leading-4 ${on ? "text-paper/75" : "text-muted"}`}
              >
                {option.detail}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ChoiceList<T extends string>({
  label,
  hint,
  mode,
  options,
  isSelected,
  onSelect,
}: {
  label: string;
  hint?: string;
  mode: "one" | "many";
  options: readonly Choice<T>[];
  isSelected: (value: T) => boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <div className="mt-2 grid gap-2">
        {options.map((option) => {
          const on = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left ${
                on ? "border-ink bg-soft" : "border-line bg-paper hover:bg-soft"
              }`}
              onClick={() => onSelect(option.value)}
            >
              <Mark on={on} mode={mode} />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{option.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Mark({ on, mode }: { on: boolean; mode: "one" | "many" }) {
  if (mode === "one") {
    return (
      <span
        className={`mt-0.5 size-4 shrink-0 rounded-full border ${
          on ? "border-ink bg-ink shadow-[inset_0_0_0_3px_var(--paper)]" : "border-line bg-paper"
        }`}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border text-[10px] leading-none ${
        on ? "border-ink bg-ink text-paper" : "border-line bg-paper"
      }`}
      aria-hidden="true"
    >
      {on ? "✓" : ""}
    </span>
  );
}

export function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-sm">{value}</span>
      </span>
      <span className="mt-1 block text-sm text-muted">{hint}</span>
      <input
        className="mt-4"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="mt-1 flex justify-between font-mono text-[11px] text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );
}

export function TextField({
  label,
  value,
  hint,
  error,
  onChange,
  mono = false,
}: {
  label: string;
  value: string;
  hint: string;
  error: string | null;
  onChange: (value: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className={`mt-2 block w-full rounded-lg border bg-paper px-3 py-2 text-sm ${
          mono ? "font-mono" : ""
        } ${error ? "border-danger" : "border-line"}`}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className={`mt-1 block text-sm ${error ? "text-danger" : "text-muted"}`}>
        {error ?? hint}
      </span>
    </label>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function LockedRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm">
        <span className="font-medium">{value}</span>
        <span className="text-muted"> · {detail}</span>
      </span>
    </div>
  );
}
