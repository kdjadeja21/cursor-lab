"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MODELS, type AIModel } from "@/lib/models";
import { ProviderMark } from "./logos/ProviderMarks";

function TagBadge({ model }: { model: AIModel }) {
  if (!model.tag) return null;
  const styles: Record<string, string> = {
    fast: "bg-emerald-400/10 text-emerald-300 border-emerald-300/20",
    max: "bg-violet-400/10 text-violet-300 border-violet-300/25",
    thinking: "bg-sky-400/10 text-sky-300 border-sky-300/20",
    new: "bg-amber-300/10 text-amber-200 border-amber-200/25",
  };
  return (
    <span
      className={`rounded-full border px-1.5 py-px text-[10px] font-medium leading-tight ${styles[model.tag]}`}
    >
      {model.tagLabel ?? model.tag}
    </span>
  );
}

export default function ModelPicker({
  model,
  onChange,
}: {
  model: AIModel;
  onChange: (m: AIModel) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? MODELS.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.group.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q),
        )
      : MODELS;
    const map = new Map<string, AIModel[]>();
    for (const m of filtered) {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group)!.push(m);
    }
    return [...map.entries()];
  }, [query]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex w-full items-center gap-2 rounded-xl border px-2.5 py-[7px] text-left transition-all duration-200 ${
          open
            ? "border-white/25 bg-[#20222b]"
            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
        }`}
      >
        <ProviderMark provider={model.provider} size={20} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-white">
              {model.name}
            </span>
            <TagBadge model={model} />
          </span>
          <span className="block truncate text-[10.5px] text-white/40">
            {model.description}
          </span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`shrink-0 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

      {open && (
        <div className="animate-pop absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-xl border border-white/12 bg-[#14151b]/98 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="border-b border-white/8 p-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-white/40">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models…"
                className="w-full bg-transparent text-[12.5px] text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </div>
          <div role="listbox" className="scroll-thin max-h-[264px] overflow-y-auto p-1.5">
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-[12px] text-white/40">
                No models match “{query}”
              </p>
            )}
            {groups.map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.08em] text-white/35 uppercase">
                  {group}
                </p>
                {items.map((m) => {
                  const selected = m.id === model.id;
                  return (
                    <button
                      key={m.id}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(m);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? "bg-white/10"
                          : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <ProviderMark provider={m.provider} size={20} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[12.5px] font-medium text-white">
                            {m.name}
                          </span>
                          <TagBadge model={m} />
                        </span>
                        <span className="block truncate text-[11px] text-white/40">
                          {m.description}
                        </span>
                      </span>
                      {selected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white">
                          <path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 px-3 py-2">
            <p className="text-[10.5px] text-white/35">
              Auto routes each request to the best model · Billing per model
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
