export const EFFORT_IDS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;
export type EffortId = (typeof EFFORT_IDS)[number];

export type EffortMeta = {
  id: EffortId;
  label: string;
  /** Compact form for the composer pill. */
  short: string;
  /** Single character shown in the ladder's level badge. */
  tick: string;
  /** 0..1, drives bar height, halo intensity and mark speed. */
  intensity: number;
  usageMultiplier: number;
  latency: string;
  blurb: string;
  color: string;
};

export const EFFORTS: Record<EffortId, EffortMeta> = {
  none: {
    id: "none",
    label: "None",
    short: "None",
    tick: "0",
    intensity: 0,
    usageMultiplier: 0.5,
    latency: "instant",
    blurb: "No reasoning pass. Answers straight from the prompt.",
    color: "#5f6672",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    short: "Min",
    tick: "1",
    intensity: 0.14,
    usageMultiplier: 0.7,
    latency: "~2s",
    blurb: "A single quick thought. Good for renames and one-liners.",
    color: "#4d7fd4",
  },
  low: {
    id: "low",
    label: "Low",
    short: "Low",
    tick: "2",
    intensity: 0.3,
    usageMultiplier: 1,
    latency: "~5s",
    blurb: "Shallow reasoning. Fine for well-scoped, familiar edits.",
    color: "#5aa2ff",
  },
  medium: {
    id: "medium",
    label: "Medium",
    short: "Med",
    tick: "3",
    intensity: 0.5,
    usageMultiplier: 1.4,
    latency: "~12s",
    blurb: "The everyday balance of depth and speed.",
    color: "#7b8cff",
  },
  high: {
    id: "high",
    label: "High",
    short: "High",
    tick: "4",
    intensity: 0.7,
    usageMultiplier: 2,
    latency: "~30s",
    blurb: "Explores alternatives before committing. Multi-file work.",
    color: "#a97bff",
  },
  xhigh: {
    id: "xhigh",
    label: "Extra high",
    short: "X-high",
    tick: "5",
    intensity: 0.87,
    usageMultiplier: 3,
    latency: "~1m",
    blurb: "Long deliberation. Gnarly bugs and architectural calls.",
    color: "#e06ec8",
  },
  max: {
    id: "max",
    label: "Max",
    short: "Max",
    tick: "6",
    intensity: 1,
    usageMultiplier: 4.5,
    latency: "~2m+",
    blurb: "Everything it has. Slow, expensive, and the sharpest.",
    color: "#ff8f5e",
  },
};

export const EFFORT_LIST: EffortMeta[] = EFFORT_IDS.map((id) => EFFORTS[id]);

export function effortRank(id: EffortId): number {
  return EFFORT_IDS.indexOf(id);
}

/** Nearest supported level when the model changes under the current selection. */
export function clampEffort(desired: EffortId, supported: EffortId[]): EffortId {
  if (supported.length === 0) return desired;
  if (supported.includes(desired)) return desired;
  const target = effortRank(desired);
  return supported.reduce((best, candidate) => {
    const bestDistance = Math.abs(effortRank(best) - target);
    const candidateDistance = Math.abs(effortRank(candidate) - target);
    if (candidateDistance < bestDistance) return candidate;
    if (candidateDistance === bestDistance && effortRank(candidate) > effortRank(best)) {
      return candidate;
    }
    return best;
  }, supported[0]);
}

export function stepEffort(
  current: EffortId,
  supported: EffortId[],
  direction: 1 | -1,
): EffortId {
  const ordered = [...supported].sort((a, b) => effortRank(a) - effortRank(b));
  const index = ordered.indexOf(current);
  if (index === -1) return clampEffort(current, ordered);
  const next = Math.min(Math.max(index + direction, 0), ordered.length - 1);
  return ordered[next];
}

/** Wraps around, for the cycle-effort keyboard shortcut. */
export function cycleEffort(current: EffortId, supported: EffortId[]): EffortId {
  const ordered = [...supported].sort((a, b) => effortRank(a) - effortRank(b));
  if (ordered.length === 0) return current;
  const index = ordered.indexOf(current);
  return ordered[(index + 1) % ordered.length];
}

export function usageLabel(effort: EffortId, fast: boolean): string {
  const multiplier = EFFORTS[effort].usageMultiplier * (fast ? 2 : 1);
  const rounded = Math.round(multiplier * 10) / 10;
  return `${rounded}× usage`;
}
