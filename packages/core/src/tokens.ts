import type { SeedlayerConfig } from "./schema.js";
import type { DesignTokens } from "./types.js";

type PaletteColors = Omit<DesignTokens, "radius" | "fontSans" | "spaceSection">;

const PALETTES: Record<SeedlayerConfig["design"]["palette"], PaletteColors> = {
  ink: {
    bg: "#f6f1e7",
    fg: "#1c140e",
    muted: "#efe4d4",
    mutedFg: "#6b5344",
    border: "#e0d0ba",
    accent: "#9a3412",
    accentFg: "#fff7ed",
    highlight: "#b45309",
    highlightFg: "#fffbeb",
    danger: "#b42318",
    bgDark: "#140f0c",
    fgDark: "#f6efe6",
    mutedDark: "#241c16",
    mutedFgDark: "#c4a992",
    borderDark: "#3a2d24",
    accentDark: "#fdba74",
    accentFgDark: "#2a1208",
    highlightDark: "#fbbf24",
    highlightFgDark: "#2a1a06",
  },
  harbor: {
    bg: "#f2f6fc",
    fg: "#102033",
    muted: "#e4edf8",
    mutedFg: "#3d5674",
    border: "#d0deef",
    accent: "#1d4ed8",
    accentFg: "#eff6ff",
    highlight: "#0f766e",
    highlightFg: "#f0fdfa",
    danger: "#be123c",
    bgDark: "#0b1220",
    fgDark: "#e7eef8",
    mutedDark: "#152033",
    mutedFgDark: "#9eb0c9",
    borderDark: "#243044",
    accentDark: "#93c5fd",
    accentFgDark: "#071225",
    highlightDark: "#5eead4",
    highlightFgDark: "#042f2e",
  },
  ember: {
    bg: "#fff5ef",
    fg: "#2a140f",
    muted: "#ffe6d8",
    mutedFg: "#8a4632",
    border: "#f4d0c0",
    accent: "#be123c",
    accentFg: "#fff1f2",
    highlight: "#c2410c",
    highlightFg: "#fff7ed",
    danger: "#9f1239",
    bgDark: "#1a0d0c",
    fgDark: "#ffe8df",
    mutedDark: "#2c1614",
    mutedFgDark: "#e2b1a3",
    borderDark: "#4a2824",
    accentDark: "#fda4af",
    accentFgDark: "#2a0a12",
    highlightDark: "#fdba74",
    highlightFgDark: "#2a1208",
  },
  iris: {
    bg: "#f5f3fb",
    fg: "#1c1530",
    muted: "#ebe6f6",
    mutedFg: "#5b5080",
    border: "#dbd2ef",
    accent: "#6d28d9",
    accentFg: "#f5f3ff",
    highlight: "#be185d",
    highlightFg: "#fdf2f8",
    danger: "#be123c",
    bgDark: "#120e1c",
    fgDark: "#f3eefe",
    mutedDark: "#1e1730",
    mutedFgDark: "#c4b6e0",
    borderDark: "#342a4d",
    accentDark: "#c4b5fd",
    accentFgDark: "#1a1030",
    highlightDark: "#f9a8d4",
    highlightFgDark: "#3b0720",
  },
  grove: {
    bg: "#f1f7f3",
    fg: "#102117",
    muted: "#e1f0e6",
    mutedFg: "#3c6b4e",
    border: "#c7e0d0",
    accent: "#047857",
    accentFg: "#ecfdf5",
    highlight: "#a16207",
    highlightFg: "#fefce8",
    danger: "#c2410c",
    bgDark: "#0b1610",
    fgDark: "#e7f6ee",
    mutedDark: "#13261c",
    mutedFgDark: "#9dceb4",
    borderDark: "#1e3d2e",
    accentDark: "#6ee7b7",
    accentFgDark: "#052e1c",
    highlightDark: "#fde68a",
    highlightFgDark: "#2a1d05",
  },
  dusk: {
    bg: "#f8f3f6",
    fg: "#24141c",
    muted: "#f1e4eb",
    mutedFg: "#7a4d62",
    border: "#e4ced8",
    accent: "#9d174d",
    accentFg: "#fff1f5",
    highlight: "#6d28d9",
    highlightFg: "#f5f3ff",
    danger: "#b91c1c",
    bgDark: "#160d12",
    fgDark: "#fbeaf1",
    mutedDark: "#26141c",
    mutedFgDark: "#e2b4c6",
    borderDark: "#412230",
    accentDark: "#fda4af",
    accentFgDark: "#2a0a14",
    highlightDark: "#d8b4fe",
    highlightFgDark: "#2e1065",
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
