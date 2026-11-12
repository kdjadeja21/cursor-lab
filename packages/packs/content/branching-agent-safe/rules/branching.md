---
title: Agent-safe git
description: Use agent/ branches, worktrees, a pull request cap, and human merge
alwaysApply: true
---

Read BRANCHING.md before any git command.

Name branches with the configured prefix plus a ticket id. Do the work in a git worktree, not in the main checkout another agent may be using.

Open a pull request when the change is ready. If the diff is over the line cap, split it. Do not merge. A human merges.
