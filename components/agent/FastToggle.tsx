"use client";

export default function FastToggle({
  fast,
  onChange,
}: {
  fast: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={fast}
      title={fast ? "Fast mode on — prioritize speed" : "Fast mode off"}
      onClick={() => onChange(!fast)}
      className={`flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-[9px] transition-all duration-200 ${
        fast
          ? "border-emerald-300/30 bg-emerald-400/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <span
        className={`relative h-[16px] w-[28px] rounded-full transition-colors duration-200 ${
          fast ? "bg-emerald-400" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white shadow transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            fast ? "left-[14px]" : "left-[2px]"
          }`}
        />
      </span>
      <span
        className={`flex items-center gap-1 text-[12px] font-medium ${
          fast ? "text-emerald-200" : "text-white/55"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
        Fast
      </span>
    </button>
  );
}
