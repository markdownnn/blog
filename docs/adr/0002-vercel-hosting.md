# ADR 0002 — Cloudflare Workers 호스팅 (Vercel 대신)

- 상태: 채택 (v0.4에서 Vercel → Cloudflare로 변경)

## 맥락

repo를 단일 public으로 정하자(ADR 0001), 호스팅 후보가 여럿 생겼다. 처음(v0.3)엔 "설정 0, push=배포"를 이유로 Vercel + Vercel Analytics를 골랐다. 그러나 이후 두 가지가 바뀌었다:

1. **분석을 PostHog로 이전** → 분석이 호스팅과 무관해짐(Vercel에 묶일 이유 소멸).
2. **사용자가 Cloudflare 계정을 이미 세팅하고 커스텀 도메인 `teamnyongs.com`을 보유** → DNS·호스팅을 한 곳에서, 커스텀 도메인으로 바로 시작 가능.

블로그는 순수 정적 사이트(`astro build` → `dist/` HTML, SSR 없음)라 어댑터 없이 어느 정적 호스팅에도 올라간다.

## 결정

**Cloudflare Workers(Static Assets)에 배포하고, 커스텀 도메인 `blog.teamnyongs.com`으로 시작한다.**

- 배포 단위: assets-only Worker. `wrangler.jsonc`의 `assets.directory: ./dist` + `routes`에 `blog.teamnyongs.com` custom_domain.
- CI/CD: **Cloudflare Workers Builds**로 GitHub repo를 연결 → `main` push 시 자동 빌드+배포("push=배포 끝" 유지).
- 빌드 타임 환경변수(PostHog `PUBLIC_*`)는 Workers Builds의 build variables에 등록(런타임 변수 아님 — assets-only Worker엔 런타임 변수 불가).

## 결과

- **좋아짐**: 커스텀 도메인으로 시작 → 나중에 이사하며 링크·SEO 깨질 일 없음(SPEC 12 도메인 오픈퀘스천 해소). 코드·호스팅·DNS·댓글이 GitHub+Cloudflare 두 곳으로 단순. 정적이라 빠르고 무료.
- **대가**: Vercel의 제로설정 대비 초기 설정이 조금 더 있음(wrangler.jsonc, Workers Builds 연결, build 변수). workers.dev 서브도메인 미등록 시 커스텀 도메인 라우트로만 배포됨(우리는 그걸로 충분).
- **되돌리기**: 정적 산출물이라 다른 호스팅으로 이전은 쉬움. 도메인은 그대로 유지 가능.

## 대안

- **Vercel + Vercel Analytics (v0.3)**: 분석 이전 + Cloudflare 보유로 이점 소멸. 기각.
- **Cloudflare Pages**: 정적엔 더 단순하지만, Cloudflare가 Workers를 미는 방향 + 사용자가 Workers 선호. Workers Static Assets로 감.
- **GitHub Pages + Cloudflare Web Analytics**: 무료·단일 벤더지만 Actions 워크플로 관리 부담. 기각.
