import type { SeedlayerConfig } from "@seedlayer/core";

export type Choice<T extends string> = {
  value: T;
  label: string;
  detail: string;
};

export const PRESET_COPY: Record<
  Exclude<SeedlayerConfig["preset"], "custom">,
  { label: string; detail: string }
> = {
  "startup-speed": {
    label: "Startup speed",
    detail: "Agent-safe branches, Biome, both agents, every gate.",
  },
  "team-strict": {
    label: "Team strict",
    detail: "GitHub Flow, ESLint, Result errors, 200-line files.",
  },
  "hackathon-2h": {
    label: "Hackathon",
    detail: "Trunk-based, grove palette, Cursor only, CI.",
  },
};

export const SECTIONS = [
  {
    id: "stack",
    label: "Stack",
    lede: "This version generates one stack. The choices below change the repo.",
  },
  {
    id: "design",
    label: "Design",
    lede: "Generated UI reads these tokens. Components do not hardcode colors.",
  },
  {
    id: "standards",
    label: "Standards",
    lede: "These become the linter config, CODE_STYLE.md, and the file-size check.",
  },
  {
    id: "git",
    label: "Git",
    lede: "Branch names, pull request size, and who has to review.",
  },
  {
    id: "agents",
    label: "Agents",
    lede: "The same rules are written into each selected agent's files. Pick at least one.",
  },
  {
    id: "workflow",
    label: "Workflow",
    lede: "Commands the agent can run, and the checks that run before a commit lands.",
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export function isSection(value: string | undefined): value is SectionId {
  return SECTIONS.some((item) => item.id === value);
}

export const PALETTES: Choice<SeedlayerConfig["design"]["palette"]>[] = [
  { value: "ink", label: "Ink", detail: "Warm paper, copper and amber." },
  { value: "harbor", label: "Harbor", detail: "Mist page, cobalt and teal." },
  { value: "ember", label: "Ember", detail: "Cream page, rose and orange." },
  { value: "iris", label: "Iris", detail: "Lilac page, violet and pink." },
  { value: "grove", label: "Grove", detail: "Sage page, emerald and gold." },
  { value: "dusk", label: "Dusk", detail: "Blush page, wine and violet." },
];

export const RADII: Choice<SeedlayerConfig["design"]["radius"]>[] = [
  { value: "none", label: "None", detail: "Square corners." },
  { value: "sm", label: "Small", detail: "4px." },
  { value: "md", label: "Medium", detail: "8px." },
  { value: "lg", label: "Large", detail: "12px." },
];

export const FONTS: Choice<SeedlayerConfig["design"]["fontSans"]>[] = [
  { value: "Inter", label: "Inter", detail: "Neutral grotesque." },
  { value: "Geist", label: "Geist", detail: "Tighter, more technical." },
  { value: "system", label: "System", detail: "The machine's UI font." },
];

export const DENSITIES: Choice<SeedlayerConfig["design"]["density"]>[] = [
  { value: "compact", label: "Compact", detail: "Short section gaps." },
  { value: "comfortable", label: "Comfortable", detail: "Default reading space." },
  { value: "spacious", label: "Spacious", detail: "Long gaps between sections." },
];

export const COMPONENTS: Choice<SeedlayerConfig["stack"]["components"]>[] = [
  { value: "shadcn", label: "shadcn", detail: "Button primitive and cn()." },
  { value: "none", label: "None", detail: "No component library." },
];

export const TESTS: Choice<SeedlayerConfig["stack"]["tests"]>[] = [
  { value: "vitest", label: "Vitest", detail: "Unit test script and config." },
  { value: "none", label: "None", detail: "No test runner." },
];

export const HOSTING: Choice<SeedlayerConfig["stack"]["hosting"]>[] = [
  { value: "vercel", label: "Vercel", detail: "Deploy notes in the README." },
  { value: "none", label: "None", detail: "No host assumed." },
];

export const LINTERS: Choice<SeedlayerConfig["codeStyle"]["linter"]>[] = [
  { value: "biome", label: "Biome", detail: "Format and lint in one tool." },
  { value: "eslint", label: "ESLint", detail: "Flat config. Format stays separate." },
];

export const STRICTNESS: Choice<SeedlayerConfig["codeStyle"]["strictness"]>[] = [
  { value: "relaxed", label: "Relaxed", detail: "Recommended rules, room to move fast." },
  { value: "standard", label: "Standard", detail: "Recommended rules, no extra bans." },
  { value: "strict", label: "Strict", detail: "Recommended rules, and explicit any is banned." },
];

export const FOLDERS: Choice<SeedlayerConfig["codeStyle"]["folders"]>[] = [
  { value: "feature", label: "Feature", detail: "Code sits next to the feature it serves." },
  { value: "type", label: "Type", detail: "components/, lib/, and hooks/." },
];

export const NAMING: Choice<SeedlayerConfig["codeStyle"]["naming"]>[] = [
  { value: "kebab-files", label: "Kebab files", detail: "billing-card.tsx" },
  { value: "pascal-components", label: "Pascal components", detail: "BillingCard.tsx" },
];

export const ERRORS: Choice<SeedlayerConfig["codeStyle"]["errorHandling"]>[] = [
  { value: "throw", label: "Throw", detail: "Exceptions bubble to the boundary." },
  { value: "result", label: "Result", detail: "Domain errors return Result<T, E>." },
];

export const WORKFLOWS: Choice<SeedlayerConfig["git"]["workflow"]>[] = [
  { value: "trunk", label: "Trunk", detail: "Short branches off main. Merge when green." },
  {
    value: "github-flow",
    label: "GitHub Flow",
    detail: "Feature branches and a pull request for every change.",
  },
  {
    value: "agent-safe",
    label: "Agent-safe",
    detail: "agent/<ticket> branches, a size cap, and a human review before merge.",
  },
];

export const AGENTS: Choice<SeedlayerConfig["agents"][number]>[] = [
  { value: "cursor", label: "Cursor", detail: ".cursor/rules, commands, skills, and hooks." },
  {
    value: "claude-code",
    label: "Claude Code",
    detail: "A short CLAUDE.md that points at the same docs.",
  },
];

export const COMMANDS: Choice<SeedlayerConfig["workflow"][number]>[] = [
  { value: "plan", label: "Plan", detail: "Write the approach before editing." },
  { value: "implement", label: "Implement", detail: "Make the change inside the rules." },
  { value: "review", label: "Review", detail: "Check the diff against the standards." },
];

export const QUALITY: Choice<SeedlayerConfig["quality"][number]>[] = [
  { value: "husky", label: "Husky", detail: "Git hooks. Required if commitlint is on." },
  {
    value: "commitlint",
    label: "commitlint",
    detail: "Conventional Commits on the commit-msg hook.",
  },
  { value: "ci", label: "CI", detail: "GitHub Actions for lint, types, test, and build." },
  {
    value: "pr-review",
    label: "PR review",
    detail: "A pull request template with a human review gate.",
  },
];

const AGENT_ORDER = ["cursor", "claude-code"] as const;
const COMMAND_ORDER = ["plan", "implement", "review"] as const;

export function sectionValue(config: SeedlayerConfig, id: SectionId): string {
  switch (id) {
    case "stack":
      return config.stack.components === "shadcn" ? "shadcn" : "Bare";
    case "design":
      return (
        PALETTES.find((item) => item.value === config.design.palette)?.label ??
        config.design.palette
      );
    case "standards":
      return config.codeStyle.linter === "biome" ? "Biome" : "ESLint";
    case "git":
      return (
        WORKFLOWS.find((item) => item.value === config.git.workflow)?.label ?? config.git.workflow
      );
    case "agents":
      if (config.agents.length === 2) return "Both";
      return config.agents[0] === "cursor" ? "Cursor" : "Claude";
    case "workflow":
      return `${config.workflow.length} command${config.workflow.length === 1 ? "" : "s"}`;
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function presetLabel(preset: SeedlayerConfig["preset"]): string {
  if (preset === "custom") return "Custom";
  return PRESET_COPY[preset].label;
}

export function toggleOrdered<T extends string>(
  order: readonly T[],
  selected: readonly T[],
  value: T,
): T[] {
  const next = new Set(selected);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return order.filter((item) => next.has(item));
}

export function toggleAgents(
  selected: SeedlayerConfig["agents"],
  value: SeedlayerConfig["agents"][number],
): SeedlayerConfig["agents"] | null {
  const next = toggleOrdered(AGENT_ORDER, selected, value);
  if (next.length === 0) return null;
  return next;
}

export function toggleCommands(
  selected: SeedlayerConfig["workflow"],
  value: SeedlayerConfig["workflow"][number],
): SeedlayerConfig["workflow"] | null {
  const next = toggleOrdered(COMMAND_ORDER, selected, value);
  if (next.length === 0) return null;
  return next;
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const PREFIX_PATTERN = /^[a-z0-9][a-z0-9._/-]*$/;

export function projectNameError(value: string): string | null {
  if (!NAME_PATTERN.test(value)) return "Use a lowercase project name such as my-app.";
  return null;
}

export function branchPrefixError(value: string): string | null {
  if (value.length === 0 || value.length > 32 || !PREFIX_PATTERN.test(value)) {
    return "Use a lowercase prefix such as agent/.";
  }
  return null;
}
