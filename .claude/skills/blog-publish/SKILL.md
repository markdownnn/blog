---
name: blog-publish
description: Use when the user asks to publish, ship, release, or 발행/올려/배포 a blog draft in this Astro blog repo (blog.teamnyongs.com) — turning a local draft into a live post.
---

# blog-publish

Publish a local draft to the live blog at https://blog.teamnyongs.com.

## Overview

Drafts live at `src/content/posts/*.draft.md` — gitignored, dev-preview only. Publishing = redaction scan → rename to `.md` + flip `draft: false` → build check → commit → push. Cloudflare Workers Builds auto-deploys on push. **Do NOT run `wrangler deploy` yourself** — the push triggers the deploy.

## Steps

1. **Find the draft.** `ls src/content/posts/*.draft.md`. Several → ask which (default: most recent / the one just written). None → tell the user there is nothing to publish.

2. **Redaction scan — never skip.** Run:
   ```bash
   bash scripts/redact-check.sh "$HOME/.blog-redact-terms.txt" <draft-file>
   ```
   - Exit 0 → clean, continue.
   - Exit 1 → a redaction term appears. **STOP.** Show the flagged lines and ask the user how to reword. Never publish over a hit.
   - Exit 2 → terms file missing/empty. **STOP.** Ask the user to populate `~/.blog-redact-terms.txt`.
   The word-list only catches KNOWN terms. Also eyeball the draft against `SPEC.md` section 8: company/client names, real people, business numbers, and any burnout/leave narrative — remove or generalize.

3. **Publish the file.** Rename (drops the draft marker) and flip the flag:
   ```bash
   mv src/content/posts/<slug>.draft.md src/content/posts/<slug>.md
   ```
   Use plain `mv`, NOT `git mv` — the `.draft.md` is gitignored/untracked, so `git mv` errors ("not under version control"). The renamed `.md` becomes a new untracked file that `git add` picks up in step 5.
   Then set frontmatter `draft: true` → `draft: false`. Keep the `YYYY-MM-DD-` filename prefix; the public URL drops the date automatically (`toUrlSlug`).

4. **Build check.** `npm run build` must succeed — catches broken frontmatter/MDX before it goes live.

5. **Commit + push.**
   ```bash
   git add src/content/posts/<slug>.md && git commit -m "post: <title>" && git push
   ```
   The pre-push hook re-scans content as a backstop. If it blocks, fix the flagged lines (do NOT use `--no-verify`).

6. **Deploy is automatic.** Cloudflare Workers Builds rebuilds and deploys on push (~1–2 min). Tell the user the live URL: `https://blog.teamnyongs.com/blog/<url-slug>` where `<url-slug>` is the filename minus the `YYYY-MM-DD-` prefix.

## Do NOT

- Publish a draft that fails the redaction scan (exit 1) or when the terms file is missing (exit 2).
- Commit the `.draft.md` name — it is gitignored; you must rename to `.md` first.
- Run `wrangler deploy` manually — push auto-deploys via Workers Builds.
- Bypass the pre-push hook with `--no-verify`.
