"use client";

import type { ChatMessageData } from "@/lib/chat";
import CursorLogo from "./logos/CursorLogo";

function ToolRow({
  label,
  file,
  status,
}: {
  label: string;
  file?: string;
  status: "done" | "running" | "pending";
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/30 px-2.5 py-1.5">
      {status === "done" ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-emerald-300">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
          <path d="M8 12.5l2.7 2.7L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : status === "running" ? (
        <CursorLogo size={14} spinning />
      ) : (
        <span className="h-[13px] w-[13px] shrink-0 rounded-full border border-white/15" />
      )}
      <span className="truncate text-[12px] text-white/75">{label}</span>
      {file && (
        <span className="ml-auto shrink-0 rounded border border-white/10 bg-white/[0.05] px-1.5 py-px font-mono text-[10px] text-white/50">
          {file}
        </span>
      )}
    </div>
  );
}

export default function ChatMessage({ msg }: { msg: ChatMessageData }) {
  if (msg.role === "user") {
    return (
      <div className="animate-msg-in flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-br-md border border-white/10 bg-gradient-to-b from-[#23252e] to-[#191a20] px-3.5 py-2.5 shadow-[0_6px_20px_rgba(0,0,0,0.4)]">
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-white/90">
            {msg.text}
          </p>
          {msg.modelName && (
            <p className="mt-1.5 text-[10px] text-white/35">
              {msg.mode} · {msg.modelName} · {msg.effortLabel}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-msg-in flex gap-2.5">
      <div className="mt-0.5 shrink-0">
        <CursorLogo size={24} spinning={!!msg.streaming} />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.03] px-3.5 py-3">
        {msg.modelName && (
          <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-white/40 uppercase">
            {msg.modelName}
            {msg.effortLabel ? ` · ${msg.effortLabel}` : ""}
            {msg.streaming ? (
              <span className="flex gap-1 normal-case">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot inline-block h-[3px] w-[3px] rounded-full bg-white/60"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </span>
            ) : null}
          </p>
        )}

        <p
          className={`text-[13px] leading-relaxed whitespace-pre-wrap text-white/85 ${msg.streaming ? "streaming-caret" : ""}`}
        >
          {msg.text}
        </p>

        {msg.tools && msg.tools.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {msg.tools.map((t) => (
              <ToolRow key={t.id} label={t.label} file={t.file} status={t.status} />
            ))}
          </div>
        )}

        {msg.code && (
          <div className="mt-2.5 overflow-hidden rounded-xl border border-white/10 bg-[#0a0b0e]">
            <div className="flex items-center gap-2 border-b border-white/8 px-3 py-1.5">
              <span className="flex gap-1">
                <span className="h-[8px] w-[8px] rounded-full bg-[#ff5f57]/80" />
                <span className="h-[8px] w-[8px] rounded-full bg-[#febc2e]/80" />
                <span className="h-[8px] w-[8px] rounded-full bg-[#28c840]/80" />
              </span>
              <span className="truncate font-mono text-[11px] text-white/55">
                {msg.code.file}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10.5px]">
                <span className="font-medium text-emerald-300">+18</span>
                <span className="font-medium text-rose-300">−4</span>
              </span>
            </div>
            <pre className="scroll-thin overflow-x-auto p-3 font-mono text-[11.5px] leading-relaxed text-white/80">
              {msg.code.code}
            </pre>
          </div>
        )}

        {!msg.streaming && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {["Keep", "Undo", "Copy"].map((a) => (
              <button
                key={a}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
