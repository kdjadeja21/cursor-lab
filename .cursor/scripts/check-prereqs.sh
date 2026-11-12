#!/usr/bin/env bash
# Usage: check-prereqs.sh <craft|audit>
# Exit 0 when ready, 1 (with "run /setup") when anything required is missing.
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# shellcheck source=lib.sh
. .cursor/scripts/lib.sh

cmd="${1:-}"
case "$cmd" in
  craft) skills=(impeccable composition-patterns react-best-practices shadcn)
         files=(components.json .cursor/rules-digest.md .cursor/skills/ui-craft/patterns.md .cursor/skills/ui-craft/SKILL.md) ;;
  audit) skills=(thermo-nuclear-code-quality-review react-best-practices composition-patterns shadcn)
         files=(.cursor/agents/thermo-nuclear-code-quality-review.md .cursor/rules-digest.md .cursor/skills/pr-audit/report-template.md .cursor/skills/pr-audit/SKILL.md .cursor/agents/pr-auditor.md) ;;
  *) echo "usage: check-prereqs.sh <craft|audit>" >&2; exit 2 ;;
esac

missing=0
warn=0
for s in "${skills[@]}"; do
  if target_valid ".cursor/skills/$s"; then echo "ok       skill $s"
  else echo "MISSING  skill $s (absent or invalid SKILL.md frontmatter)"; missing=1; fi
done
for f in "${files[@]}"; do
  if [ -s "$f" ]; then echo "ok       $f"; else echo "MISSING  $f"; missing=1; fi
done

if [ -f .cursor/rules-digest.md ] && [ -f "$LOCK" ]; then
  while IFS='|' read -r name _ _ sha _ reviewed; do
    grep -q "$sha" .cursor/rules-digest.md || { echo "WARN     rules-digest.md is stale: no $name SHA ${sha:0:7}"; warn=1; }
    [ "$reviewed" = "no" ] && { echo "WARN     $name not yet reviewed (see $LOCK)"; warn=1; }
  done < <(lock_rows)
  while read -r p; do
    [ -e "$p" ] || { echo "WARN     rules-digest.md points to missing $p"; warn=1; }
  done < <(grep -oE '\.cursor/[A-Za-z0-9_./-]+\.(md|mdc)' .cursor/rules-digest.md | sort -u)
fi

if [ "$missing" = 1 ]; then
  echo "NOT READY: run /setup"
  exit 1
fi
[ "$warn" = 1 ] && echo "READY with warnings" || echo "READY"
