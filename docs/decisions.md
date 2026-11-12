# Phase 0 decisions

Checked on 12 November 2026.

## Name: Seedlayer

`seedkit` is not available for this product.

| Surface              | Result                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| npm `seedkit`        | Taken. `seedkit@0.3.0`, MDX demo CLI.                                                                                             |
| npm `create-seedkit` | Unpublished on 17 January 2025. The name is not safely claimable.                                                                 |
| GitHub               | Several repositories named seedkit, including [viewflow/seedkit](https://github.com/viewflow/seedkit), a Django agent scaffolder. |
| Domains              | `seedkit.dev`, `seedkit.com`, and `seedkit.ai` are registered. `seedkit.io` and `seedkit.app` were free.                          |

Seedlayer is the name that stays installable:

| Surface                                             | Result                                                                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| npm `seedlayer`, `create-seedlayer`, `@seedlayer/*` | No packages.                                                                                                                                   |
| GitHub user or org `seedlayer`                      | Not registered.                                                                                                                                |
| Existing repo                                       | [francoisnt/seedlayer](https://github.com/francoisnt/seedlayer) is an unrelated SQLAlchemy seeder. It does not occupy the org or the npm name. |
| Domains                                             | `seedlayer.dev`, `seedlayer.app`, `seedlayer.ai`, and `seedlayer.io` were unregistered. `seedlayer.com` is registered.                         |

The CLI is `npx create-seedlayer`. Config codes use the prefix `sl1.`. Generated repos record state in `.seedlayer/`.

## License: MIT

Generated files are copied into other people's repositories. MIT is the license those projects already expect from a scaffolder. Apache-2.0's notice requirements are a poor fit for that copy step.

The tool is MIT. Generated apps do not get a license file forced on them.

## MVP scope

One stack until the three presets are solid:

- Next.js, TypeScript, Tailwind, shadcn, Vitest
- Agents: Cursor and Claude Code
- Database and auth are `none`
- Hosting is `vercel` or `none`

## Template engine: Handlebars

Markdown, CSS, and agent docs are Handlebars templates. JSON and TypeScript skeletons are built in TypeScript because JSX braces and JSON formatting fight a template language. Both paths go through the pack manifest, so a pack still declares every output path.

Handlebars runs with escaping off and strict mode on. A missing variable fails the render.

## Agent files

One rule body is written twice: `docs/agents/<id>.md` for people, and `.cursor/rules/<id>.mdc` when Cursor is selected. `CLAUDE.md` stays a short index. A separate pack is only worth it when the instruction itself changes, not the file format.

## Sync

Not in this version. Generated docs include `<!-- seedlayer:begin -->` and `<!-- seedlayer:end -->` markers so a later sync can three-way merge those blocks. `.seedlayer/lock.json` stores the config and pack versions, with no timestamp, so a render stays deterministic.

## Zip download

The web UI offers a zip of the rendered files. The CLI is still the path that installs dependencies and runs lint and typecheck. The zip exists because `create-seedlayer` is not published yet.

## Monorepo support

Later. The schema does not offer it.

## TypeScript strictness

Generated apps always typecheck with `strict`. The strictness option changes Biome or ESLint and the written standard, not the compiler.
