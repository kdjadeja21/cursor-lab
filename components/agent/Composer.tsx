"use client";

import { useEffect, useRef, useState } from "react";
import CursorLogo from "./logos/CursorLogo";

export default function Composer({
  value,
  onChange,
  onSend,
  sending,
  contextLabel = "Codebase",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  contextLabel?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(140, Math.max(44, el.scrollHeight))}px`;
  }, [value]);

  return (
    <div
      className={`rounded-2xl border bg-[#0b0c10] transition-all duration-200 ${
        focused
          ? "border-white/25 shadow-[0_0_0_3px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.5)]"
          : "border-white/12 shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
      }`}
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5">
        <button
          title="Add context (@)"
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <span className="text-white/50">@</span> {contextLabel}
        </button>
        <button
          title="Attach file"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          title="Attach image"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="9" cy="10" r="1.6" fill="currentColor" />
            <path d="M4.5 17.5l4.5-4.5 3 3 3.5-3.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="ml-auto hidden text-[10.5px] text-white/30 sm:inline">
          Enter to send · ⇧Enter newline
        </span>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        placeholder="Ask, plan, or describe an edit…  (try @ for context)"
        className="scroll-thin w-full resize-none bg-transparent px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
      />

      <div className="flex items-center gap-2 px-3 pb-3">
        <span className="flex items-center gap-1.5 text-[10.5px] text-white/30">
          <span className="h-[6px] w-[6px] rounded-full bg-emerald-400/90" />
          Local context attached
        </span>
        <button
          onClick={onSend}
          disabled={sending || !value.trim()}
          aria-label="Send message"
          className={`group ml-auto flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
            sending || !value.trim()
              ? "cursor-not-allowed border border-white/10 bg-white/[0.04] opacity-50"
              : "bg-white text-black shadow-[0_4px_18px_rgba(255,255,255,0.25)] hover:scale-105 hover:shadow-[0_4px_24px_rgba(255,255,255,0.4)] active:scale-95"
          }`}
        >
          {sending ? (
            <CursorLogo size={18} spinning />
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className={!value.trim() ? "text-white/60" : "text-black"}
            >
              <path
                d="M12 19V5m0 0l-6 6m6-6l6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
