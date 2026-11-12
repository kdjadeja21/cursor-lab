import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "packages/cli/dist/bin.js");
const presets = process.env.PRESET
  ? [process.env.PRESET]
  : ["startup-speed", "team-strict", "hackathon-2h"];

for (const preset of presets) {
  const dir = mkdtempSync(path.join(tmpdir(), "seedlayer-verify-"));
  const target = path.join(dir, "my-app");
  console.log(`\n== ${preset} ==`);
  run(process.execPath, [cli, target, "--preset", preset, "--skip-install"], root);
  run("npm", ["install"], target);
  run("npm", ["run", "lint"], target);
  run("npm", ["run", "typecheck"], target);
  run("npm", ["test"], target);
  run("npm", ["run", "build"], target);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
