#!/usr/bin/env bash
# ASCII only. Git pre-push hook glue.
# Scans committed content files against ~/.blog-redact-terms.txt before allowing push.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
TERMS="$HOME/.blog-redact-terms.txt"

# tracked content files that will go public (bash 3.2 compatible: no mapfile)
files=()
while IFS= read -r line; do
  [ -n "$line" ] && files+=("$line")
done < <(git ls-files 'src/content/posts/*.md' 'src/content/posts/*.mdx' 'src/content/projects/*.md' 'src/content/projects/*.mdx')
if [ "${#files[@]}" -eq 0 ]; then exit 0; fi

if ! bash "$HERE/redact-check.sh" "$TERMS" "${files[@]}"; then
  echo "" >&2
  echo "push blocked by redact-check. Fix the lines above or update $TERMS." >&2
  echo "(To bypass in an emergency you would use --no-verify, but do NOT for content.)" >&2
  exit 1
fi
exit 0
