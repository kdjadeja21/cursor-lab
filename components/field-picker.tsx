"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { FORMAT_LABELS } from "@/lib/format";
import { pathLabel, type FieldSummary } from "@/lib/infer-schema";
import type { FieldFormat, FieldMapping, FieldPath } from "@/lib/types";

const FORMAT_KINDS = Object.keys(FORMAT_LABELS) as FieldFormat["kind"][];

function samePath(a: FieldPath, b: FieldPath) {
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

/**
 * Multi-select over the fields found in the response, with per-field label and
 * formatting. Selection order is preserved so users control column order.
 */
export function FieldPicker({
  legend,
  hint,
  candidates,
  selected,
  onChange,
  showFormat = true,
  allowReorder = true,
}: {
  legend: string;
  hint?: string;
  candidates: FieldSummary[];
  selected: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
  showFormat?: boolean;
  allowReorder?: boolean;
}) {
  const indexOf = (path: FieldPath) =>
    selected.findIndex((mapping) => samePath(mapping.path, path));

  const toggle = (candidate: FieldSummary) => {
    const index = indexOf(candidate.path);
    if (index >= 0) {
      onChange(selected.filter((_, position) => position !== index));
      return;
    }
    onChange([
      ...selected,
      {
        path: candidate.path,
        label: candidate.label,
        format: { kind: "auto" },
      },
    ]);
  };

  const patchMapping = (index: number, patch: Partial<FieldMapping>) => {
    onChange(
      selected.map((mapping, position) =>
        position === index ? { ...mapping, ...patch } : mapping,
      ),
    );
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium text-ink-muted">{legend}</legend>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}

      {candidates.length === 0 ? (
        <p className="text-xs text-ink-subtle">
          No fields available at the selected path.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((candidate) => {
            const isSelected = indexOf(candidate.path) >= 0;
            return (
              <button
                key={pathLabel(candidate.path)}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(candidate)}
                className={
                  isSelected
                    ? "rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium text-white"
                    : "rounded-full border border-line-strong px-2.5 py-1 text-[11px] text-ink-muted hover:bg-surface-muted"
                }
              >
                {pathLabel(candidate.path)}
                <span className="ml-1 opacity-70">{candidate.kind}</span>
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {selected.map((mapping, index) => (
            <li
              key={pathLabel(mapping.path)}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2"
            >
              <span className="w-full font-mono text-[11px] text-ink-subtle sm:w-auto">
                {pathLabel(mapping.path)}
              </span>
              <input
                aria-label={`Label for ${pathLabel(mapping.path)}`}
                value={mapping.label}
                onChange={(event) =>
                  patchMapping(index, { label: event.target.value })
                }
                className="min-w-24 flex-1 rounded-md border border-line-strong px-2 py-1 text-xs"
              />
              {showFormat ? (
                <select
                  aria-label={`Format for ${pathLabel(mapping.path)}`}
                  value={mapping.format.kind}
                  onChange={(event) =>
                    patchMapping(index, {
                      format: {
                        ...mapping.format,
                        kind: event.target.value as FieldFormat["kind"],
                      },
                    })
                  }
                  className="rounded-md border border-line-strong px-1.5 py-1 text-xs"
                >
                  {FORMAT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {FORMAT_LABELS[kind]}
                    </option>
                  ))}
                </select>
              ) : null}
              {showFormat && mapping.format.kind === "currency" ? (
                <input
                  aria-label={`Currency for ${pathLabel(mapping.path)}`}
                  value={mapping.format.currency ?? "USD"}
                  maxLength={3}
                  onChange={(event) =>
                    patchMapping(index, {
                      format: {
                        ...mapping.format,
                        currency: event.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="w-14 rounded-md border border-line-strong px-1.5 py-1 text-xs uppercase"
                />
              ) : null}
              {allowReorder ? (
                <span className="flex items-center">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${mapping.label} earlier`}
                    className="rounded p-1 text-ink-subtle hover:text-ink disabled:opacity-40"
                  >
                    <ArrowUp className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === selected.length - 1}
                    aria-label={`Move ${mapping.label} later`}
                    className="rounded p-1 text-ink-subtle hover:text-ink disabled:opacity-40"
                  >
                    <ArrowDown className="size-3.5" aria-hidden />
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}
