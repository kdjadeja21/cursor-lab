import { z } from "zod";

export const SCHEMA_VERSION = 1 as const;
export const SEEDLAYER_VERSION = "0.1.0";
export const AGENTS_MD_MAX_LINES = 80;

export const presetIdSchema = z.enum(["startup-speed", "team-strict", "hackathon-2h", "custom"]);

const PALETTE_IDS = ["ink", "harbor", "ember", "iris", "grove", "dusk"] as const;

const LEGACY_PALETTES: Record<string, (typeof PALETTE_IDS)[number]> = {
  neutral: "ink",
  slate: "harbor",
  zinc: "iris",
  vivid: "grove",
};

export const paletteSchema = z.preprocess((value) => {
  if (typeof value === "string" && value in LEGACY_PALETTES) {
    return LEGACY_PALETTES[value];
  }
  return value;
}, z.enum(PALETTE_IDS));
export const agentTargetSchema = z.enum(["cursor", "claude-code"]);
export const workflowCommandSchema = z.enum(["plan", "implement", "review"]);
export const qualityGateSchema = z.enum(["husky", "commitlint", "ci", "pr-review"]);

const AGENT_ORDER = ["cursor", "claude-code"] as const;
const WORKFLOW_ORDER = ["plan", "implement", "review"] as const;
const QUALITY_ORDER = ["husky", "commitlint", "ci", "pr-review"] as const;

export const seedlayerConfigSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    preset: presetIdSchema,
    stack: z
      .object({
        framework: z.enum(["nextjs"]),
        language: z.enum(["typescript"]),
        styling: z.enum(["tailwind"]),
        components: z.enum(["shadcn", "none"]),
        tests: z.enum(["vitest", "none"]),
        database: z.enum(["none"]),
        auth: z.enum(["none"]),
        hosting: z.enum(["vercel", "none"]),
      })
      .strict(),
    design: z
      .object({
        palette: paletteSchema,
        radius: z.enum(["none", "sm", "md", "lg"]),
        fontSans: z.enum(["Inter", "Geist", "system"]),
        density: z.enum(["compact", "comfortable", "spacious"]),
      })
      .strict(),
    codeStyle: z
      .object({
        linter: z.enum(["biome", "eslint"]),
        strictness: z.enum(["relaxed", "standard", "strict"]),
        maxFileLines: z.number().int().min(80).max(1000),
        folders: z.enum(["feature", "type"]),
        naming: z.enum(["kebab-files", "pascal-components"]),
        errorHandling: z.enum(["throw", "result"]),
      })
      .strict(),
    git: z
      .object({
        workflow: z.enum(["trunk", "github-flow", "agent-safe"]),
        branchPrefix: z
          .string()
          .regex(/^[a-z0-9][a-z0-9._/-]*$/, "Branch prefix must be a lowercase path fragment")
          .max(32),
        commits: z.enum(["conventional"]),
        maxPrLines: z.number().int().min(50).max(2000),
      })
      .strict(),
    agents: z.array(agentTargetSchema).min(1),
    workflow: z.array(workflowCommandSchema).min(1),
    quality: z.array(qualityGateSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.agents).size !== value.agents.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agents"],
        message: "Agents must be unique",
      });
    }
    if (new Set(value.workflow).size !== value.workflow.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workflow"],
        message: "Workflow commands must be unique",
      });
    }
    if (new Set(value.quality).size !== value.quality.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quality"],
        message: "Quality gates must be unique",
      });
    }
    if (value.quality.includes("commitlint") && !value.quality.includes("husky")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quality"],
        message: "commitlint needs the husky gate so the commit-msg hook is installed",
      });
    }
  });

export type SeedlayerConfig = z.infer<typeof seedlayerConfigSchema>;
export type AgentTarget = z.infer<typeof agentTargetSchema>;
export type WorkflowCommand = z.infer<typeof workflowCommandSchema>;
export type QualityGate = z.infer<typeof qualityGateSchema>;

export const projectNameSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Use a lowercase project name such as my-app");

export function parseConfig(input: unknown): SeedlayerConfig {
  const parsed = seedlayerConfigSchema.parse(input);
  return {
    ...parsed,
    agents: AGENT_ORDER.filter((agent) => parsed.agents.includes(agent)),
    workflow: WORKFLOW_ORDER.filter((command) => parsed.workflow.includes(command)),
    quality: QUALITY_ORDER.filter((gate) => parsed.quality.includes(gate)),
  };
}

export function formatConfigError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
  }
  if (error instanceof Error) return error.message;
  return "Unknown config error";
}
