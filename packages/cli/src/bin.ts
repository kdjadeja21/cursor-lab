#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  decodeConfig,
  formatConfigError,
  parseConfig,
  projectNameSchema,
  renderProject,
  type SeedlayerConfig,
  SeedlayerError,
} from "@seedlayer/core";
import { loadCatalog, loadPreset } from "@seedlayer/packs";

try {
  main();
} catch (error) {
  console.error(formatConfigError(error));
  process.exit(1);
}

function main(): void {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      config: { type: "string" },
      preset: { type: "string" },
      "skip-install": { type: "boolean", default: false },
      "skip-verify": { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    return;
  }

  const directory = positionals[0];
  if (!directory || positionals.length !== 1) {
    printHelp();
    throw new SeedlayerError("Pass one directory.");
  }
  if (Boolean(values.config) === Boolean(values.preset)) {
    throw new SeedlayerError("Pass exactly one of --config or --preset.");
  }

  const config = values.preset ? loadPreset(values.preset) : readConfig(values.config ?? "");
  const projectName = path.basename(path.resolve(directory));
  const parsedName = projectNameSchema.safeParse(projectName);
  if (!parsedName.success) {
    throw new SeedlayerError(parsedName.error.issues.map((issue) => issue.message).join("\n"));
  }

  const target = path.resolve(directory);
  prepareDirectory(target, values.force);
  const files = renderProject({
    config,
    projectName: parsedName.data,
    catalog: loadCatalog(),
  });
  for (const file of files) {
    const dest = path.join(target, file.path);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, file.contents, { mode: file.executable ? 0o755 : 0o644 });
  }
  console.log(`Wrote ${files.length} files to ${target}`);

  ensureGit(target);
  if (values["skip-install"]) return;
  run("npm", ["install"], target);
  if (values["skip-verify"]) return;
  run("npm", ["run", "lint"], target);
  run("npm", ["run", "typecheck"], target);
}

function readConfig(value: string): SeedlayerConfig {
  if (value.startsWith("sl1.")) return decodeConfig(value);
  if (existsSync(value)) return parseConfig(JSON.parse(readFileSync(value, "utf8")) as unknown);
  throw new SeedlayerError(`Config "${value}" is not an sl1 code or a file.`);
}

function prepareDirectory(target: string, force: boolean): void {
  if (target === path.parse(target).root) {
    throw new SeedlayerError("Refusing to write to the filesystem root.");
  }
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
    return;
  }
  if (readdirSync(target).length === 0) return;
  if (!force) throw new SeedlayerError(`${target} is not empty. Pass --force to replace it.`);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
}

function ensureGit(target: string): void {
  const inside = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: target,
    stdio: "ignore",
  });
  if (inside.status === 0) return;
  const created = spawnSync("git", ["init", "-b", "main"], { cwd: target, stdio: "inherit" });
  if (created.status !== 0) process.exit(created.status ?? 1);
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function printHelp(): void {
  console.log(`create-seedlayer <directory> (--config <code-or-file> | --preset <name>)

Options:
  --skip-install   Write files only
  --skip-verify    Install dependencies and skip lint/typecheck
  --force          Replace a non-empty directory
`);
}
