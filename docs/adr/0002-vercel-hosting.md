# ADR 0002 — Vercel 호스팅 (GitHub Pages 대신)

- 상태: 채택

## 맥락

repo를 단일 public으로 정하자(ADR 0001), 호스팅을 GitHub Pages로 통일하는 선택지가 생겼다. 코드·호스팅·댓글을 GitHub 하나로 묶을 수 있고, 전부 무료다.

애초에 Vercel을 고려한 큰 이유였던 "Vercel Analytics"는 사실 호스팅을 강제하지 않는다 — Cloudflare Web Analytics 등 GitHub Pages에서도 되는 무료 분석 도구가 있다. 즉 분석 도구가 호스팅 선택을 좌우하면 안 된다.

## 결정

**Vercel + Vercel Analytics를 쓴다.**

## 결과

- **좋아짐**: 설정 파일 0으로 push=배포(스펙 1순위 원칙 "최소 관리 부담"과 일치). PR 미리보기 자동 생성 → build-in-public과 궁합. 분석 1줄.
- **대가**: GitHub 외 업체 하나 추가. 무료 도메인은 `*.vercel.app`.
- **되돌리기**: 정적 사이트라 GitHub Pages로 이전은 어렵지 않음(빌드 산출물 동일). 다만 분석 데이터·URL은 갈아엎어짐.

## 대안

- **GitHub Pages + Cloudflare Web Analytics**: 전부 GitHub 한 곳 + 전부 무료. 단, 배포에 GitHub Actions 워크플로 파일이라는 "움직이는 부품"이 하나 늘고(액션 버전 관리), 분석이 별도 업체(Cloudflare). "설정 0"에서 밀려 기각. 업체를 GitHub 하나로만 두고 싶어지면 재검토 가능.
