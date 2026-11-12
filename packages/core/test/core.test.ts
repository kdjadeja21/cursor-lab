import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { PackDefinition, SeedlayerConfig } from "../src/index.ts";
import {
  decodeConfig,
  encodeConfig,
  parseConfig,
  resolveSelection,
  zipFiles,
} from "../src/index.ts";

const config = {
  schemaVersion: 1,
  preset: "custom",
  stack: {
    framework: "nextjs",
    language: "typescript",
    styling: "tailwind",
    components: "shadcn",
    tests: "vitest",
    database: "none",
    auth: "none",
    hosting: "vercel",
  },
  design: {
    palette: "neutral",
    radius: "md",
    fontSans: "Inter",
    density: "comfortable",
  },
  codeStyle: {
    linter: "biome",
    strictness: "strict",
    maxFileLines: 300,
    folders: "feature",
    naming: "kebab-files",
    errorHandling: "throw",
  },
  git: {
    workflow: "agent-safe",
    branchPrefix: "agent/",
    commits: "conventional",
    maxPrLines: 400,
  },
  agents: ["claude-code", "cursor"],
  workflow: ["review", "plan"],
  quality: ["commitlint", "husky"],
} satisfies SeedlayerConfig;

test("parseConfig canonicalizes array order and rejects commitlint without husky", () => {
  const parsed = parseConfig(config);
  assert.deepEqual(parsed.agents, ["cursor", "claude-code"]);
  assert.deepEqual(parsed.workflow, ["plan", "review"]);
  assert.deepEqual(parsed.quality, ["husky", "commitlint"]);
  assert.throws(() => parseConfig({ ...config, quality: ["commitlint"] }));
});

test("config codes round-trip and ignore object key order", () => {
  const parsed = parseConfig(config);
  const code = encodeConfig(parsed);
  assert.equal(code.startsWith("sl1."), true);
  assert.deepEqual(decodeConfig(code), parsed);
  const reversed = {
    quality: parsed.quality,
    workflow: parsed.workflow,
    agents: parsed.agents,
    git: parsed.git,
    codeStyle: parsed.codeStyle,
    design: parsed.design,
    stack: parsed.stack,
    preset: parsed.preset,
    schemaVersion: parsed.schemaVersion,
  };
  assert.equal(encodeConfig(parseConfig(reversed)), code);
  assert.throws(() => decodeConfig("nope"));
});

test("resolver applies option defaults, dependencies, and conflicts", () => {
  const agents: PackDefinition = {
    manifest: {
      name: "agents-core",
      version: "0.1.0",
      requires: [],
      conflicts: [],
      options: {},
      outputs: [],
      agentRules: [],
    },
    templates: {},
    rules: {},
  };
  const branching: PackDefinition = {
    manifest: {
      name: "branching-agent-safe",
      version: "0.1.0",
      requires: ["agents-core"],
      conflicts: ["branching-trunk"],
      options: {
        branchPrefix: { type: "string", default: "zzz/", from: "git.branchPrefix" },
      },
      outputs: [],
      agentRules: [],
    },
    templates: {},
    rules: {},
  };
  const trunk: PackDefinition = {
    manifest: {
      name: "branching-trunk",
      version: "0.1.0",
      requires: [],
      conflicts: ["branching-agent-safe"],
      options: {},
      outputs: [],
      agentRules: [],
    },
    templates: {},
    rules: {},
  };
  const resolved = resolveSelection(
    ["branching-agent-safe"],
    [agents, branching, trunk],
    parseConfig(config),
  );
  assert.deepEqual(
    resolved.map((item) => item.pack.manifest.name),
    ["agents-core", "branching-agent-safe"],
  );
  assert.equal(resolved[1]?.options.branchPrefix, "agent/");
  assert.throws(() =>
    resolveSelection(
      ["branching-agent-safe", "branching-trunk"],
      [agents, branching, trunk],
      parseConfig(config),
    ),
  );
});

test("zip archives round-trip", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "seedlayer-zip-"));
  const zipPath = path.join(dir, "out.zip");
  writeFileSync(zipPath, zipFiles([{ path: "docs/hello.txt", contents: "hi\n" }]));
  const text = execFileSync(
    "python3",
    [
      "-c",
      "import zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read('docs/hello.txt').decode(), end='')",
      zipPath,
    ],
    { encoding: "utf8" },
  );
  assert.equal(text, "hi\n");
});
