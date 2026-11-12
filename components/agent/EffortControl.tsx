"use client";

import { EFFORTS, type EffortLevel } from "@/lib/models";
import CursorLogo from "./logos/CursorLogo";

export default function EffortControl({
  effort,
  fast,
  onChange,
  collapsed,
  onToggleCollapse,
}: {
  effort: EffortLevel;
  fast: boolean;
  onChange: (e: EffortLevel) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const current = EFFORTS[effort];
  const pct = (effort / 3) * 100;

  const step = (d: -1 | 1) => {
    const next = Math.min(3, Math.max(0, effort + d)) as EffortLevel;
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0c10]/80">
      <button
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <CursorLogo size={16} spinning={effort === 3} />
        <span className="text-[11.5px] font-medium text-white/70">
          Effort
        </span>
        <span
          className={`rounded-full border px-1.5 py-px text-[10.5px] font-semibold transition-colors duration-200 ${
            effort === 3
              ? "border-violet-300/30 bg-violet-400/15 text-violet-200"
              : effort === 2
                ? "border-sky-300/25 bg-sky-400/10 text-sky-200"
                : effort === 1
                  ? "border-white/15 bg-white/8 text-white/80"
                  : "border-white/10 bg-white/[0.04] text-white/50"
          }`}
        >
          {current.label}
          {fast ? " · Fast" : ""}
        </span>
        <span className="ml-auto flex items-center gap-2 text-[10.5px] text-white/35">
          <span className="hidden sm:inline">{current.latency}</span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
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
        </span>
      </button>

      {!collapsed && (
        <div className="animate-pop px-3 pb-3">
          {/* stepper + slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => step(-1)}
              disabled={effort === 0}
              aria-label="Decrease effort"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="relative flex-1 py-1">
              {/* track */}
              <div className="relative h-[6px] overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/50 via-white/85 to-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${pct}%` }}
                />
                {/* tick marks */}
                <div className="absolute inset-0 flex items-center justify-between px-[3px]">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-[3px] w-[3px] rounded-full transition-colors ${
                        i <= effort ? "bg-black/50" : "bg-white/25"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={effort}
                onChange={(e) =>
                  onChange(Number(e.target.value) as EffortLevel)
                }
                aria-label="Effort level"
                aria-valuetext={current.label}
                className="effort-range absolute inset-0 h-full w-full opacity-100"
                style={{ background: "transparent" }}
              />
            </div>

            <button
              onClick={() => step(1)}
              disabled={effort === 3}
              aria-label="Increase effort"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* stop labels */}
          <div className="mt-1.5 grid grid-cols-4">
            {EFFORTS.map((e) => {
              const active = e.level === effort;
              const passed = e.level <= effort;
              return (
                <button
                  key={e.level}
                  onClick={() => onChange(e.level)}
                  className={`rounded-md py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? "text-white"
                      : passed
                        ? "text-white/55 hover:text-white/85"
                        : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {e.label}
                </button>
              );
            })}
          </div>

          {/* live hint */}
          <div
            key={effort + String(fast)}
            className="animate-step-in mt-1.5 flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-1.5"
          >
            <span className="text-[11px] text-white/60">{current.hint}</span>
            <span className="text-[11px] font-medium text-white/80">
              {fast ? "boosted" : current.latency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
