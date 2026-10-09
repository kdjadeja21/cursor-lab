# /audit

Usage: `/audit <PR URL> [--post]`

1. Parse owner, repo and PR number from the URL (`https://github.com/<owner>/<repo>/pull/<n>`). A bare number or branch is accepted only if the repo resolves unambiguously from the working copy's `origin`; otherwise stop and ask for the URL.
2. Run `bash .cursor/scripts/check-prereqs.sh audit`. If it fails, stop and tell the user to run `/setup`.
3. Delegate to the `pr-auditor` agent (`.cursor/agents/pr-auditor.md`), which follows the `pr-audit` skill (`.cursor/skills/pr-audit/SKILL.md`). Pass owner, repo, number and whether `--post` was given.
4. Read-only unless `--post` was given. Print the agent's report as the final output.

This command is independent of `/craft`: do not build or modify code.
