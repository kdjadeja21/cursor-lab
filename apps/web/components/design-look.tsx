"use client";

import type { SeedlayerConfig } from "@seedlayer/core";
import { designTokens } from "@seedlayer/core/tokens";
import { themeFont } from "@/lib/theme";

export function DesignLook({
  design,
  projectName,
}: {
  design: SeedlayerConfig["design"];
  projectName: string;
}) {
  const tokens = designTokens(design);
  const font = themeFont(design.fontSans);
  return (
    <div className="grid gap-3 p-4">
      <p className="text-xs text-muted">Light and dark from the same tokens.</p>
      <article
        className="overflow-hidden border border-line"
        style={{ borderRadius: "12px", fontFamily: font, background: tokens.bg, color: tokens.fg }}
      >
        <div style={{ padding: tokens.spaceSection }}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <strong>{projectName}</strong>
            <span style={{ color: tokens.mutedFg }}>Dashboard</span>
          </div>
          <h3 className="mt-6 text-[1.7rem] leading-none font-medium tracking-tight">
            Ship the context with the app.
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-6" style={{ color: tokens.mutedFg }}>
            Buttons, type, and spacing on this card come from the palette, radius, font, and density
            you picked.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="px-3 py-2 text-sm"
              style={{
                background: tokens.accent,
                color: tokens.accentFg,
                borderRadius: tokens.radius,
              }}
            >
              Primary
            </span>
            <span
              className="px-3 py-2 text-sm"
              style={{
                background: tokens.highlight,
                color: tokens.highlightFg,
                borderRadius: tokens.radius,
              }}
            >
              Highlight
            </span>
            <span
              className="border px-3 py-2 text-sm"
              style={{
                borderColor: tokens.border,
                background: tokens.muted,
                borderRadius: tokens.radius,
              }}
            >
              Surface
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 font-mono text-xs"
          style={{ background: tokens.bgDark, color: tokens.fgDark }}
        >
          <span>--accent</span>
          <span className="flex items-center gap-2">
            <span
              className="inline-block size-3 rounded-full"
              style={{ background: tokens.accentDark }}
            />
            <span
              className="inline-block size-3 rounded-full"
              style={{ background: tokens.highlightDark }}
            />
            <span style={{ color: tokens.accentDark }}>{tokens.accent}</span>
          </span>
        </div>
      </article>
    </div>
  );
}
