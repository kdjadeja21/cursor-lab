import type { SeedlayerConfig } from "./schema.js";
import type { DesignTokens } from "./types.js";

const PALETTES: Record<
  SeedlayerConfig["design"]["palette"],
  Omit<DesignTokens, "radius" | "fontSans" | "spaceSection">
> = {
  neutral: {
    bg: "#fafafa",
    fg: "#171717",
    muted: "#f5f5f5",
    mutedFg: "#525252",
    border: "#e5e5e5",
    accent: "#171717",
    accentFg: "#fafafa",
    danger: "#b91c1c",
    bgDark: "#0a0a0a",
    fgDark: "#fafafa",
    mutedDark: "#171717",
    mutedFgDark: "#a3a3a3",
    borderDark: "#262626",
    accentDark: "#fafafa",
    accentFgDark: "#171717",
  },
  slate: {
    bg: "#f8fafc",
    fg: "#0f172a",
    muted: "#f1f5f9",
    mutedFg: "#475569",
    border: "#e2e8f0",
    accent: "#0f172a",
    accentFg: "#f8fafc",
    danger: "#be123c",
    bgDark: "#020617",
    fgDark: "#f8fafc",
    mutedDark: "#0f172a",
    mutedFgDark: "#94a3b8",
    borderDark: "#1e293b",
    accentDark: "#e2e8f0",
    accentFgDark: "#020617",
  },
  zinc: {
    bg: "#fafafa",
    fg: "#18181b",
    muted: "#f4f4f5",
    mutedFg: "#52525b",
    border: "#e4e4e7",
    accent: "#18181b",
    accentFg: "#fafafa",
    danger: "#dc2626",
    bgDark: "#09090b",
    fgDark: "#fafafa",
    mutedDark: "#18181b",
    mutedFgDark: "#a1a1aa",
    borderDark: "#27272a",
    accentDark: "#fafafa",
    accentFgDark: "#18181b",
  },
  vivid: {
    bg: "#f3f7f4",
    fg: "#14221b",
    muted: "#e6f2ea",
    mutedFg: "#356348",
    border: "#c9e2d2",
    accent: "#146c43",
    accentFg: "#f4fff8",
    danger: "#c2410c",
    bgDark: "#0c1712",
    fgDark: "#e7f6ee",
    mutedDark: "#13261c",
    mutedFgDark: "#8fbfa4",
    borderDark: "#1e3d2e",
    accentDark: "#3dd68c",
    accentFgDark: "#062015",
  },
};

const RADIUS: Record<SeedlayerConfig["design"]["radius"], string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
};

const SPACE: Record<SeedlayerConfig["design"]["density"], string> = {
  compact: "1.5rem",
  comfortable: "2.5rem",
  spacious: "4rem",
};

export function designTokens(design: SeedlayerConfig["design"]): DesignTokens {
  return {
    ...PALETTES[design.palette],
    radius: RADIUS[design.radius],
    fontSans: fontStack(design.fontSans),
    spaceSection: SPACE[design.density],
  };
}

function fontStack(font: SeedlayerConfig["design"]["fontSans"]): string {
  switch (font) {
    case "Inter":
      return 'var(--font-loaded-sans), "Inter", ui-sans-serif, system-ui, sans-serif';
    case "Geist":
      return 'var(--font-loaded-sans), "Geist", ui-sans-serif, system-ui, sans-serif';
    case "system":
      return "ui-sans-serif, system-ui, sans-serif";
    default: {
      const exhaustive: never = font;
      return exhaustive;
    }
  }
}
