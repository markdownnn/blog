#!/usr/bin/env bash
# ASCII only. Tests for redact-check.sh (fail-closed redaction scan).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
CHECK="$HERE/redact-check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0
assert_code() { # desc expected actual
  if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $1 (expected $2 got $3)"; fi
}

printf 'AcmeCorp\nJohnDoe\n' > "$TMP/terms.txt"
printf 'hello world\n' > "$TMP/clean.md"
bash "$CHECK" "$TMP/terms.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "clean passes" 0 $?

printf 'we shipped at AcmeCorp last year\n' > "$TMP/leak.md"
bash "$CHECK" "$TMP/terms.txt" "$TMP/leak.md" >/dev/null 2>&1; assert_code "leak blocked" 1 $?

bash "$CHECK" "$TMP/nope.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "missing terms blocks" 2 $?

printf '' > "$TMP/empty.txt"
bash "$CHECK" "$TMP/empty.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "empty terms blocks" 2 $?

printf '# just a comment\n\n' > "$TMP/comment.txt"
bash "$CHECK" "$TMP/comment.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "comment-only terms blocks" 2 $?

echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
