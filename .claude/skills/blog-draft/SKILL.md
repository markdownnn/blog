---
name: blog-draft
description: Use when the user asks to draft, write, or start a blog post, build-log, or note for this Astro blog (blog.teamnyongs.com) — e.g. "블로그 글 써줘", "포스트 초안", "build-log 정리해줘", "이거 글로 써줘".
---

# blog-draft

Create a new LOCAL draft for the blog. Output: `src/content/posts/YYYY-MM-DD-slug.draft.md` — gitignored, dev-previewable, never auto-published. The user reviews, then runs blog-publish.

## Steps

1. **Understand the topic.** What happened / what to cover. Ask only if genuinely unclear — do not invent facts the user didn't give.

2. **Pick the category** (frontmatter `category`):
   - `engineering` — company-experience tech writing (retrospective, architecture, troubleshooting). **Must anonymize — step 3.**
   - `build-log` — side-project progress. Also set `project:` to `saju-app` | `recall-extension` | `indie-game`.
   - `notes` — short thoughts, career/market observation, domain knowledge.

3. **Anonymize from the start** (critical for `engineering`; apply to any company reference). Follow `SPEC.md` section 8:
   - Replace: company/client names → "이전 회사" / "해외 B2B 고객사"; internal system names → generic feature names; people/titles → role only ("팀 리드", "매니저"); business numbers → relative ("N배 절감"); exact infra scale → vague ("수 TB급", "수억 건").
   - NEVER include: burnout, leave-of-absence, "왜 떠났는가" personal narrative — drop it even if the user's notes contain it.
   - Keep: open-source/library names, architecture patterns & trade-off reasoning, troubleshooting steps, generalized methodology.
   Write the draft already-safe. Do NOT write raw names and rely on the publish scan to catch them.

4. **Frontmatter:**
   ```yaml
   title: <Korean title>
   description: <one line, <=160 chars>
   date: <today, YYYY-MM-DD>
   category: engineering | build-log | notes
   project: recall-extension        # build-log only
   tags: [..]
   draft: true
   ```

5. **Filename + slug.** Save to `src/content/posts/YYYY-MM-DD-slug.draft.md`:
   - `YYYY-MM-DD` = today.
   - `slug` = short lowercase latin kebab-case handle — this becomes the public URL (date stripped by `toUrlSlug`). Make it meaningful and final; a published slug must never change.

6. **Write the body** in Markdown (Korean), following the anonymization rules. MDX only if interactive elements are needed.

7. **Hand off.** Tell the user: preview locally with `npm run dev` (the `.draft.md` renders), then say "발행해줘" to run blog-publish.

## Do NOT

- Save as `content/posts/<slug>.md` (no `.draft`) — always `.draft.md` so it stays local and uncommitted.
- Set `draft: false` — blog-publish flips that at publish time.
- Include real company/client/person names, business numbers, or any burnout/leave narrative.
