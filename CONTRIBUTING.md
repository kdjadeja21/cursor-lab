# Contributing

Seedlayer is a config, a catalog of packs, and a renderer. The web form and the CLI both call that renderer.

## Repository

```text
packages/core     Zod schema, config codes, pack resolver, Handlebars renderer
packages/packs    Pack content and the three presets
packages/cli      create-seedlayer
apps/web          Configurator
```

```bash
pnpm install
pnpm test
pnpm dev
```

Node 20 or newer. The repo uses pnpm.

## Add a pack

1. Create `packages/packs/content/<name>/pack.json`.
2. Validate it with the manifest schema: `name`, `version`, `requires`, `conflicts`, `options`, `outputs`, `agentRules`.
3. Put Handlebars files next to the manifest. Use `{{config...}}`, `{{tokens...}}`, and `{{flags...}}`. Escaping is off, and a missing variable fails the build.
4. For JSON or TypeScript that Handlebars would mangle, add a builder in `packages/packs/src/builders` and point the output at `"template": "@build"`.
5. Conditional files set `when`. Combine checks with `+`, for example `agent:cursor+workflow:plan`.
6. Rules live in `rules/<id>.md` with `title`, `description`, and `alwaysApply` frontmatter. The renderer writes `docs/agents/<id>.md` and, for Cursor, `.cursor/rules/<id>.mdc`.
7. Teach `selectPackNames` when the pack should be included.
8. Add a test that a preset renders the new file and that two conflicting packs fail.

Keep `AGENTS.md` under 80 lines. The renderer throws if it grows past that.

## Add a preset

Add `packages/packs/presets/<id>.json`. It must parse as a full config, and its `preset` field must be the file's id. Cover it in `packages/packs/test/render.test.ts`.

Presets that ship: `startup-speed`, `team-strict`, `hackathon-2h`.

## Generated apps

`pnpm verify:generated` renders each preset and runs install, lint, typecheck, test, and build. Set `PRESET=startup-speed` to run one.

Do not put a timestamp in rendered output. The same config must produce the same files.
