import type { SeedlayerConfig } from "@seedlayer/core";
import { designTokens } from "@seedlayer/core/tokens";
import type { CSSProperties } from "react";

export function appTheme(design: SeedlayerConfig["design"]): CSSProperties {
  const tokens = designTokens(design);
  return {
    "--bg": tokens.bg,
    "--ink": tokens.fg,
    "--muted": tokens.mutedFg,
    "--line": tokens.border,
    "--paper": tokens.accentFg,
    "--soft": tokens.muted,
    "--accent": tokens.accent,
    "--accent-fg": tokens.accentFg,
    "--highlight": tokens.highlight,
    "--highlight-fg": tokens.highlightFg,
    "--danger": tokens.danger,
    "--code": tokens.bgDark,
    "--code-ink": tokens.fgDark,
    "--code-muted": tokens.mutedFgDark,
    fontFamily: themeFont(design.fontSans),
  } as CSSProperties;
}

export function themeFont(font: SeedlayerConfig["design"]["fontSans"]): string {
  switch (font) {
    case "Inter":
      return "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif";
    case "Geist":
      return "var(--font-geist), Geist, ui-sans-serif, system-ui, sans-serif";
    case "system":
      return "ui-sans-serif, system-ui, sans-serif";
    default: {
      const exhaustive: never = font;
      return exhaustive;
    }
  }
}
