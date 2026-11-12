import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(here, "../src/bin.ts");

test("create-seedlayer writes a preset without installing", () => {
  const root = mkdtempSync(path.join(tmpdir(), "seedlayer-cli-"));
  const target = path.join(root, "my-app");
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", bin, target, "--preset", "startup-speed", "--skip-install"],
    { cwd: path.resolve(here, "../../.."), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(path.join(target, "AGENTS.md")), true);
  assert.match(readFileSync(path.join(target, "package.json"), "utf8"), /"name": "my-app"/);
  const again = spawnSync(
    process.execPath,
    ["--import", "tsx", bin, target, "--preset", "startup-speed", "--skip-install"],
    { cwd: path.resolve(here, "../../.."), encoding: "utf8" },
  );
  assert.notEqual(again.status, 0);
});
