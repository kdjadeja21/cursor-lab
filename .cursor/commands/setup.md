# /setup

Usage: `/setup [--update | --check]`

Thin wrapper. Do these in order and nothing else:

1. Run `npm run setup:skills -- <flag>` (pass `--update` or `--check` if given). Run this before anything else.
2. Run `npm run check:prereqs -- craft` and `npm run check:prereqs -- audit`. Show a status table: skill, source, pinned SHA, installed / skipped / failed, reviewed.
3. On `--update` only: regenerate `.cursor/rules-digest.md` (the one model step in setup). Keep it at 15 lines or fewer, pointers only, each pointer to a file that exists, and record the new SHAs from `.cursor/skills.lock.md` in its first-line `sources` comment. Re-run `npm run check:prereqs -- craft` to confirm it is no longer stale.
4. Stop. Tell the user to run `/craft` or `/audit`. Do not start any implementation work, and do not mark any skill as reviewed on the user's behalf.
