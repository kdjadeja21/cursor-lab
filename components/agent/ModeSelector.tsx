"use client";

import { MODES, type AgentMode } from "@/lib/models";

export default function ModeSelector({
  mode,
  onChange,
}: {
  mode: AgentMode;
  onChange: (m: AgentMode) => void;
}) {
  const idx = MODES.findIndex((m) => m.id === mode);

  return (
    <div
      role="radiogroup"
      aria-label="Agent mode"
      className="relative grid grid-cols-3 rounded-xl border border-white/10 bg-[#0b0c10]/90 p-1"
    >
      {/* sliding indicator */}
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-[9px] border border-white/12 bg-gradient-to-b from-[#262932] to-[#17181d] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: "calc((100% - 8px) / 3)",
          left: 4,
          transform: `translateX(${idx * 100}%)`,
        }}
      />
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            role="radio"
            aria-checked={active}
            title={`${m.label} — ${m.description}`}
            onClick={() => onChange(m.id)}
            className={`group relative z-10 flex flex-col items-center gap-0.5 rounded-[9px] px-2 py-1.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 ${
              active ? "text-white" : "text-[#8b90a0] hover:text-[#c9cdd8]"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-medium leading-none">
              {m.label}
              <kbd className="hidden rounded border border-white/10 bg-white/5 px-1 text-[9px] font-normal text-white/40 group-hover:text-white/60">
                {m.shortcut}
              </kbd>
            </span>
            <span
              className={`text-[10px] leading-tight transition-opacity ${
                active ? "text-white/55" : "text-white/30"
              }`}
            >
              {m.id === "agent"
                ? "Build & edit"
                : m.id === "plan"
                  ? "Plan first"
                  : "No edits"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
