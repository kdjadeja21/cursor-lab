import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type PackDefinition,
  parseConfig,
  parseManifest,
  type RenderContext,
  type SeedlayerConfig,
} from "@seedlayer/core";
import { buildCodeStandards } from "./builders/code-standards.js";
import { buildStack } from "./builders/stack.js";

const BUILDERS: Record<string, (ctx: RenderContext) => Record<string, string>> = {
  "stack-nextjs": buildStack,
  "code-standards": buildCodeStandards,
};

const PRESET_IDS = ["startup-speed", "team-strict", "hackathon-2h"] as const;

export function packsRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
      if (pkg.name === "@seedlayer/packs") return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate the @seedlayer/packs package root");
}

export function loadCatalog(): PackDefinition[] {
  const content = path.join(packsRoot(), "content");
  return readdirSync(content, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadPack(path.join(content, entry.name)))
    .sort((left, right) => (left.manifest.name < right.manifest.name ? -1 : 1));
}

export function loadPreset(id: string): SeedlayerConfig {
  const file = path.join(packsRoot(), "presets", `${id}.json`);
  if (!existsSync(file)) {
    throw new Error(`Unknown preset "${id}". Expected one of: ${PRESET_IDS.join(", ")}`);
  }
  return parseConfig(JSON.parse(readFileSync(file, "utf8")) as unknown);
}

export function listPresets(): Array<{ id: (typeof PRESET_IDS)[number]; config: SeedlayerConfig }> {
  return PRESET_IDS.map((id) => ({ id, config: loadPreset(id) }));
}

function loadPack(dir: string): PackDefinition {
  const manifest = parseManifest(
    JSON.parse(readFileSync(path.join(dir, "pack.json"), "utf8")) as unknown,
  );
  const templates: Record<string, string> = {};
  for (const output of manifest.outputs) {
    if (output.template === "@build" || templates[output.template]) continue;
    templates[output.template] = readFileSync(path.join(dir, output.template), "utf8");
  }
  const rules: PackDefinition["rules"] = {};
  for (const id of manifest.agentRules) {
    rules[id] = parseRule(readFileSync(path.join(dir, "rules", `${id}.md`), "utf8"));
  }
  return { manifest, templates, rules, build: BUILDERS[manifest.name] };
}

function parseRule(source: string): PackDefinition["rules"][string] {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match?.[1] || match[2] === undefined) {
    throw new Error("Agent rule is missing frontmatter");
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return {
    title: meta.title ?? "Rule",
    description: meta.description ?? "",
    alwaysApply: meta.alwaysApply !== "false",
    body: match[2].trim(),
  };
}
