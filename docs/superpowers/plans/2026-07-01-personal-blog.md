# 개인 블로그 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Astro + Tailwind 정적 블로그를 만든다 — 발행은 `git push` 한 번, 초안은 로컬에만, 회사 정보 유출은 훅으로 방어, 분석은 PostHog로 CTA 전환 측정.

**Architecture:** 살짝-헥사고날. 순수 로직/타입은 `src/core/`(외부 라이브러리 미의존, `astro:content` 타입만), 갈아끼울 외부 서비스(Giscus·PostHog·OG)는 `src/integrations/` 얇은 래퍼. 모든 페이지·RSS·사이트맵은 `core`의 쿼리 함수만 거쳐 draft를 한 곳에서 제외. 초안은 `content/posts/*.draft.md`로 두고 gitignore 패턴으로 커밋 차단(단 dev 미리보기는 됨).

**Tech Stack:** Astro, TypeScript, Tailwind, MDX, Vitest(순수 로직·훅 테스트), astro-expressive-code, astro-og-canvas, @astrojs/rss, @astrojs/sitemap, Giscus, posthog-js, Vercel, GitHub(public).

**참고 문서:** `SPEC.md`(v0.4), `CONTEXT.md`(용어), `docs/adr/0001~0004`.

---

## File Structure (locked-in decomposition)

```
src/
  core/
    posts.ts          # 순수 함수 + Post/Project 타입. astro:content는 type-only import(테스트 안전)
    posts.test.ts     # posts.ts 유닛 테스트 (Vitest)
    queries.ts        # getCollection 호출 래퍼(getPublishedPosts/getAllPosts/getProjects). 페이지가 씀
  integrations/
    Analytics.astro   # PostHog (is:inline, persistence:'memory')
    Comments.astro    # Giscus
    ogImage.ts        # astro-og-canvas 설정 (영어: 사이트명 + 카테고리)
  components/
    PostCard.astro  ProjectCard.astro  TagList.astro  CtaButton.astro  Header.astro  Footer.astro
  layouts/
    BaseLayout.astro  PostLayout.astro  ProjectLayout.astro
  pages/
    index.astro
    blog/index.astro  blog/[...slug].astro
    projects/index.astro  projects/[slug].astro
    tags/[tag].astro
    about.astro
    rss.xml.ts
    og/[...slug].png.ts   # OG 이미지 엔드포인트
  content/
    config.ts
    posts/            # *.md 발행본(커밋) + *.draft.md 초안(gitignore)
    projects/         # saju-app.md recall-extension.md indie-game.md
scripts/
  redact-check.sh       # 순수 검사 로직(테스트 대상)
  test-redact-check.sh  # redact-check.sh 테스트
  pre-push.sh           # git 글루: 대상 파일 모아 redact-check.sh 호출
astro.config.mjs
vitest.config.ts
tailwind.config.mjs
.gitignore
```

---

## Phase 0 — 프로젝트 뼈대

### Task 1: Astro 프로젝트 생성 + 통합 설치 + Vitest

**Files:**
- Create: 프로젝트 전체 스캐폴드, `vitest.config.ts`

- [ ] **Step 1: Astro minimal 템플릿 생성**

현재 `/Users/minhyeokkim/blog`는 비어 있음. 그 자리에 생성:

Run: `cd /Users/minhyeokkim/blog && npm create astro@latest -- --template minimal --no-install --no-git --typescript strict .`
Expected: `src/pages/index.astro` 등 최소 파일 생성.

- [ ] **Step 2: 통합/라이브러리 설치**

Run:
```bash
cd /Users/minhyeokkim/blog
npx astro add tailwind mdx sitemap --yes
npm i astro-expressive-code astro-og-canvas @astrojs/rss posthog-js
npm i -D vitest
```
Expected: `astro.config.mjs`에 tailwind/mdx/sitemap 등록, 패키지 설치 성공.

- [ ] **Step 3: Vitest 설정 작성**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
```

Add to `package.json` scripts:
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run"
}
```

- [ ] **Step 4: dev 서버·테스트 러너 동작 확인**

Run: `npm run test`
Expected: "No test files found" (아직 테스트 없음 — 정상). 러너 자체는 뜸.

Run: `npm run build`
Expected: 빌드 성공(빈 사이트).

- [ ] **Step 5: Commit**

```bash
cd /Users/minhyeokkim/blog && git init && git add -A
git commit -m "chore: scaffold Astro blog with tailwind, mdx, vitest"
```

---

## Phase 1 — 스키마 + core 순수 로직 (TDD)

### Task 2: Content Collection 스키마

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: 스키마 작성**

Create `src/content/config.ts`:
```ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.date(),
    updated: z.date().optional(),
    category: z.enum(['engineering', 'build-log', 'notes']),
    project: z.enum(['saju-app', 'recall-extension', 'indie-game']).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
    ogImage: z.string().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    status: z.enum(['idea', 'building', 'launched', 'paused']),
    startDate: z.date(),
    stack: z.array(z.string()).default([]),
    links: z.object({
      demo: z.string().optional(),
      repo: z.string().optional(),
      store: z.string().optional(),
      waitlist: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { posts, projects };
```

- [ ] **Step 2: 스키마 인식 확인**

Run: `npx astro sync`
Expected: `.astro/types.d.ts` 생성, 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts && git commit -m "feat: add posts and projects content schema"
```

### Task 3: core/posts.ts 순수 함수 (TDD)

**Files:**
- Create: `src/core/posts.ts`
- Test: `src/core/posts.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/core/posts.test.ts`:
```ts
// ASCII only. Pure-function tests for core/posts.ts.
// NOTE: Astro 7 uses the glob-loader Content Layer API. Entries expose `.id` (NOT `.slug`).
import { describe, it, expect } from 'vitest';
import {
  filterPublished, sortByDateDesc, byTag, byCategory, byProject, toUrlSlug,
  type Post,
} from './posts';

function post(over: Partial<Post['data']> & { id?: string }): Post {
  const { id = 'x', ...data } = over;
  return {
    id, collection: 'posts',
    data: {
      title: 't', description: 'd', date: new Date('2026-01-01'),
      category: 'notes', tags: [], draft: false, ...data,
    },
  } as unknown as Post;
}

describe('filterPublished', () => {
  it('removes draft:true posts', () => {
    const out = filterPublished([post({ id: 'a' }), post({ id: 'b', draft: true })]);
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('sortByDateDesc', () => {
  it('newest first', () => {
    const out = sortByDateDesc([
      post({ id: 'old', date: new Date('2026-01-01') }),
      post({ id: 'new', date: new Date('2026-06-01') }),
    ]);
    expect(out.map(p => p.id)).toEqual(['new', 'old']);
  });
});

describe('byTag', () => {
  it('keeps posts containing the tag', () => {
    const out = byTag([post({ id: 'a', tags: ['astro'] }), post({ id: 'b', tags: ['saju'] })], 'astro');
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('byCategory', () => {
  it('filters by category', () => {
    const out = byCategory([post({ id: 'a', category: 'engineering' }), post({ id: 'b', category: 'notes' })], 'engineering');
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('byProject', () => {
  it('filters by project', () => {
    const out = byProject([post({ id: 'a', project: 'saju-app' }), post({ id: 'b' })], 'saju-app');
    expect(out.map(p => p.id)).toEqual(['a']);
  });
});

describe('toUrlSlug', () => {
  it('strips date prefix', () => {
    expect(toUrlSlug('2026-07-01-recall-prd-writing')).toBe('recall-prd-writing');
  });
  it('strips .draft suffix', () => {
    expect(toUrlSlug('2026-07-01-recall-prd-writing.draft')).toBe('recall-prd-writing');
  });
  it('leaves a plain slug unchanged', () => {
    expect(toUrlSlug('market-notes')).toBe('market-notes');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test`
Expected: FAIL — `./posts` 없음 / export 없음.

- [ ] **Step 3: 최소 구현**

Create `src/core/posts.ts`:
```ts
import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;
export type Category = Post['data']['category'];
export type ProjectKey = NonNullable<Post['data']['project']>;

export function filterPublished(posts: Post[]): Post[] {
  return posts.filter((p) => p.data.draft === false);
}

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function byTag(posts: Post[], tag: string): Post[] {
  return posts.filter((p) => p.data.tags.includes(tag));
}

export function byCategory(posts: Post[], category: Category): Post[] {
  return posts.filter((p) => p.data.category === category);
}

export function byProject(posts: Post[], project: ProjectKey): Post[] {
  return posts.filter((p) => p.data.project === project);
}

export function toUrlSlug(slug: string): string {
  return slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.draft$/, '');
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test`
Expected: PASS (모든 describe 통과).

- [ ] **Step 5: Commit**

```bash
git add src/core/posts.ts src/core/posts.test.ts
git commit -m "feat: add core post filtering, sorting, slug logic with tests"
```

### Task 4: core/queries.ts (Astro 호출 래퍼)

**Files:**
- Create: `src/core/queries.ts`

이 파일은 `getCollection`을 호출하는 얇은 글루라 유닛테스트 안 함(빌드/dev로 검증). draft 제외는 여기 `getPublishedPosts` 한 곳에서.

- [ ] **Step 1: 구현**

Create `src/core/queries.ts`:
```ts
import { getCollection } from 'astro:content';
import { filterPublished, sortByDateDesc, type Post, type Project } from './posts';

// 사이트 노출용: draft 제외 + 최신순. 모든 페이지/RSS/사이트맵이 이걸 쓴다.
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  return sortByDateDesc(filterPublished(all));
}

// dev 미리보기용: draft 포함(초안 확인). 절대 사이트 페이지 생성에 쓰지 말 것.
export async function getAllPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  return sortByDateDesc(all);
}

export async function getProjects(): Promise<Project[]> {
  return getCollection('projects');
}
```

- [ ] **Step 2: 타입 확인**

Run: `npx astro check`
Expected: 0 errors (콘텐츠가 없어도 타입은 통과).

- [ ] **Step 3: Commit**

```bash
git add src/core/queries.ts && git commit -m "feat: add draft-aware collection query wrappers"
```

---

## Phase 2 — 안전망 (gitignore + pre-push 훅, TDD)

### Task 5: 초안 gitignore 패턴

**Files:**
- Create/Modify: `.gitignore`

- [ ] **Step 1: 패턴 추가**

Append to `.gitignore`:
```
# 초안: content/posts/ 안에 있어 dev 미리보기는 되지만 절대 커밋 안 함
src/content/posts/*.draft.md
src/content/posts/*.draft.mdx
```

- [ ] **Step 2: 무시되는지 확인**

Run:
```bash
mkdir -p src/content/posts
printf -- '---\ntitle: tmp\ndescription: d\ndate: 2026-07-01\ncategory: notes\n---\nbody\n' > src/content/posts/2026-07-01-tmp.draft.md
git status --porcelain src/content/posts/
```
Expected: 출력 없음(= git이 `.draft.md`를 무시). 확인 후 `rm src/content/posts/2026-07-01-tmp.draft.md`.

- [ ] **Step 3: Commit**

```bash
git add .gitignore && git commit -m "chore: gitignore draft posts by filename pattern"
```

### Task 6: redact-check.sh (TDD) + pre-push 훅 설치

**Files:**
- Create: `scripts/redact-check.sh`, `scripts/test-redact-check.sh`, `scripts/pre-push.sh`

- [ ] **Step 1: 실패하는 bash 테스트 작성**

Create `scripts/test-redact-check.sh`:
```bash
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

# clean content, valid terms -> 0
printf 'AcmeCorp\nJohnDoe\n' > "$TMP/terms.txt"
printf 'hello world\n' > "$TMP/clean.md"
bash "$CHECK" "$TMP/terms.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "clean passes" 0 $?

# content contains a term -> 1
printf 'we shipped at AcmeCorp last year\n' > "$TMP/leak.md"
bash "$CHECK" "$TMP/terms.txt" "$TMP/leak.md" >/dev/null 2>&1; assert_code "leak blocked" 1 $?

# terms file missing -> 2 (fail-closed)
bash "$CHECK" "$TMP/nope.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "missing terms blocks" 2 $?

# terms file empty -> 2 (fail-closed)
printf '' > "$TMP/empty.txt"
bash "$CHECK" "$TMP/empty.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "empty terms blocks" 2 $?

# terms file only comments/blank -> 2 (fail-closed)
printf '# just a comment\n\n' > "$TMP/comment.txt"
bash "$CHECK" "$TMP/comment.txt" "$TMP/clean.md" >/dev/null 2>&1; assert_code "comment-only terms blocks" 2 $?

echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bash scripts/test-redact-check.sh`
Expected: FAIL (redact-check.sh 없음 → 모든 케이스 어긋남, 종료코드 비0).

- [ ] **Step 3: redact-check.sh 구현**

Create `scripts/redact-check.sh`:
```bash
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

# non-empty, non-comment lines only
mapfile -t words < <(grep -v -E '^[[:space:]]*($|#)' "$terms" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' | grep -v '^$')
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
```

Run: `chmod +x scripts/redact-check.sh`

- [ ] **Step 4: 테스트 통과 확인**

Run: `bash scripts/test-redact-check.sh`
Expected: `pass=5 fail=0`, 종료코드 0.

- [ ] **Step 5: pre-push 글루 + 훅 설치**

Create `scripts/pre-push.sh`:
```bash
#!/usr/bin/env bash
# ASCII only. Git pre-push hook glue.
# Scans committed content files against ~/.blog-redact-terms.txt before allowing push.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
TERMS="$HOME/.blog-redact-terms.txt"

# tracked content files that will go public
mapfile -t files < <(git ls-files 'src/content/posts/*.md' 'src/content/posts/*.mdx' 'src/content/projects/*.md' 'src/content/projects/*.mdx')
if [ "${#files[@]}" -eq 0 ]; then exit 0; fi

if ! bash "$HERE/redact-check.sh" "$TERMS" "${files[@]}"; then
  echo "" >&2
  echo "push blocked by redact-check. Fix the lines above or update $TERMS." >&2
  echo "(To bypass in an emergency you would use --no-verify, but do NOT for content.)" >&2
  exit 1
fi
exit 0
```

Run:
```bash
chmod +x scripts/pre-push.sh
git config core.hooksPath scripts
```
Note: `core.hooksPath=scripts`면 git은 `scripts/pre-push`(확장자 없음)를 찾는다. 심링크로 연결:
```bash
ln -sf pre-push.sh scripts/pre-push
```
Expected: `scripts/pre-push` 심링크 생성.

- [ ] **Step 6: 훅 실제 차단 확인 (수동)**

Run:
```bash
printf 'AcmeCorp\n' > "$HOME/.blog-redact-terms.txt"
printf -- '---\ntitle: leaky\ndescription: d\ndate: 2026-07-01\ncategory: engineering\ndraft: false\n---\nWorked at AcmeCorp.\n' > src/content/posts/2026-07-01-leaky.md
git add src/content/posts/2026-07-01-leaky.md && git commit -m "test: leaky post" -q
git push --dry-run 2>&1 | head -5 || true
bash scripts/pre-push.sh; echo "hook exit: $?"
```
Expected: `hook exit: 1` + "BLOCKED term 'AcmeCorp'". 확인 후 되돌리기:
```bash
git reset --hard HEAD~1
rm -f src/content/posts/2026-07-01-leaky.md
```

- [ ] **Step 7: Commit**

```bash
git add scripts/redact-check.sh scripts/test-redact-check.sh scripts/pre-push.sh scripts/pre-push
git commit -m "feat: add fail-closed pre-push redaction hook with tests"
```

---

## Phase 3 — 레이아웃 + 통합 래퍼

### Task 7: BaseLayout + Header + Footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Header/Footer**

Create `src/components/Header.astro`:
```astro
---
---
<header class="border-b">
  <nav class="mx-auto max-w-3xl flex gap-4 p-4 text-sm">
    <a href="/" class="font-bold">mark</a>
    <a href="/blog">Blog</a>
    <a href="/projects">Projects</a>
    <a href="/about">About</a>
    <a href="/rss.xml" class="ml-auto">RSS</a>
  </nav>
</header>
```

Create `src/components/Footer.astro`:
```astro
---
const year = new Date().getFullYear();
---
<footer class="border-t mt-16">
  <div class="mx-auto max-w-3xl p-4 text-xs text-gray-500">(c) {year} mark - building in public</div>
</footer>
```

- [ ] **Step 2: BaseLayout (Analytics는 Task 8에서 head에 추가)**

Create `src/layouts/BaseLayout.astro`:
```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
export interface Props { title: string; description?: string; ogImage?: string; }
const { title, description = '', ogImage } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {ogImage && <meta property="og:image" content={ogImage} />}
    <!-- ANALYTICS_SLOT (Task 8) -->
  </head>
  <body class="min-h-screen flex flex-col">
    <Header />
    <main class="mx-auto max-w-3xl w-full flex-1 p-4"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Header.astro src/components/Footer.astro
git commit -m "feat: add base layout, header, footer"
```

### Task 8: integrations/Analytics.astro (PostHog, 쿠키리스)

**Files:**
- Create: `src/integrations/Analytics.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `.env` (git 미포함), `.env.example`

- [ ] **Step 1: 토큰 준비**

`npx @posthog/wizard@latest`를 실행하면 PostHog 프로젝트 토큰을 발급/확인해준다. 토큰만 받고 마법사가 만든 파일(`src/components/posthog.astro`, `PostHogLayout.astro`)은 다음 스텝에서 우리 래퍼로 대체하므로 삭제한다. (마법사를 안 쓰면 PostHog 대시보드 > Project Settings에서 Project API Key 복사.)

Create `.env` (gitignore됨 — 이미 Astro가 `.env`를 무시):
```
PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Create `.env.example`:
```
PUBLIC_POSTHOG_KEY=
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 2: Analytics 래퍼 작성 (쿠키리스, View Transitions 미사용이라 가드 불필요)**

Create `src/integrations/Analytics.astro`:
```astro
---
const key = import.meta.env.PUBLIC_POSTHOG_KEY;
const host = import.meta.env.PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
---
{key && (
  <script is:inline define:vars={{ key, host }}>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init(key, { api_host: host, persistence: 'memory', capture_pageview: true });
  </script>
)}
```
Note: `persistence: 'memory'` = 쿠키/localStorage 미사용(동의 배너 부담 완화). 키가 없으면(로컬 dev) 아무것도 렌더 안 함.

- [ ] **Step 3: BaseLayout head에 삽입**

Modify `src/layouts/BaseLayout.astro` — `<!-- ANALYTICS_SLOT (Task 8) -->`를 다음으로 교체:
```astro
    <Analytics />
```
그리고 frontmatter의 import에 추가:
```astro
import Analytics from '../integrations/Analytics.astro';
```

- [ ] **Step 4: 확인**

Run: `npm run build && npm run preview`
Expected: 빌드 성공. (키가 dev에 없으면 스크립트 미출력 — 정상. 배포 후 실제 수집 확인은 Task 22.)

- [ ] **Step 5: Commit**

```bash
git add src/integrations/Analytics.astro src/layouts/BaseLayout.astro .env.example
git commit -m "feat: add PostHog analytics wrapper (cookieless) in base layout"
```

### Task 9: integrations/Comments.astro (Giscus) + PostLayout

**Files:**
- Create: `src/integrations/Comments.astro`, `src/layouts/PostLayout.astro`
- Modify: `.env.example`

- [ ] **Step 1: Giscus 설정값 env 추가**

Append to `.env.example` (실제 값은 Task 23에서 giscus.app로 발급):
```
PUBLIC_GISCUS_REPO=mark/blog
PUBLIC_GISCUS_REPO_ID=
PUBLIC_GISCUS_CATEGORY=General
PUBLIC_GISCUS_CATEGORY_ID=
```

- [ ] **Step 2: Comments 래퍼**

Create `src/integrations/Comments.astro`:
```astro
---
const repo = import.meta.env.PUBLIC_GISCUS_REPO;
const repoId = import.meta.env.PUBLIC_GISCUS_REPO_ID;
const category = import.meta.env.PUBLIC_GISCUS_CATEGORY ?? 'General';
const categoryId = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID;
---
{repoId && categoryId && (
  <script is:inline src="https://giscus.app/client.js"
    data-repo={repo}
    data-repo-id={repoId}
    data-category={category}
    data-category-id={categoryId}
    data-mapping="pathname"
    data-strict="1"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="bottom"
    data-theme="light"
    data-lang="ko"
    crossorigin="anonymous"
    async>
  </script>
)}
```
Note: `data-mapping="pathname"` — SPEC 3.1 slug 불변 규칙이 이걸 지탱.

- [ ] **Step 3: PostLayout**

Create `src/layouts/PostLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
import Comments from '../integrations/Comments.astro';
import TagList from '../components/TagList.astro';
import type { Post } from '../core/posts';
export interface Props { post: Post; }
const { post } = Astro.props;
const { title, description, date, updated, tags, ogImage } = post.data;
---
<BaseLayout title={title} description={description} ogImage={ogImage}>
  <article class="prose max-w-none">
    <h1>{title}</h1>
    <p class="text-sm text-gray-500">
      {date.toISOString().slice(0, 10)}
      {updated && ` (updated ${updated.toISOString().slice(0, 10)})`}
    </p>
    <TagList tags={tags} />
    <slot />
  </article>
  <hr class="my-8" />
  <Comments />
</BaseLayout>
```
Note: `TagList`는 Task 12에서 생성. 이 Task는 그 전에 빌드하면 실패하므로 Task 12 이후 빌드 확인.

- [ ] **Step 4: Commit**

```bash
git add src/integrations/Comments.astro src/layouts/PostLayout.astro .env.example
git commit -m "feat: add Giscus comments wrapper and post layout"
```

### Task 10: ProjectLayout

**Files:**
- Create: `src/layouts/ProjectLayout.astro`

- [ ] **Step 1: 구현**

Create `src/layouts/ProjectLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
import PostCard from '../components/PostCard.astro';
import CtaButton from '../components/CtaButton.astro';
import type { Project, Post } from '../core/posts';
export interface Props { project: Project; buildLogs: Post[]; }
const { project, buildLogs } = Astro.props;
const { title, tagline, status, stack, links } = project.data;
---
<BaseLayout title={title} description={tagline}>
  <h1 class="text-2xl font-bold">{title}</h1>
  <p class="text-gray-600">{tagline}</p>
  <p class="text-xs mt-1">status: {status} - stack: {stack.join(', ')}</p>
  {links?.waitlist && <CtaButton href={links.waitlist} project={project.id} label="Join waitlist" />}
  {links?.store && <CtaButton href={links.store} project={project.id} label="Install" />}
  <div class="prose max-w-none mt-6"><slot /></div>
  <h2 class="text-xl font-bold mt-10">Build log</h2>
  <ul class="mt-4 space-y-4">
    {buildLogs.map((p) => <li><PostCard post={p} /></li>)}
  </ul>
</BaseLayout>
```
Note: `PostCard`, `CtaButton`는 Task 12에서 생성.

- [ ] **Step 2: Commit**

```bash
git add src/layouts/ProjectLayout.astro
git commit -m "feat: add project layout with build-log timeline"
```

### Task 11: integrations/ogImage.ts + OG 엔드포인트 (영어: 사이트명 + 카테고리)

**Files:**
- Create: `src/integrations/ogImage.ts`, `src/pages/og/[...slug].png.ts`

SPEC 12번 결정(런치 기본): OG 이미지엔 한국어 제목 대신 **영어 사이트명 + 카테고리**만. 한글 폰트 회피.

- [ ] **Step 1: OG 설정**

Create `src/integrations/ogImage.ts`:
```ts
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { toUrlSlug } from './posts';

const posts = await getCollection('posts');

// key = URL slug (from entry.id, Astro 7 glob loader), value = 카테고리(영어 텍스트만)
const pages = Object.fromEntries(
  posts.map((p) => [toUrlSlug(p.id), { category: p.data.category }]),
);

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'slug',
  pages,
  getImageOptions: (_path, page: { category: string }) => ({
    title: 'mark - building in public',
    description: page.category,
    bgGradient: [[24, 24, 27]],
    font: { title: { color: [255, 255, 255] }, description: { color: [161, 161, 170] } },
  }),
});
```
Note: 제목/설명 모두 ASCII 영어라 별도 한글 폰트 불필요.

- [ ] **Step 2: 엔드포인트 연결**

Create `src/pages/og/[...slug].png.ts`:
```ts
export { getStaticPaths, GET } from '../../integrations/ogImage';
```

- [ ] **Step 3: Commit**

```bash
git add src/integrations/ogImage.ts src/pages/og/
git commit -m "feat: add auto OG image generation (english site name + category)"
```

---

## Phase 4 — 컴포넌트 + 페이지

### Task 12: 공용 컴포넌트 (PostCard, ProjectCard, TagList, CtaButton)

**Files:**
- Create: `src/components/PostCard.astro`, `ProjectCard.astro`, `TagList.astro`, `CtaButton.astro`

- [ ] **Step 1: TagList**

Create `src/components/TagList.astro`:
```astro
---
export interface Props { tags: string[]; }
const { tags } = Astro.props;
---
{tags.length > 0 && (
  <ul class="flex gap-2 flex-wrap text-xs my-2">
    {tags.map((t) => <li><a class="underline" href={`/tags/${t}`}>#{t}</a></li>)}
  </ul>
)}
```

- [ ] **Step 2: PostCard**

Create `src/components/PostCard.astro`:
```astro
---
import { toUrlSlug } from '../core/posts';
import type { Post } from '../core/posts';
export interface Props { post: Post; }
const { post } = Astro.props;
const href = `/blog/${toUrlSlug(post.id)}`;
---
<a href={href} class="block">
  <p class="text-xs text-gray-500">{post.data.date.toISOString().slice(0, 10)} - {post.data.category}</p>
  <p class="font-semibold">{post.data.title}</p>
  <p class="text-sm text-gray-600">{post.data.description}</p>
</a>
```

- [ ] **Step 3: ProjectCard**

Create `src/components/ProjectCard.astro`:
```astro
---
import type { Project } from '../core/posts';
export interface Props { project: Project; }
const { project } = Astro.props;
---
<a href={`/projects/${project.id}`} class="block border rounded p-4">
  <p class="font-semibold">{project.data.title}</p>
  <p class="text-sm text-gray-600">{project.data.tagline}</p>
  <p class="text-xs mt-1">status: {project.data.status}</p>
</a>
```

- [ ] **Step 4: CtaButton (PostHog 전환 이벤트)**

Create `src/components/CtaButton.astro`:
```astro
---
export interface Props { href: string; label: string; project: string; }
const { href, label, project } = Astro.props;
---
<a href={href} target="_blank" rel="noopener" data-cta={project}
   class="inline-block bg-black text-white rounded px-4 py-2 my-2 text-sm">{label}</a>
<script is:inline>
  document.querySelectorAll('a[data-cta]').forEach((el) => {
    el.addEventListener('click', () => {
      if (window.posthog) window.posthog.capture('cta_click', { project: el.getAttribute('data-cta') });
    });
  });
</script>
```
Note: 이게 사업 홍보 측정의 핵심 — CTA 클릭을 PostHog `cta_click` 이벤트로 보냄.

- [ ] **Step 5: Commit**

```bash
git add src/components/PostCard.astro src/components/ProjectCard.astro src/components/TagList.astro src/components/CtaButton.astro
git commit -m "feat: add PostCard, ProjectCard, TagList, CtaButton components"
```

### Task 13: 홈 (index.astro)

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: 구현**

Replace `src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PostCard from '../components/PostCard.astro';
import ProjectCard from '../components/ProjectCard.astro';
import { getPublishedPosts, getProjects } from '../core/queries';
const posts = (await getPublishedPosts()).slice(0, 5);
const projects = await getProjects();
---
<BaseLayout title="mark - building in public" description="엔지니어가 사이드 프로젝트를 출시까지 끌고 가는 기록">
  <section>
    <h2 class="text-xl font-bold">최근 글</h2>
    <ul class="mt-4 space-y-4">{posts.map((p) => <li><PostCard post={p} /></li>)}</ul>
  </section>
  <section class="mt-10">
    <h2 class="text-xl font-bold">프로젝트</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">{projects.map((p) => <ProjectCard project={p} />)}</div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro && git commit -m "feat: add home page with recent posts and projects"
```

### Task 14: 블로그 목록 + 개별 글

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`

- [ ] **Step 1: 목록**

Create `src/pages/blog/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import { getPublishedPosts } from '../../core/queries';
const posts = await getPublishedPosts();
---
<BaseLayout title="Blog - mark" description="engineering, build-log, notes">
  <h1 class="text-2xl font-bold">Blog</h1>
  <ul class="mt-6 space-y-4">{posts.map((p) => <li><PostCard post={p} /></li>)}</ul>
</BaseLayout>
```

- [ ] **Step 2: 개별 글 (slug = toUrlSlug, draft 제외)**

Create `src/pages/blog/[...slug].astro`:
```astro
---
import PostLayout from '../../layouts/PostLayout.astro';
import { render } from 'astro:content';
import { getPublishedPosts } from '../../core/queries';
import { toUrlSlug } from '../../core/posts';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({
    params: { slug: toUrlSlug(post.id) },
    props: { post },
  }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<PostLayout post={post}>
  <Content />
</PostLayout>
```
Note: Astro 7 glob loader — `post.id`(슬러그 원본) + `render(post)`(엔트리 메서드 아님). `getPublishedPosts()`만 쓰므로 draft(`.draft.md` 또는 `draft:true`)는 페이지가 안 생김. 초안 미리보기는 dev에서 URL 직접 접근이 아니라 별도 확인(아래 Step 3).

- [ ] **Step 3: 확인 (초안 미리보기 포함)**

Run: `npm run dev`
발행 글은 `/blog/<slug>` 접근됨. 초안 확인용으로는 임시로 `[...slug].astro`의 `getPublishedPosts`를 `getAllPosts`로 바꿔 dev에서만 보고 되돌리거나, 발행 전 `.draft.md`를 `.md`로 잠깐 rename해 확인. (기본은 발행 글만 라우팅.)
Expected: 발행 글 페이지 렌더 + 하단 댓글 슬롯(설정 전엔 빈 상태).

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/
git commit -m "feat: add blog index and post pages with clean immutable slugs"
```

### Task 15: 프로젝트 허브 + 상세

**Files:**
- Create: `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`

- [ ] **Step 1: 허브**

Create `src/pages/projects/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import { getProjects } from '../../core/queries';
const projects = await getProjects();
---
<BaseLayout title="Projects - mark" description="사주앱, recall, 인디게임">
  <h1 class="text-2xl font-bold">Projects</h1>
  <div class="mt-6 grid gap-4 sm:grid-cols-2">{projects.map((p) => <ProjectCard project={p} />)}</div>
</BaseLayout>
```

- [ ] **Step 2: 상세 + build-log 타임라인**

Create `src/pages/projects/[slug].astro`:
```astro
---
import ProjectLayout from '../../layouts/ProjectLayout.astro';
import { render } from 'astro:content';
import { getProjects, getPublishedPosts } from '../../core/queries';
import { byProject, type ProjectKey } from '../../core/posts';

export async function getStaticPaths() {
  const projects = await getProjects();
  const posts = await getPublishedPosts();
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project, buildLogs: byProject(posts, project.id as ProjectKey) },
  }));
}
const { project, buildLogs } = Astro.props;
const { Content } = await render(project);
---
<ProjectLayout project={project} buildLogs={buildLogs}>
  <Content />
</ProjectLayout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/projects/
git commit -m "feat: add project hub and detail pages with build-log timeline"
```

### Task 16: about.astro

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: 구현 (담백한 경력 요약, 번아웃/휴직 서사 없음)**

Create `src/pages/about.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About - mark" description="엔지니어. 사이드 프로젝트를 출시까지 끌고 갑니다.">
  <h1 class="text-2xl font-bold">About</h1>
  <div class="prose max-w-none mt-4">
    <p>엔지니어입니다. 데이터/백엔드 중심으로 일해 왔고, 지금은 사주 앱, recall 익스텐션, 인디게임을 만들고 있습니다.</p>
    <p>이 블로그는 그 과정을 공개하는 곳입니다.</p>
    <ul>
      <li><a href="/projects/saju-app">사주 앱</a></li>
      <li><a href="/projects/recall-extension">recall 익스텐션</a></li>
      <li><a href="/projects/indie-game">인디게임</a></li>
    </ul>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro && git commit -m "feat: add about page"
```

### Task 17: 태그 아카이브

**Files:**
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: 구현**

Create `src/pages/tags/[tag].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import { getPublishedPosts } from '../../core/queries';
import { byTag } from '../../core/posts';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({ params: { tag }, props: { posts: byTag(posts, tag), tag } }));
}
const { posts, tag } = Astro.props;
---
<BaseLayout title={`#${tag} - mark`} description={`태그 ${tag} 글 모음`}>
  <h1 class="text-2xl font-bold">#{tag}</h1>
  <ul class="mt-6 space-y-4">{posts.map((p) => <li><PostCard post={p} /></li>)}</ul>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tags/ && git commit -m "feat: add tag archive pages"
```

### Task 18: RSS

**Files:**
- Create: `src/pages/rss.xml.ts`

- [ ] **Step 1: 구현 (getPublishedPosts → draft 자동 제외)**

Create `src/pages/rss.xml.ts`:
```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../core/queries';
import { toUrlSlug } from '../core/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'mark - building in public',
    description: '엔지니어의 사이드 프로젝트 기록',
    site: context.site ?? 'https://example.vercel.app',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/blog/${toUrlSlug(p.id)}`,
    })),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rss.xml.ts && git commit -m "feat: add RSS feed (drafts excluded)"
```

### Task 19: astro.config 사이트 URL + 사이트맵 확인

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: site 설정**

Modify `astro.config.mjs` — `defineConfig({ ... })`에 `site` 추가(사이트맵/RSS/canonical/OG에 필요). 배포 URL은 Task 22에서 확정, 우선 플레이스홀더:
```js
site: 'https://mark-blog.vercel.app',
```
그리고 expressive-code 통합이 등록됐는지 확인(없으면 `import expressiveCode from 'astro-expressive-code'` 후 `integrations` 배열에 `expressiveCode()`를 mdx보다 앞에 추가).

- [ ] **Step 2: 빌드 + 사이트맵/RSS draft 제외 확인**

Run: `npm run build`
Expected: `dist/sitemap-index.xml`, `dist/rss.xml` 생성. 초안(`.draft.md`/`draft:true`) 항목이 **없는지** grep으로 확인:
```bash
grep -c 'draft' dist/rss.xml || echo "no draft in rss (ok)"
```

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs && git commit -m "chore: set site url; confirm sitemap and rss exclude drafts"
```

---

## Phase 5 — 시드 콘텐츠

### Task 20: 예시 발행 글 1개 + 프로젝트 3개

**Files:**
- Create: `src/content/posts/2026-07-01-recall-prd-writing.md`, `src/content/projects/{saju-app,recall-extension,indie-game}.md`

- [ ] **Step 1: 예시 글 (draft:false — 발행본)**

Create `src/content/posts/2026-07-01-recall-prd-writing.md`:
```md
---
title: recall 익스텐션 PRD를 쓰며
description: 사이드 프로젝트의 첫 PRD를 어떻게 좁혔는지 기록.
date: 2026-07-01
category: build-log
project: recall-extension
tags: [recall, product]
draft: false
---

첫 글. build-log의 시작입니다.
```

- [ ] **Step 2: 프로젝트 3개**

Create `src/content/projects/saju-app.md`:
```md
---
title: 사주 앱
tagline: 만세력 엔진 기반 사주 해석 앱
status: building
startDate: 2026-05-01
stack: [Astro, TypeScript]
links:
  waitlist: https://example.com/saju-waitlist
---

사주 앱을 만드는 기록.
```

Create `src/content/projects/recall-extension.md`:
```md
---
title: recall 익스텐션
tagline: 브라우저에서 본 것을 다시 떠올려주는 확장
status: building
startDate: 2026-04-01
stack: [TypeScript]
links:
  store: https://example.com/recall-store
---

recall 익스텐션 기록.
```

Create `src/content/projects/indie-game.md`:
```md
---
title: 인디게임
tagline: 혼자 만드는 작은 게임
status: idea
startDate: 2026-06-01
stack: [Godot]
links:
  waitlist: https://example.com/game-waitlist
---

인디게임 기록.
```

- [ ] **Step 3: 전체 빌드 확인**

Run: `npm run build`
Expected: 성공. `/blog/recall-prd-writing`, `/projects/saju-app` 등 페이지 생성. build-log 타임라인에 예시 글이 saju가 아닌 recall 상세에 뜸.

- [ ] **Step 4: Commit**

```bash
git add src/content/posts/ src/content/projects/
git commit -m "content: add example post and three project pages"
```

---

## Phase 6 — 배포

### Task 21: GitHub public repo + Discussions + push

- [ ] **Step 1: redact-terms 준비 (fail-closed라 없으면 push 막힘)**

Run:
```bash
test -f "$HOME/.blog-redact-terms.txt" && echo exists || echo "MISSING - create it"
```
없으면 실제 회사명/고객사/전 동료 이름을 한 줄에 하나씩 채운다(이 파일은 어디에도 커밋 안 함). 최소 1개 이상 있어야 push 가능.

- [ ] **Step 2: public repo 생성 + Discussions 활성화**

Run:
```bash
gh repo create blog --public --source=. --remote=origin --push
gh api -X PATCH repos/{owner}/blog -f has_discussions=true
```
Expected: repo 생성, push 성공(pre-push 훅 통과), Discussions 켜짐. `{owner}`는 실제 계정으로.

- [ ] **Step 3: 확인**

Run: `gh repo view --web`
Expected: public repo에 코드 보임. `.draft.md` 초안은 **없음**(gitignore). Discussions 탭 존재.

### Task 22: Vercel 연결 + 환경변수 + 첫 배포

- [ ] **Step 1: Vercel 프로젝트 연결**

Vercel 대시보드에서 GitHub `blog` repo import (또는 `npx vercel link`). Framework: Astro 자동 감지.

- [ ] **Step 2: 환경변수 등록**

Vercel Project Settings > Environment Variables에 `.env.example`의 키들을 실제 값으로:
- `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST`
- Giscus 4종(Task 23 후 채워도 됨)

- [ ] **Step 3: 배포 URL 확정 → astro.config 반영**

배포되면 실제 URL(`https://<...>.vercel.app`) 확인. `astro.config.mjs`의 `site`를 그 값으로 수정 후:
```bash
git add astro.config.mjs && git commit -m "chore: set production site url" && git push
```
Expected: 재배포. canonical/OG/사이트맵/RSS가 올바른 도메인 사용.

- [ ] **Step 4: PostHog 수집 확인**

배포 사이트 방문 후 PostHog 대시보드 > Activity에서 pageview 이벤트가 들어오는지 확인.
Expected: pageview 이벤트 수신(쿠키리스 모드).

### Task 23: Giscus 설정 연결

- [ ] **Step 1: giscus.app에서 값 발급**

https://giscus.app 에서 repo `mark/blog`(실제) 선택, mapping=`pathname`, category=`General` 선택 → 발급된 `data-repo-id`, `data-category-id` 복사.

- [ ] **Step 2: Vercel env에 반영 + 재배포**

`PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY`, `PUBLIC_GISCUS_CATEGORY_ID`를 Vercel에 등록 후 재배포(빈 커밋 또는 재배포 버튼).

- [ ] **Step 3: 확인**

배포된 글 페이지 하단에서 Giscus 댓글창이 뜨는지, 댓글 작성 시 repo Discussions에 생기는지 확인.
Expected: 댓글창 렌더 + Discussions에 저장.

---

## 실행 후 남는 선택 (SPEC 11·12 참조)
- Pagefind 검색(글 30~50개 후), 커스텀 도메인, OG 이미지 옵션 (b)(한글 폰트 서브셋)로 업그레이드.
