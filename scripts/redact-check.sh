#!/usr/bin/env bash
# ASCII only.
# Usage: redact-check.sh <terms_file> [files...]
# Exit: 0 clean | 1 term found | 2 fail-closed (terms file missing/empty/too short)
set -u
terms="${1:-}"; shift || true

if [ -z "$terms" ] || [ ! -f "$terms" ]; then
  echo "redact-check: terms file not found: '$terms' (fail-closed, blocking)" >&2
  exit 2
fi

# non-empty, non-comment lines only (bash 3.2 compatible: no mapfile)
words=()
while IFS= read -r line; do
  [ -n "$line" ] && words+=("$line")
done < <(grep -v -E '^[[:space:]]*($|#)' "$terms" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')
if [ "${#words[@]}" -lt 1 ]; then
  echo "redact-check: terms file has no usable terms (fail-closed, blocking)" >&2
  exit 2
fi

status=0
for f in "$@"; do
  [ -f "$f" ] || continue
  for w in "${words[@]}"; do
    if grep -n -i -F -- "$w" "$f" >/dev/null 2>&1; then
      echo "redact-check: BLOCKED term '$w' in $f" >&2
      grep -n -i -F -- "$w" "$f" | sed 's/^/    /' >&2
      status=1
    fi
  done
done
exit $status
