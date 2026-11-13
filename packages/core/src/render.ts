import Handlebars from "handlebars";
import { canonicalJson } from "./canonical.js";
import { SeedlayerError } from "./errors.js";
import { resolvePacks } from "./resolve.js";
import { AGENTS_MD_MAX_LINES, SEEDLAYER_VERSION, type SeedlayerConfig } from "./schema.js";
import { designTokens } from "./tokens.js";
import type { AgentRule, Lockfile, PackDefinition, RenderContext, RenderedFile } from "./types.js";

const hbs = Handlebars.create();
hbs.registerHelper("eq", (left: unknown, right: unknown) => left === right);

const WORKFLOW_SUMMARIES: Record<SeedlayerConfig["workflow"][number], string> = {
  plan: "Read the rules and write a short plan before editing.",
  implement: "Make the planned change inside the file-size and token rules.",
  review: "Check the diff against design, style, and branching before a pull request.",
};

export function renderProject(input: {
  config: SeedlayerConfig;
  projectName: string;
  catalog: PackDefinition[];
}): RenderedFile[] {
  const resolved = resolvePacks(input.config, input.catalog);
  const rules = collectRules(resolved.map((item) => item.pack));
  const context = buildContext(input.config, input.projectName, rules);
  const files = new Map<string, string>();

  for (const item of resolved) {
    const built = item.pack.build?.(context) ?? {};
    for (const output of item.pack.manifest.outputs) {
      if (!whenMatches(output.when, input.config)) continue;
      const contents =
        output.template === "@build"
          ? built[output.to]
          : renderTemplate(item.pack, output.template, context);
      if (contents === undefined) {
        throw new SeedlayerError(`Pack "${item.pack.manifest.name}" did not render ${output.to}`);
      }
      if (files.has(output.to)) {
        throw new SeedlayerError(`Two packs wrote ${output.to}`);
      }
      files.set(output.to, ensureTrailingNewline(contents));
    }
  }

  for (const rule of rules) {
    writeRule(files, rule, context.flags.cursor);
  }

  const lock = lockfile(
    input.config,
    resolved.map((item) => item.pack),
  );
  files.set(".seedlayer/lock.json", ensureTrailingNewline(canonicalJson(lock)));
  files.set(".seedlayer/config.json", ensureTrailingNewline(canonicalJson(input.config)));

  const agents = files.get("AGENTS.md");
  if (!agents) throw new SeedlayerError("agents-core did not render AGENTS.md");
  const lineCount = agents.split(/\r?\n/).length;
  if (lineCount > AGENTS_MD_MAX_LINES) {
    throw new SeedlayerError(
      `AGENTS.md is ${lineCount} lines. The limit is ${AGENTS_MD_MAX_LINES}.`,
    );
  }

  return [...files.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([path, contents]) => ({
      path,
      contents,
      executable: isExecutable(path),
    }));
}

export function lockfile(config: SeedlayerConfig, packs: PackDefinition[]): Lockfile {
  return {
    schemaVersion: 1,
    seedlayer: SEEDLAYER_VERSION,
    config,
    packs: packs
      .map((pack) => ({ name: pack.manifest.name, version: pack.manifest.version }))
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0)),
  };
}

function buildContext(
  config: SeedlayerConfig,
  projectName: string,
  rules: AgentRule[],
): RenderContext {
  const buttonFile = config.codeStyle.naming === "pascal-components" ? "Button" : "button";
  return {
    projectName,
    config,
    tokens: designTokens(config.design),
    rules,
    flags: {
      cursor: config.agents.includes("cursor"),
      claude: config.agents.includes("claude-code"),
      plan: config.workflow.includes("plan"),
      implement: config.workflow.includes("implement"),
      review: config.workflow.includes("review"),
      husky: config.quality.includes("husky"),
      commitlint: config.quality.includes("commitlint"),
      ci: config.quality.includes("ci"),
      prReview: config.quality.includes("pr-review"),
      shadcn: config.stack.components === "shadcn",
      vitest: config.stack.tests === "vitest",
      biome: config.codeStyle.linter === "biome",
      eslint: config.codeStyle.linter === "eslint",
      result: config.codeStyle.errorHandling === "result",
      featureFolders: config.codeStyle.folders === "feature",
    },
    buttonImport: `@/components/ui/${buttonFile}`,
    workflowCommands: config.workflow.map((id) => ({ id, summary: WORKFLOW_SUMMARIES[id] })),
  };
}

function collectRules(packs: PackDefinition[]): AgentRule[] {
  const rules: AgentRule[] = [];
  const seen = new Set<string>();
  for (const pack of packs) {
    for (const id of pack.manifest.agentRules) {
      if (seen.has(id)) throw new SeedlayerError(`Two packs define the agent rule "${id}"`);
      seen.add(id);
      const rule = pack.rules[id];
      if (!rule) throw new SeedlayerError(`Pack "${pack.manifest.name}" is missing rule "${id}"`);
      rules.push({
        id,
        title: rule.title,
        description: rule.description,
        alwaysApply: rule.alwaysApply,
        body: rule.body,
        docPath: `docs/agents/${id}.md`,
        cursorPath: `.cursor/rules/${id}.mdc`,
      });
    }
  }
  return rules;
}

function writeRule(files: Map<string, string>, rule: AgentRule, cursor: boolean): void {
  const doc = ensureTrailingNewline(`# ${rule.title}\n\n${rule.body.trim()}\n`);
  files.set(rule.docPath, doc);
  if (!cursor) return;
  const cursorRule = ensureTrailingNewline(
    `---\ndescription: ${yamlString(rule.description)}\nalwaysApply: ${rule.alwaysApply ? "true" : "false"}\n---\n\n# ${rule.title}\n\n${rule.body.trim()}\n`,
  );
  files.set(rule.cursorPath, cursorRule);
}

function renderTemplate(pack: PackDefinition, template: string, context: RenderContext): string {
  const source = pack.templates[template];
  if (source === undefined) {
    throw new SeedlayerError(`Pack "${pack.manifest.name}" is missing template "${template}"`);
  }
  try {
    return hbs.compile(source, { noEscape: true, strict: true })(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "template failed";
    throw new SeedlayerError(`Template ${pack.manifest.name}/${template} failed: ${message}`);
  }
}

export function whenMatches(expression: string | undefined, config: SeedlayerConfig): boolean {
  if (!expression) return true;
  return expression.split("+").every((part) => matchOne(part, config));
}

function matchOne(part: string, config: SeedlayerConfig): boolean {
  const separator = part.indexOf(":");
  if (separator === -1) throw new SeedlayerError(`Bad when clause "${part}"`);
  const path = part.slice(0, separator);
  const expected = part.slice(separator + 1);
  if (path === "agent")
    return config.agents.includes(expected as SeedlayerConfig["agents"][number]);
  if (path === "quality") {
    return config.quality.includes(expected as SeedlayerConfig["quality"][number]);
  }
  if (path === "workflow") {
    return config.workflow.includes(expected as SeedlayerConfig["workflow"][number]);
  }
  return readPath(config, path) === expected;
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || !(key in current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function isExecutable(path: string): boolean {
  return path.startsWith(".husky/") || path.endsWith(".sh");
}
