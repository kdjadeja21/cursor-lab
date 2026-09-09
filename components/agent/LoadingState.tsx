"use client";

import CursorLogo from "./logos/CursorLogo";

export default function LoadingState({
  stages,
  stageIndex,
  modelName,
}: {
  stages: string[];
  stageIndex: number;
  modelName: string;
}) {
  return (
    <div className="animate-msg-in rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center gap-2.5">
        <span className="relative inline-flex">
          <span className="animate-ring-ping absolute inset-0 rounded-lg bg-white/20" />
          <CursorLogo size={26} spinning />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-white">
            Thinking
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot inline-block h-[4px] w-[4px] rounded-full bg-white/70"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          </p>
          <p className="truncate text-[11px] text-white/40">
            {modelName} · {stages[Math.min(stageIndex, stages.length - 1)] ?? "Working"}…
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {stages.map((s, i) => {
          const done = i < stageIndex;
          const active = i === stageIndex;
          return (
            <div
              key={s + i}
              className="animate-step-in flex items-center gap-2 text-[12px]"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {done ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-emerald-300">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
                  <path d="M8 12.5l2.7 2.7L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : active ? (
                <span className="flex shrink-0 items-center justify-center">
                  <CursorLogo size={14} spinning />
                </span>
              ) : (
                <span className="h-[13px] w-[13px] shrink-0 rounded-full border border-white/15" />
              )}
              <span className={done ? "text-white/60" : active ? "text-white" : "text-white/30"}>
                {s}{active ? "…" : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        <div className="shimmer-track h-[8px] rounded-full bg-white/[0.06]" />
        <div className="shimmer-track h-[8px] w-4/5 rounded-full bg-white/[0.05]" />
        <div className="shimmer-track h-[8px] w-3/5 rounded-full bg-white/[0.04]" />
      </div>
    </div>
  );
}
