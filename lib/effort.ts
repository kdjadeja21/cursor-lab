export const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export const EFFORT_LABEL: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max",
};

export const EFFORT_SHORT: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
  xhigh: "XHigh",
  max: "Max",
};

export const EFFORT_HINT: Record<EffortLevel, string> = {
  low: "Quick answers · minimal reasoning",
  medium: "Balanced reasoning · everyday tasks",
  high: "Deeper reasoning · slower",
  xhigh: "Extended deliberation · much slower",
  max: "Exhaustive reasoning · longest",
};

/** Multiplier applied to scripted thinking/tool durations. */
export const EFFORT_TIME: Record<EffortLevel, number> = {
  low: 0.55,
  medium: 1,
  high: 1.5,
  xhigh: 2.1,
  max: 2.8,
};

/** Number of extra investigation steps the mock engine performs. */
export const EFFORT_DEPTH: Record<EffortLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  xhigh: 3,
  max: 4,
};

export function effortRank(level: EffortLevel) {
  return EFFORT_LEVELS.indexOf(level);
}

/**
 * Snap a level to the nearest one a model supports. Prefers the closest
 * lower level when equidistant so switching models never silently gets
 * more expensive.
 */
export function snapEffort(
  level: EffortLevel | null,
  supported: readonly EffortLevel[],
): EffortLevel | null {
  if (supported.length === 0) return null;
  if (level === null) return supported[Math.min(1, supported.length - 1)];
  if (supported.includes(level)) return level;
  const target = effortRank(level);
  let best = supported[0];
  let bestDist = Infinity;
  for (const s of supported) {
    const dist = Math.abs(effortRank(s) - target);
    if (dist < bestDist || (dist === bestDist && effortRank(s) < effortRank(best))) {
      best = s;
      bestDist = dist;
    }
  }
  return best;
}

export function stepEffort(
  level: EffortLevel | null,
  supported: readonly EffortLevel[],
  delta: number,
): EffortLevel | null {
  if (supported.length === 0 || level === null) return level;
  const i = supported.indexOf(level);
  const next = Math.min(supported.length - 1, Math.max(0, i + delta));
  return supported[next];
}
