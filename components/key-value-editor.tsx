"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newKeyValue } from "@/lib/connection";
import type { KeyValue } from "@/lib/types";

export function KeyValueEditor({
  legend,
  hint,
  rows,
  onChange,
  keyPlaceholder = "Name",
  valuePlaceholder = "Value",
}: {
  legend: string;
  hint?: string;
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const update = (id: string, patch: Partial<KeyValue>) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium text-ink-muted">{legend}</legend>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              aria-label={`${legend} name`}
              value={row.key}
              onChange={(event) => update(row.id, { key: event.target.value })}
              placeholder={keyPlaceholder}
              className="w-2/5 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 font-mono text-xs"
            />
            <input
              aria-label={`${legend} value`}
              value={row.value}
              onChange={(event) => update(row.id, { value: event.target.value })}
              placeholder={valuePlaceholder}
              className="flex-1 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 font-mono text-xs"
            />
            <label className="flex items-center gap-1 text-[11px] text-ink-muted">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(event) =>
                  update(row.id, { enabled: event.target.checked })
                }
              />
              On
            </label>
            <button
              type="button"
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
              aria-label={`Remove ${row.key || "row"}`}
              className="rounded p-1 text-ink-subtle hover:bg-surface-muted hover:text-danger"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="self-start"
        onClick={() => onChange([...rows, newKeyValue()])}
      >
        <Plus className="size-3.5" aria-hidden />
        Add row
      </Button>
    </fieldset>
  );
}
