"use client";

export default function CursorLogo({
  size = 20,
  spinning = false,
  className = "",
}: {
  size?: number;
  spinning?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* conic glow ring */}
      <span
        className={spinning ? "animate-cursor-conic absolute inset-0" : "absolute inset-0"}
        style={{
          borderRadius: 6,
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.9), rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.06) 70%, rgba(255,255,255,0.9))",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1.5,
        }}
      />
      {/* tile */}
      <span
        className={spinning ? "animate-cursor-breathe" : ""}
        style={{
          width: size - 5,
          height: size - 5,
          borderRadius: 4.5,
          background: "linear-gradient(145deg, #26282f 0%, #101116 70%)",
          border: "1px solid rgba(255,255,255,0.14)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        <svg
          width={size * 0.52}
          height={size * 0.52}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 3.5h9.2c.5 0 .9.4.9.9v5.2l3.1 3.1c.6.6.6 1.5 0 2.1l-6.4 6.4c-.6.6-1.5.6-2.1 0l-2.4-2.4c-.3-.3-.4-.7-.4-1.1V6.4c0-.4.1-.8.4-1.1l1-1c.3-.3.7-.4 1.1-.4H6"
            fill="white"
            opacity="0.95"
          />
          <path
            d="M14.5 3.5h.7c.5 0 .9.4.9.9v6.1"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1"
          />
        </svg>
      </span>
    </span>
  );
}
