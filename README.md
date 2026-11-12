# Seedlayer

Configure a project in the web UI, run one command, and get a repo with the app scaffold and the AI context layer already wired up.

```bash
npx create-seedlayer my-app --preset startup-speed
```

The same config always produces the same files. The web UI and the CLI share `@seedlayer/core`, so they cannot disagree.

This branch is a cursor-lab experiment. `main` stays the starter. The name, license, and scope notes are in [docs/decisions.md](docs/decisions.md).

## What you get

| Pack           | Output                                                            |
| -------------- | ----------------------------------------------------------------- |
| stack-nextjs   | Next.js, Tailwind, shadcn, Vitest                                 |
| design-system  | `app/tokens.css`, `DESIGN.md`                                     |
| code-standards | Biome or ESLint, `CODE_STYLE.md`, file-size check                 |
| branching      | Trunk, GitHub Flow, or agent-safe, plus a pull request template   |
| agents-core    | Short `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`                   |
| workflow       | `/plan`, `/implement`, `/review`, skills, hooks, empty MCP config |
| quality-gates  | Husky, commitlint, GitHub Actions                                 |

`AGENTS.md` is an index. Detail lives in the linked docs. The renderer rejects an `AGENTS.md` over 80 lines.

## Presets

- `startup-speed` — agent-safe branches, Biome, Cursor and Claude Code, the full quality gates
- `team-strict` — GitHub Flow, ESLint, PascalCase components, `Result` errors, 200-line files
- `hackathon-2h` — trunk-based, grove palette, Cursor only, CI without Husky

## Develop

```bash
pnpm install
pnpm test
pnpm dev
```

Open the configurator at http://localhost:3000. Copy the command, copy the shareable link, or download a zip of the rendered files. The zip does not install dependencies. The CLI does, then runs lint and typecheck.

```bash
node packages/cli/dist/bin.js my-app --config sl1....
node packages/cli/dist/bin.js my-app --config ./config.json
```

`pnpm verify:generated` renders each preset and runs install, lint, typecheck, test, and build.

## Layout

```text
packages/core     schema, config codes, resolver, renderer
packages/packs    packs and presets
packages/cli      create-seedlayer
apps/web          configurator
```

A config code is `sl1.` plus URL-safe deflate of the canonical JSON. No backend.

`.seedlayer/lock.json` in a generated repo records the config and pack versions.

## License

MIT. See [LICENSE](LICENSE).
