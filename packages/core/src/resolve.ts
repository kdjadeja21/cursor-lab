import { SeedlayerError } from "./errors.js";
import type { PackManifest } from "./manifest.js";
import type { SeedlayerConfig } from "./schema.js";
import type { PackDefinition } from "./types.js";

export type ResolvedPack = {
  pack: PackDefinition;
  options: Record<string, string | number | boolean>;
};

export function selectPackNames(config: SeedlayerConfig): string[] {
  const names = [
    "stack-nextjs",
    "design-system",
    "code-standards",
    branchingPack(config.git.workflow),
    "agents-core",
    "workflow",
  ];
  if (config.quality.length > 0) names.push("quality-gates");
  return names;
}

export function resolvePacks(config: SeedlayerConfig, catalog: PackDefinition[]): ResolvedPack[] {
  return resolveSelection(selectPackNames(config), catalog, config);
}

export function resolveSelection(
  names: string[],
  catalog: PackDefinition[],
  config: SeedlayerConfig,
): ResolvedPack[] {
  const byName = new Map(catalog.map((pack) => [pack.manifest.name, pack]));
  const selected = new Set(names);
  const queue = [...names];
  while (queue.length > 0) {
    const name = queue.pop();
    if (!name) break;
    const pack = byName.get(name);
    if (!pack) throw new SeedlayerError(`Unknown pack "${name}"`);
    for (const dependency of pack.manifest.requires) {
      if (!selected.has(dependency)) {
        selected.add(dependency);
        queue.push(dependency);
      }
    }
  }

  for (const name of selected) {
    const pack = byName.get(name);
    if (!pack) throw new SeedlayerError(`Unknown pack "${name}"`);
    for (const conflict of pack.manifest.conflicts) {
      if (conflict !== name && selected.has(conflict)) {
        throw new SeedlayerError(`Pack "${name}" conflicts with "${conflict}"`);
      }
    }
  }

  const ordered = topo([...selected], byName);
  return ordered.map((pack) => ({
    pack,
    options: applyOptions(pack.manifest, config),
  }));
}

function branchingPack(workflow: SeedlayerConfig["git"]["workflow"]): string {
  switch (workflow) {
    case "trunk":
      return "branching-trunk";
    case "github-flow":
      return "branching-github-flow";
    case "agent-safe":
      return "branching-agent-safe";
    default: {
      const exhaustive: never = workflow;
      return exhaustive;
    }
  }
}

function applyOptions(
  manifest: PackManifest,
  config: SeedlayerConfig,
): Record<string, string | number | boolean> {
  const options: Record<string, string | number | boolean> = {};
  for (const [key, spec] of Object.entries(manifest.options)) {
    const configured = spec.from ? readPath(config, spec.from) : undefined;
    const value = configured === undefined ? spec.default : configured;
    options[key] = expectOption(
      value,
      spec.type,
      `Option ${manifest.name}.${key} expected ${spec.type} from "${spec.from ?? "default"}"`,
    );
  }
  return options;
}

function expectOption(
  value: unknown,
  type: "string" | "number" | "boolean",
  message: string,
): string | number | boolean {
  switch (type) {
    case "string":
      if (typeof value === "string") return value;
      break;
    case "number":
      if (typeof value === "number") return value;
      break;
    case "boolean":
      if (typeof value === "boolean") return value;
      break;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
  throw new SeedlayerError(message);
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || !(key in current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function topo(names: string[], byName: Map<string, PackDefinition>): PackDefinition[] {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: PackDefinition[] = [];

  const visit = (name: string): void => {
    if (visited.has(name)) return;
    if (visiting.has(name)) throw new SeedlayerError(`Pack dependency cycle at "${name}"`);
    const pack = byName.get(name);
    if (!pack) throw new SeedlayerError(`Unknown pack "${name}"`);
    visiting.add(name);
    for (const dependency of pack.manifest.requires) visit(dependency);
    visiting.delete(name);
    visited.add(name);
    ordered.push(pack);
  };

  for (const name of names) visit(name);
  return ordered;
}
