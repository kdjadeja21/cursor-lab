import assert from "node:assert/strict";
import test from "node:test";
import { AGENTS_MD_MAX_LINES, encodeConfig, renderProject } from "@seedlayer/core";
import { listPresets, loadCatalog, loadPreset } from "../src/index.ts";

const catalog = loadCatalog();

test("three presets render deterministic repos", () => {
  for (const preset of listPresets()) {
    const first = renderProject({ config: preset.config, projectName: "my-app", catalog });
    const second = renderProject({ config: preset.config, projectName: "my-app", catalog });
    assert.deepEqual(first, second);
    const agents = file(first, "AGENTS.md");
    assert.ok(agents.split(/\r?\n/).length <= AGENTS_MD_MAX_LINES);
    assert.match(agents, /DESIGN\.md/);
    assert.match(file(first, "app/tokens.css"), /--color-bg:/);
    assert.match(
      file(first, "BRANCHING.md"),
      new RegExp(preset.config.git.branchPrefix.replace("/", "\\/")),
    );
    assert.match(file(first, ".seedlayer/lock.json"), new RegExp(preset.id));
    assert.equal(file(first, ".seedlayer/config.json").includes("generatedAt"), false);
    assert.equal(encodeConfig(preset.config).startsWith("sl1."), true);
  }
});

test("presets differ where the product says they differ", () => {
  const startup = render(loadPreset("startup-speed"));
  const team = render(loadPreset("team-strict"));
  const hack = render(loadPreset("hackathon-2h"));

  assert.match(file(startup, "BRANCHING.md"), /agent-safe/);
  assert.match(file(startup, "BRANCHING.md"), /worktree/);
  assert.equal(exists(startup, ".husky/pre-commit"), true);
  assert.equal(exists(startup, "biome.json"), true);
  assert.equal(exists(startup, "CLAUDE.md"), true);
  assert.equal(exists(startup, "components/ui/button.tsx"), true);

  assert.match(file(team, "BRANCHING.md"), /GitHub Flow/);
  assert.equal(exists(team, "eslint.config.mjs"), true);
  assert.equal(exists(team, "components/ui/Button.tsx"), true);
  assert.equal(exists(team, "lib/result.ts"), true);
  assert.match(file(team, "CODE_STYLE.md"), /200/);

  assert.match(file(hack, "BRANCHING.md"), /trunk-based/);
  assert.equal(exists(hack, "CLAUDE.md"), false);
  assert.equal(exists(hack, ".husky/pre-commit"), false);
  assert.equal(exists(hack, ".github/workflows/ci.yml"), true);
  assert.equal(exists(hack, ".cursor/commands/implement.md"), true);
  assert.equal(exists(hack, ".cursor/commands/plan.md"), false);
  assert.match(file(hack, "app/tokens.css"), /#146c43/);
});

test("startup-speed matches the published preset id", () => {
  const preset = loadPreset("startup-speed");
  assert.equal(preset.preset, "startup-speed");
  assert.equal(preset.git.workflow, "agent-safe");
  assert.deepEqual(preset.agents, ["cursor", "claude-code"]);
});

function render(config: ReturnType<typeof loadPreset>) {
  return renderProject({ config, projectName: "my-app", catalog });
}

function file(files: ReturnType<typeof render>, filePath: string): string {
  const match = files.find((entry) => entry.path === filePath);
  assert.ok(match, `missing ${filePath}`);
  return match.contents;
}

function exists(files: ReturnType<typeof render>, filePath: string): boolean {
  return files.some((entry) => entry.path === filePath);
}
