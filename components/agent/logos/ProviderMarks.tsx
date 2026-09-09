"use client";

import type { ProviderId } from "@/lib/models";

function Base({
  children,
  size = 18,
  bg,
  label,
}: {
  children: React.ReactNode;
  size?: number;
  bg: string;
  label: string;
}) {
  return (
    <span
      title={label}
      className="inline-flex shrink-0 items-center justify-center rounded-[6px]"
      style={{
        width: size,
        height: size,
        background: bg,
        border: "1px solid rgba(255,255,255,0.12)",
      }}
      aria-label={label}
    >
      {children}
    </span>
  );
}

export function AutoMark({ size = 18 }: { size?: number }) {
  return (
    <Base size={size} bg="linear-gradient(135deg,#3a3d47,#17181d)" label="Auto">
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"
          fill="white"
          opacity="0.92"
        />
      </svg>
    </Base>
  );
}

export function ComposerMark({ size = 18 }: { size?: number }) {
  return (
    <Base size={size} bg="linear-gradient(135deg,#2b2e38,#0e0f13)" label="Composer">
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="3.5" fill="white" opacity="0.94" />
        <path d="M8 9.5h8M8 12.5h5" stroke="#101116" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </Base>
  );
}

export function AnthropicMark({ size = 18 }: { size?: number }) {
  return (
    <Base size={size} bg="linear-gradient(135deg,#d97757,#8a3c22)" label="Anthropic">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path
          d="M13.5 3L4 19h4.6L13.5 8.6 15.9 19H20L13.5 3z"
          fill="white"
          opacity="0.95"
        />
      </svg>
    </Base>
  );
}

export function OpenAIMark({ size = 18 }: { size?: number }) {
  return (
    <Base size={size} bg="linear-gradient(135deg,#2e3138,#0c0d10)" label="OpenAI">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2.1" fill="white" opacity="0.95" />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * Math.PI) / 3;
          const x1 = 12 + Math.cos(a) * 3.4;
          const y1 = 12 + Math.sin(a) * 3.4;
          const x2 = 12 + Math.cos(a) * 7.6;
          const y2 = 12 + Math.sin(a) * 7.6;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}
      </svg>
    </Base>
  );
}

export function GeminiMark({ size = 18 }: { size?: number }) {
  return (
    <Base size={size} bg="linear-gradient(135deg,#1c2a5e,#0e1430)" label="Google">
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2c.7 5.5 4.5 9.3 10 10-5.5.7-9.3 4.5-10 10-.7-5.5-4.5-9.3-10-10 5.5-.7 9.3-4.5 10-10z"
          fill="#8ab4ff"
        />
      </svg>
    </Base>
  );
}

export function GrokMark({ size = 18 }: { size?: number }) {
  return (
    <Base size={size} bg="linear-gradient(135deg,#151515,#2c2c30)" label="xAI">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 5l7 7-7 7h4l7-7-7-7H4zm9 0l7 7-7 7h-1.5L18 12 11.5 5H13z"
          fill="white"
          opacity="0.92"
        />
      </svg>
    </Base>
  );
}

export function ProviderMark({
  provider,
  size = 18,
}: {
  provider: ProviderId;
  size?: number;
}) {
  switch (provider) {
    case "auto":
      return <AutoMark size={size} />;
    case "composer":
      return <ComposerMark size={size} />;
    case "anthropic":
      return <AnthropicMark size={size} />;
    case "openai":
      return <OpenAIMark size={size} />;
    case "google":
      return <GeminiMark size={size} />;
    case "xai":
      return <GrokMark size={size} />;
  }
}
