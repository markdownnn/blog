# 개인 블로그 스펙 (v0.5)

> 현재 상태: **라이브** — https://blog.teamnyongs.com

## 0. 변경 이력

### v0.4 → v0.5 (실제 구축 반영)

- **호스팅 확정: Cloudflare Workers (Static Assets)** + 커스텀 도메인 `blog.teamnyongs.com`. Vercel에서 변경 ([ADR 0002](docs/adr/0002-vercel-hosting.md) 갱신). 정적 사이트라 어댑터 불필요.
- **자동배포: Cloudflare Workers Builds**. GitHub `main` push → 자동 빌드+배포. "push=배포 끝" 유지. PostHog `PUBLIC_*`는 Workers Builds의 **build variables**에 등록(런타임 변수 아님 — assets-only Worker엔 런타임 변수 불가).
- **댓글 연결 완료: Giscus**. 같은 repo `markdownnn/blog`의 Discussions(Announcements 카테고리, pathname 매핑). repo-id/category-id는 공개 값이라 `integrations/Comments.astro`에 인라인.
- **`blog-publish` 스킬 구축**: `.claude/skills/blog-publish/`. redact 스캔 → rename(`mv`, `git mv` 아님 — 초안이 gitignore) → build → commit → push. 배포는 Workers Builds가. end-to-end 검증 완료.
- **디자인 1차**: Pretendard 폰트 + `@tailwindcss/typography`(prose) + 절제된 레이아웃 + 인디고 액센트. (다크 모드는 아직 X)
- **커스텀 도메인 오픈퀘스천 종료**: `blog.teamnyongs.com`로 처음부터 시작(→ 나중 이사 시 링크·SEO 깨질 일 없음).
- **OG 오픈퀘스천 종료**: 옵션 (a) 채택 — 제목 없이 **영어 사이트명 + 카테고리**. 한글 폰트 회피, 구현됨.
- **금칙어 정리**: 부분문자열 오탐 나는 짧은 항목 제거(`Ben`→"benefit", `벤`→"이벤트" 등). 로컬 `~/.blog-redact-terms.txt`만 수정(repo 미반영, 설계상).

### v0.3 → v0.4 (적대적 리뷰 반영)

- **훅 문구 정직화**: pre-push 훅을 "최후 방어선/못 뚫음"으로 과장했던 걸 **"실수 방지 덫"**으로 낮춤. `git push --no-verify`, 외부 PR, GitHub 웹 편집으로 뚫린다는 한계 명시. 익명화의 진짜 방어는 여전히 "글 쓸 때 처음부터 안전하게"(blog-draft).
- **fail-closed 강화**: 금칙어 파일이 "없을 때"뿐 아니라 **"비었거나 너무 짧을 때"도 push 차단**. 빈 파일이 조용히 초록불 켜는 구멍 제거.
- **초안 미리보기 문제 해결**: 초안을 별도 gitignore 폴더에 두면 렌더링 미리보기가 안 됨. → 초안을 `content/posts/*.draft.md`로 두고 **파일명 패턴으로 gitignore**. 컬렉션 안에 있어 dev에서 미리보기 가능 + git엔 안 올라감.
- **OG 이미지 미해결로 표시**: "영어 고정"은 해결이 아니라 회피였음(제목이 한국어라 결국 한글 폰트 필요). 두 선택지로 열어둠 → 12번.
- **core 과장 제거**: "외부 import 0개 / Astro 버려도 이동"은 거짓(core가 `astro:content`에 의존). 그 문구 삭제. core를 나누는 진짜 이유는 **"draft 필터·정렬 로직을 한 곳에 모아 중복 방지"** 하나로 충분.
- **분석 도구 변경**: Vercel Analytics → **PostHog Cloud(무료)**. 이유: 사업 홍보 측정엔 조회수가 아니라 **CTA 전환(버튼 클릭·깔때기)**이 필요. `integrations/Analytics.astro` 래퍼 뒤에 두어 언제든 교체 가능.

### v0.2 → v0.3

- 저장소: private 2개 → **public 1개** 통합 ([ADR 0001](docs/adr/0001-single-public-repo.md))
- 호스팅: **Vercel** 확정 ([ADR 0002](docs/adr/0002-vercel-hosting.md))
- 초안: 공개 repo에 커밋 안 함 ([ADR 0003](docs/adr/0003-drafts-stay-local.md))
- 익명화: fail-closed pre-push 훅 ([ADR 0004](docs/adr/0004-redaction-fail-closed-hook.md))
- draft 필터 공통화, View Transitions 제거, 사이트맵 추가, TypeScript, 살짝-헥사고날 구조

## 1. 목적

- **이직 준비**: 기술 역량, 의사결정 과정, 문제 해결 방식을 공개해 신뢰 자산 축적
- **사업 홍보**: 사주 앱 / recall 익스텐션 / 인디게임 등 사이드 프로젝트를 "만드는 과정" 자체로 홍보. **CTA 전환을 측정한다.**
- **운영 원칙**: 최소 관리 부담. 콘텐츠 = md/mdx 파일 하나. `git push` = 배포 끝. AI로 초안~발행까지 최대한 자동화.
- **컨셉**: "만드는 사람" — 엔지니어가 사이드 프로젝트를 실제 출시까지 끌고 가는 기록. 완성 코드는 공개, 덜 익은 초안은 로컬.

## 2. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Astro | 정적 생성, 블로그 최적화, 러닝커브 낮음 |
| 언어 | TypeScript | `core/`는 `.ts`, 타입은 `CollectionEntry`로 통일 |
| 콘텐츠 포맷 | Markdown / MDX | mdx는 인터랙티브 요소 필요할 때만 |
| 콘텐츠 관리 | Astro Content Collections | frontmatter 스키마 타입 체크 |
| 배포 | **Cloudflare Workers** (Static Assets) | `wrangler.jsonc` assets + custom domain. Workers Builds로 push 자동배포 |
| 저장소 | GitHub public (단일) | 코드·콘텐츠·댓글 한 지붕. 초안은 로컬만 |
| 스타일링 | Tailwind CSS v4 (+ typography 플러그인) | `@tailwindcss/vite`. 본문은 `prose`. 폰트 Pretendard |
| 코드 하이라이팅 | astro-expressive-code | 코드블록 하이라이트 + 복사버튼 |
| 검색 | Pagefind (나중) | 글 30~50개 넘으면. 그전엔 태그 필터 |
| 댓글 | Giscus + 같은 repo의 Discussions | 아래 6번 |
| **분석** | **PostHog Cloud (무료)** | CTA 전환·깔때기 측정. 래퍼 뒤 → 교체 가능. 쿠키리스 모드 |
| RSS | @astrojs/rss | `core/posts.ts` 경유 → draft 자동 제외 |
| 사이트맵 | @astrojs/sitemap | `core/posts.ts` 경유 → draft 자동 제외 |
| OG 이미지 | astro-og-canvas | 텍스트 처리는 미해결 → 12번 |
| 아이콘 | astro-icon (Iconify) | 카테고리/상태 뱃지용, 트리셰이킹 |
| ~~뷰 전환~~ | ~~View Transitions~~ 제거 | Giscus 재초기화 충돌 회피 |

## 3. 정보 구조 (IA)

```
/                     # 랜딩 - 최근 글 + 프로젝트 하이라이트
/blog                 # 전체 글 목록 (필터: engineering / build-log / notes)
/blog/[slug]          # 개별 글 (댓글 섹션 포함). slug은 날짜 없는 깔끔한 형태
/projects             # 프로젝트 허브 (사주앱, recall, 게임 카드형 요약)
/projects/[slug]      # 프로젝트별 상세 + build-log 타임라인 + CTA
/about                # 소개 - 담백한 경력 요약 + 프로젝트 링크. 번아웃/휴직 서사 없음
/tags/[tag]           # 태그별 아카이브
/rss.xml
/sitemap-index.xml    # @astrojs/sitemap 자동 생성
```

### 3.1 URL / slug 규칙 (되돌리기 힘듦)

- **파일명**: `YYYY-MM-DD-slug.md` (발행본) / `YYYY-MM-DD-slug.draft.md` (초안). 날짜 접두사는 로컬 폴더 정렬용.
- **URL slug**: 날짜를 뗀 형태 (예: `/blog/recall-prd-writing`). 3년 뒤에도 안 낡아 보이는 깔끔한 주소.
- **불변 규칙**: **한 번 발행한 slug은 절대 바꾸지 않는다.** 바꾸면 ① 외부 링크·검색 순위, ② Giscus 댓글이 미아가 됨. 부득이하면 옛→새 주소 리다이렉트 필수.
- **Giscus 매핑**: `pathname` 기준.

## 4. 콘텐츠 카테고리 (frontmatter `category`)

1. **engineering** — 기술 회고, 아키텍처 의사결정, 트러블슈팅 (회사 경력 기반, 익명화 필수)
2. **build-log** — 사이드 프로젝트 진행 기록 (사주앱 / recall / 게임)
3. **notes** — 짧은 생각, 커리어/시장 관찰, 사주 도메인 지식 등

## 5. Content Collection 스키마

스키마 = **진실의 원천 하나**. TS 타입은 여기서 파생, 손으로 다시 안 적는다.

```ts
// src/content/config.ts
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
    draft: z.boolean().default(true), // 사이트 노출 여부. true면 core/posts.ts가 제외
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

```ts
// src/core/types.ts — Astro 콘텐츠 API에서 파생. 타입 중복 정의 금지.
import type { CollectionEntry } from 'astro:content';
export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;
```

**초안(draft)의 두 뜻 — 헷갈리지 않게 (CONTEXT.md 참조)**
- **파일명으로서의 초안**: `...slug.draft.md`. gitignore 패턴으로 git에 안 올라감. 하지만 `posts` 컬렉션 안이라 **dev에서 렌더 미리보기 가능.** = "작업 중."
- **플래그로서의 초안**: `draft: true`. 커밋돼 있어도 `core/posts.ts`가 사이트 노출에서 제외. = "올렸지만 아직 안 보이게"(소프트 런치).

**세 겹 안전망**
1. 1차(가장 강함): 초안은 `*.draft.md` gitignore 패턴이라 **git이 애초에 스테이징 안 함.** (`--no-verify`로도 못 우회 — 커밋 자체가 안 됨.)
2. 2차: pre-push 훅이 redact-terms로 실수 검사(→ 9.3). 한계 있음(아래).
3. 3차: 혹시 `.md` 발행본에 `draft: true`가 남아도 `core/posts.ts`가 사이트에서 제외.

## 6. 저장소 · 댓글 아키텍처 (단일 public repo)

→ 근거: [ADR 0001](docs/adr/0001-single-public-repo.md), [ADR 0003](docs/adr/0003-drafts-stay-local.md)

### 6.1 저장소
- **repo 1개, public.** 소스·발행 콘텐츠·댓글이 모두 여기. 코드까지 공개해 "만드는 사람" 컨셉 강화.
- 진짜 버그/PR은 **Issues**, 블로그 댓글은 **Discussions** — 섞이지 않음.

### 6.2 초안(draft) 취급
- 초안 파일명은 `...slug.draft.md`. `.gitignore`에 `src/content/posts/*.draft.md` 패턴 → git에 안 올라감.
- 컬렉션 안에 있어 `npm run dev`에서 렌더링 미리보기 됨(발행 전 눈으로 확인 가능).
- 발행 시: `blog-publish` 스킬이 `.draft.md` → `.md`로 rename + `draft: false` 전환 후 그 파일만 커밋.
- 백업/동기화 안 함(초안 유실 감수 — 사용자 결정).

### 6.3 댓글 (Giscus)
- Giscus 위젯이 **같은 repo의 Discussions**를 봄. `pathname` 매핑.
- 스팸/모더레이션: Discussions 기본 기능(신고·잠금·삭제)으로 충분.
- `integrations/Comments.astro`로 감싸 도구 교체 시 이 파일만.

## 7. 폴더 구조 (살짝-헥사고날)

원칙: **로직을 한 곳에 모아 중복 방지 + 외부 서비스는 얇은 래퍼로 격리.** 정식 포트/DI는 과설계라 안 함.

```
src/
  core/                 # 🟦 순수 로직 + 타입. astro:content엔 의존(그건 OK). 그 외 라이브러리는 안 씀.
    types.ts            #   Post·Project 타입 (CollectionEntry에서 파생)
    posts.ts            #   getPublishedPosts(), getAllPosts()[dev 미리보기용],
                        #   sortByDate(), byTag(), byCategory()...
                        #   ← draft 거르는 로직은 오직 여기 한 곳
  integrations/         # 🟥 갈아끼울 부품. 각자 얇은 래퍼 하나씩.
    Comments.astro      #   Giscus
    Analytics.astro     #   PostHog (쿠키리스 모드)
    ogImage.ts          #   OG 이미지 생성 (astro-og-canvas)
  components/           # UI 조각. core 타입만 알면 됨.
    PostCard / ProjectCard / Header / Footer / TagList / CtaButton(전환 이벤트 발생)
  layouts/
    BaseLayout / PostLayout / ProjectLayout
  pages/                # 얇게. core에서 데이터 받아 components로 그림.
    index.astro
    blog/index.astro   blog/[...slug].astro
    projects/index.astro   projects/[slug].astro
    about.astro
    rss.xml.ts          # ← getPublishedPosts() 사용
  content/
    config.ts           # Zod 스키마 = 진실의 원천 하나
    posts/              # 발행본 *.md (커밋됨) + 초안 *.draft.md (gitignore)
    projects/           # saju-app.md, recall-extension.md, indie-game.md
scripts/
  pre-push.sh           # redact-terms 검사, fail-closed (9.3)
astro.config.mjs
tailwind.config.mjs
.gitignore              # src/content/posts/*.draft.md 포함
```

### 7.1 구조 규칙 ("뗐다 붙였다"의 핵심)
1. **`pages/`는 Giscus·PostHog를 직접 안 부른다.** `integrations/` 래퍼를 거친다.
2. **draft 필터는 `core/posts.ts` 딱 한 곳.** 모든 페이지·RSS·태그·사이트맵이 이 함수만 쓴다 → 초안이 자동으로 페이지·피드에서 빠짐.
3. **타입은 `CollectionEntry`로 통일.** 두 번 적지 않는다.
4. **`core/`는 `astro:content` 외의 외부 라이브러리를 안 쓴다.** (프레임워크 이식성을 위해서가 아니라, 로직을 순수하고 테스트 쉽게 유지하려고.)

### 7.2 일부러 안 하는 것 (과설계 방지)
- 댓글용 `interface CommentProvider` 등 포트/인터페이스 — 구현이 하나뿐이라 낭비. 래퍼 하나로 충분.
- Content Collections를 감싸는 별도 추상화 — 이미 안정적 콘텐츠 포트. 재감싸면 복잡함만.
- "나중에 Astro 버릴 때 대비" 같은 이식성 추상화 — 투기적 유연성. 안 함.

## 8. 회사 경력 콘텐츠 — 익명화 체크리스트 (draft 생성 시 필수)

**제거/치환**
- 회사명·고객사명 → "이전 회사", "해외 B2B 고객사"
- 내부 시스템 고유명사 → 일반화한 기능명
- 인물명/직책 → 삭제 또는 "팀 리드", "매니저" 역할명만
- 매출/비용/단가 등 비즈니스 수치 → 삭제 또는 상대 표현("N배 절감")
- 인프라 정확 규모 → 뭉뚱그리기("수 TB급", "수억 건")

**남겨도 됨**
- 오픈소스 기술/라이브러리명, 아키텍처 패턴·의사결정 이유·트레이드오프, 트러블슈팅 과정, 일반화된 방법론

**절대 금지 (카테고리 무관)**
- 번아웃, 휴직 사유, "왜 떠났는가" 개인 서사

## 9. AI-native 워크플로우 — Claude Skills + 안전망

### 9.1 `blog-draft`
- 트리거: "블로그 글 써줘", "포스트 초안", "build-log 정리해줘" 등
- 동작: 카테고리/프로젝트 판단 → engineering이면 8번 체크리스트를 처음부터 적용 → frontmatter 생성 → **`content/posts/YYYY-MM-DD-slug.draft.md` 생성** (`.draft.md`, `draft: true`). 번아웃/휴직 서사는 원본 메모에 있어도 자동 제외.

### 9.2 `blog-publish`
- 트리거: "이거 발행해줘", "push해줘" 등
- 동작: `*.draft.md` 최신 초안 탐색 → 최종 스캔(회사명/수치/이름/링크, 로컬 redact-terms 대조) → 통과 시 **`.draft.md` → `.md` rename + `draft: false`** → 그 파일만 `git add/commit/push`. 애매하면 조용히 넘기지 않고 구체적 라인 짚어 확인.

### 9.3 pre-push 훅 — 실수 방지 덫 (안전장치이되, 완벽하지 않음)
→ 근거: [ADR 0004](docs/adr/0004-redaction-fail-closed-hook.md)

- 위치: `scripts/pre-push.sh`. 설치: `git config core.hooksPath scripts`(셋업 1회).
- 동작: push되는 커밋 내용을 `~/.blog-redact-terms.txt` 각 단어와 `grep` 대조. 걸리면 push 차단 + 걸린 라인 출력.
- **fail-closed**: 금칙어 파일이 **없거나 / 비었거나 / 너무 짧으면** push 차단. (안전 목록이 무력화됐는데 조용히 통과하지 않음.)

**한계 (정직하게 — "최후 방어선"이 아님):**
- `git push --no-verify`로 우회 가능.
- 외부 PR·GitHub 웹 편집은 로컬 훅을 안 거침.
- 목록에 없는 신원 정보는 못 잡음 (수동 목록의 한계).
- → 훅은 *실수*를 잡는 덫이다. **진짜 방어는 "글 쓸 때 처음부터 익명화"(blog-draft) + 발행 전 사람 눈 검토.** 훅은 그 보완일 뿐.

### 9.4 로컬 커스터마이징
- 실제 회사명/고객사/시스템명/전 동료 이름은 로컬 전용 `~/.blog-redact-terms.txt`로만. 어떤 repo에도 커밋 안 함. 백업 안 함.

## 10. 초기 셋업 순서 (실행 계획)

> 기대치: AI 도움 받아도 **반나절~하루.** Giscus·OG 이미지에서 시간 걸림.

1. `npm create astro@latest` → minimal 템플릿
2. `astro add tailwind mdx sitemap` + `astro-expressive-code` `astro-og-canvas` `astro-icon` `@astrojs/rss` `posthog-js`
3. `content/config.ts` 스키마 + `core/types.ts`
4. `core/posts.ts` — `getPublishedPosts()`(draft 제외) / `getAllPosts()`(dev 미리보기) 등 필터 공통화
5. 레이아웃 3종 + `integrations/Comments.astro`(Giscus) + `integrations/Analytics.astro`(PostHog, 쿠키리스)
6. 페이지들(홈/블로그목록/글/프로젝트/about) — 모두 `core/posts.ts` 경유
7. RSS + 사이트맵 (getPublishedPosts 사용 → draft 자동 제외 확인)
8. OG 이미지 생성 (`astro-og-canvas`) — 텍스트 방식은 12번 결정 따름
9. `.gitignore`에 `src/content/posts/*.draft.md` + `scripts/pre-push.sh` 작성 + 훅 설치
10. 예시 발행 포스트 1개 + 프로젝트 3개(CTA 링크 포함, CtaButton이 PostHog 전환 이벤트 발생)
11. GitHub public repo → Discussions 켜기 → **Cloudflare Workers 배포**(`wrangler.jsonc` assets + custom domain `blog.teamnyongs.com`)
12. **Cloudflare Workers Builds**로 GitHub repo 연결(자동배포) + build variables에 PostHog 키
13. Giscus 설정(같은 repo Discussions, Announcements) → `Comments.astro` 인라인. PostHog 키 → `.env` + build variables
14. `blog-publish` 스킬(`.claude/skills/`) — `.draft.md` → `.md` 흐름. (`blog-draft`는 아직 미구축)
15. (선택) Pagefind 검색 · 다크 모드

## 11. Out of Scope (v0.4)

- 다국어 (필요 시 영어 버전 별도)
- CMS 연동 (md 직접 관리로 충분)
- 뉴스레터 (구독자 생기면)
- CI 기반 검사 (pre-push 훅 + 스킬로 대체 → [ADR 0004](docs/adr/0004-redaction-fail-closed-hook.md))
- View Transitions (Giscus 충돌)
- 정식 헥사고날(포트/DI), 프레임워크 이식성 추상화 — 과설계
- 글 주제 백로그, 초안 백업/동기화

## 12. 해소된 오픈 퀘스천 / 남은 선택

**해소됨 (v0.5)**
- ~~OG 이미지 텍스트~~ → 옵션 (a) 채택: 제목 없이 영어 사이트명 + 카테고리. 구현됨.
- ~~커스텀 도메인 시점~~ → 처음부터 `blog.teamnyongs.com`. Cloudflare.

**남은 선택 (급하지 않음)**
- **다크 모드**: 미구현. 넣으면 giscus 테마도 `preferred_color_scheme`로 연동.
- **`blog-draft` 스킬**: 초안 생성 자동화(익명화 처음부터 적용). `blog-publish`의 짝.
- **금칙어 세밀화**: 회사명 `Liner`는 부분문자열이라 "one-liner/eyeliner" 등을 오탐 → 실제 글에서 걸리면 그때 조정.
- **Pagefind 검색**: 글 30~50개 넘으면.
- **about 실제 경력**으로 채우기(현재 플레이스홀더).
