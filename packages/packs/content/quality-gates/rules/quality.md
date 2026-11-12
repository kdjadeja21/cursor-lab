---
title: Quality gates
description: Do not skip the hooks, commit rules, or CI checks this repo enabled
alwaysApply: true
---

Run the same checks CI runs before you hand work back: lint, typecheck, and tests when the repo has them.

Do not use `--no-verify` to skip Husky. If a hook fails, fix the cause.

Commit messages follow Conventional Commits when commitlint is installed.
