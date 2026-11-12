#!/usr/bin/env bash
# Install pinned third-party skills listed in .cursor/skills.lock.md.
#   (no flag)  install only what is missing or invalid; no network when all valid
#   --update   reinstall every row at its pinned SHA, then flag rules-digest.md stale
#   --check    verify repo/path/SHA exist remotely; install nothing
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# shellcheck source=lib.sh
. .cursor/scripts/lib.sh

mode=install
for a in "$@"; do
  case "$a" in
    --check) mode=check ;;
    --update) mode=update ;;
    -h | --help) sed -n '2,5p' "$0"; exit 0 ;;
    *) echo "unknown flag: $a (use --check or --update)" >&2; exit 2 ;;
  esac
done

[ -f "$LOCK" ] || { echo "missing $LOCK" >&2; exit 2; }

declare -a STATUS=()
failed=0

fetch_sparse() { # repo sha path dest-dir
  local repo="$1" sha="$2" path="$3" dir="$4"
  git clone -q --depth 1 --filter=blob:none --sparse --no-checkout "https://github.com/$repo.git" "$dir" 2>&1 \
    && git -C "$dir" sparse-checkout set --no-cone "/$path" \
    && git -C "$dir" fetch -q --depth 1 --filter=blob:none origin "$sha" \
    && git -C "$dir" checkout -q "$sha" \
    && [ -e "$dir/$path" ]
}

check_remote() { # repo sha path
  local repo="$1" sha="$2" path="$3" dir
  dir=$(mktemp -d)
  git -C "$dir" init -q \
    && git -C "$dir" remote add origin "https://github.com/$repo.git" \
    && git -C "$dir" fetch -q --depth 1 --filter=blob:none origin "$sha" 2>/dev/null \
    && git -C "$dir" cat-file -e "FETCH_HEAD:$path" 2>/dev/null
  local rc=$?
  rm -rf "$dir"
  return $rc
}

review_summary() { # target
  local t="$1" files bytes urls cmds
  files=$(find "$t" -type f | wc -l | tr -d ' ')
  bytes=$(find "$t" -type f -print0 | xargs -0 cat | wc -c | tr -d ' ')
  urls=$(find "$t" -type f \( -name '*.md' -o -name '*.mdc' \) -print0 | xargs -0 grep -hoE 'https?://[^ )>"`]+' 2>/dev/null | sort -u | head -5 | tr '\n' ' ')
  cmds=$(find "$t" -type f \( -name '*.md' -o -name '*.mdc' \) -print0 | xargs -0 grep -hcE '^\s*(\$ |npx |npm |curl |bash |sh |sudo )' 2>/dev/null | paste -sd+ - | bc 2>/dev/null)
  echo "    review: $files file(s), $bytes bytes, shell-like lines: ${cmds:-0}; urls: ${urls:-none}"
  echo "    review: read it, then set 'Reviewed' in $LOCK to 'yes (<name>, <date>)'"
}

while IFS='|' read -r name repo path sha target reviewed; do
  case "$mode" in
    check)
      if check_remote "$repo" "$sha" "$path"; then
        STATUS+=("$name|resolved|$repo@${sha:0:7}:$path")
      else
        STATUS+=("$name|FAILED|$repo@${sha:0:7}:$path not found. Fix the path or SHA in $LOCK")
        failed=1
      fi
      ;;
    install | update)
      if [ "$mode" = install ] && target_valid "$target"; then
        STATUS+=("$name|skipped|already valid")
        continue
      fi
      tmp=$(mktemp -d)
      if fetch_sparse "$repo" "$sha" "$path" "$tmp"; then
        rm -rf "$target"
        mkdir -p "$(dirname "$target")"
        cp -R "$tmp/$path" "$target"
        if target_valid "$target"; then
          STATUS+=("$name|installed|${sha:0:7}")
          [ "$reviewed" = "no" ] && review_summary "$target"
        else
          rm -rf "$target"
          STATUS+=("$name|FAILED|installed files have no valid SKILL.md/frontmatter")
          failed=1
        fi
      else
        STATUS+=("$name|FAILED|could not fetch $repo@${sha:0:7}:$path. Manual fix: git clone https://github.com/$repo and copy $path to $target")
        failed=1
      fi
      rm -rf "$tmp"
      ;;
    *) echo "unreachable mode: $mode" >&2; exit 2 ;;
  esac
done < <(lock_rows)

if [ "$mode" = install ] && [ ! -f components.json ] && [ "$failed" = 0 ]; then
  echo "components.json missing: initialising shadcn"
  if npx --yes shadcn@latest init --defaults --yes; then
    STATUS+=("shadcn-init|installed|components.json created")
  else
    STATUS+=("shadcn-init|FAILED|run: npx shadcn@latest init (Tailwind 4, app/globals.css, CSS variables)")
    failed=1
  fi
fi

echo
printf '%-36s %-10s %s\n' SKILL STATUS DETAIL
for s in "${STATUS[@]}"; do
  IFS='|' read -r n st d <<<"$s"
  printf '%-36s %-10s %s\n' "$n" "$st" "$d"
done

if [ "$mode" = install ] && ! printf '%s\n' "${STATUS[@]}" | grep -vq '|skipped|'; then
  echo "All skills installed, nothing to do"
fi
if [ "$mode" = update ] && [ "$failed" = 0 ]; then
  echo "rules-digest.md may be stale: regenerate it (/setup --update does this) and record the SHAs from $LOCK"
fi
exit "$failed"
