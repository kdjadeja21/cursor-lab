import type { PackManifest } from "./manifest.js";
import type { SeedlayerConfig } from "./schema.js";

export type AgentRule = {
  id: string;
  title: string;
  description: string;
  alwaysApply: boolean;
  body: string;
  docPath: string;
  cursorPath: string;
};

export type PackDefinition = {
  manifest: PackManifest;
  templates: Record<string, string>;
  rules: Record<string, Omit<AgentRule, "id" | "docPath" | "cursorPath">>;
  build?: (ctx: RenderContext) => Record<string, string>;
};

export type RenderedFile = {
  path: string;
  contents: string;
  executable?: boolean;
};

export type DesignTokens = {
  bg: string;
  fg: string;
  muted: string;
  mutedFg: string;
  border: string;
  accent: string;
  accentFg: string;
  danger: string;
  bgDark: string;
  fgDark: string;
  mutedDark: string;
  mutedFgDark: string;
  borderDark: string;
  accentDark: string;
  accentFgDark: string;
  radius: string;
  fontSans: string;
  spaceSection: string;
};

export type RenderContext = {
  projectName: string;
  config: SeedlayerConfig;
  tokens: DesignTokens;
  rules: AgentRule[];
  flags: {
    cursor: boolean;
    claude: boolean;
    plan: boolean;
    implement: boolean;
    review: boolean;
    husky: boolean;
    commitlint: boolean;
    ci: boolean;
    prReview: boolean;
    shadcn: boolean;
    vitest: boolean;
    biome: boolean;
    eslint: boolean;
    result: boolean;
    featureFolders: boolean;
  };
  buttonImport: string;
  workflowCommands: Array<{ id: string; summary: string }>;
};

export type Lockfile = {
  schemaVersion: 1;
  seedlayer: string;
  config: SeedlayerConfig;
  packs: Array<{ name: string; version: string }>;
};
