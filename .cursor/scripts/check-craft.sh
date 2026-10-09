#!/usr/bin/env bash
# Usage: check-craft.sh <C1..C7> [--base <ref>] [--transcript <file>] [--no-build]
# Deterministic checks on the working tree (and optionally the command's final output).
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
id="${1:-}"; shift || true
base=HEAD; transcript=""; build=1
while [ $# -gt 0 ]; do
  case "$1" in
    --base) base="$2"; shift 2 ;;
    --transcript) transcript="$2"; shift 2 ;;
    --no-build) build=0; shift ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done
fail=0
ok()  { echo "PASS  $*"; }
bad() { echo "FAIL  $*"; fail=1; }
changed() { { git diff --name-only "$base" -- app components lib; git ls-files -o --exclude-standard -- app components lib; } | sort -u | grep -E '\.(tsx?|css)$' || true; }
mine() { changed | grep -v '^components/ui/' || true; }
say()  { [ -n "$transcript" ] && grep -qiE "$1" "$transcript"; }
need_transcript() { [ -n "$transcript" ] || { echo "SKIP  needs --transcript for: $1"; return 1; }; }

common() {
  files=$(mine)
  [ -n "$files" ] || { bad "no changed files under app/components/lib"; return; }
  if echo "$files" | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|\b(rgb|hsl)a?\(' -- 2>/dev/null | grep -v 'globals.css' | grep -q .; then bad "hard-coded color in changed files"; else ok "no hard-coded colors"; fi
  if echo "$files" | xargs grep -nE 'useEffect\([^)]*fetch|useEffect.*fetch\(' -- 2>/dev/null | grep -q .; then bad "useEffect data fetching"; else ok "no useEffect data fetching"; fi
  if echo "$files" | xargs grep -nE 'forwardRef' -- 2>/dev/null | grep -q .; then bad "forwardRef in React 19 code"; else ok "no forwardRef"; fi
  if git diff --name-only "$base" -- components/ui | grep -q .; then bad "existing components/ui files modified"; else ok "components/ui internals untouched"; fi
  if [ "$build" = 1 ]; then
    npm run -s lint >/dev/null 2>&1 && ok "lint" || bad "lint"
    npm run -s build >/dev/null 2>&1 && ok "build" || bad "build"
  fi
}

case "$id" in
  C1)
    common
    git diff --quiet "$base" -- app/globals.css && ok "globals.css unchanged" || bad "globals.css changed"
    mine | xargs grep -lE "from ['\"]@/components/ui/card['\"]" 2>/dev/null | grep -q . && ok "shadcn Card imported" || bad "shadcn Card not imported"
    [ -f components/ui/card.tsx ] && ok "components/ui/card.tsx present" || bad "card.tsx missing"
    [ -z "$transcript" ] || { say '^#+ *plan|^plan' && ok "plan present in output" || bad "no plan in output"; } ;;
  C2)
    common
    git diff --quiet "$base" -- app/globals.css && bad "globals.css was not changed" || ok "globals.css changed"
    grep -q -- '--primary' app/globals.css && grep -q -- '--background' app/globals.css && ok "shadcn variables present" || bad "shadcn variables missing"
    grep -q 'prefers-reduced-motion' app/globals.css && ok "prefers-reduced-motion present" || bad "prefers-reduced-motion missing"
    if need_transcript "pattern named"; then
      names=$(grep -E '^## ' .cursor/skills/ui-craft/patterns.md | sed 's/^## //; s/ (.*//' | paste -sd'|' -)
      grep -qiE "$names" "$transcript" && ok "pattern from patterns.md named" || bad "no patterns.md pattern named"
    fi ;;
  C3)
    common
    mine | xargs grep -lE "from ['\"]zod['\"]" 2>/dev/null | grep -q . && ok "zod used" || bad "zod not used"
    mine | xargs grep -lE 'useActionState|useOptimistic' 2>/dev/null | grep -q . && ok "useActionState/useOptimistic used" || bad "no useActionState/useOptimistic"
    n=$(mine | xargs grep -lE "^['\"]use client['\"]" 2>/dev/null | wc -l)
    [ "$n" -le 1 ] && ok "\"use client\" in at most one file" || bad "\"use client\" in $n files" ;;
  C4)
    need_transcript "assumptions" && { say 'assumption' && ok "assumptions listed" || bad "no assumptions listed"; } ;;
  C5)
    [ -z "$(changed)" ] && ok "zero files changed" || bad "files changed"
    need_transcript "missing tool named" && { say 'missing|unavailable|no .*(jira|linear|github).* tool' && ok "missing tool named" || bad "missing tool not named"; } ;;
  C6)
    need_transcript "stops after 2 passes" && {
      say 'fix pass(es)? *(2|two)|2 fix passes|two fix passes' && ok "reports 2 fix passes" || bad "no 2-pass report"
      say 'fail|error' && ok "failure reported" || bad "failure not reported"; } ;;
  C7)
    common
    need_transcript "rules deliberately skipped" && { say 'rules deliberately skipped' && ok "skipped-rules section present" || bad "no skipped-rules section"; } ;;
  *) echo "usage: check-craft.sh <C1..C7> [--base ref] [--transcript file] [--no-build]" >&2; exit 2 ;;
esac
exit "$fail"
