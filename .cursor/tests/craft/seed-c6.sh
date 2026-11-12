#!/usr/bin/env bash
# Seed an unfixable-in-2-passes build failure: a module imported by the page that cannot compile.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
mkdir -p app/_seed
printf 'export const broken: number = "not a number" as unknown as never as string;\nexport default function (\n' > app/_seed/broken.ts
printf 'Seeded app/_seed/broken.ts. Remove with: rm -rf app/_seed\n'
