# ADR 0003 — 초안은 로컬에만, 발행 시 rename

- 상태: 채택 (v0.4에서 메커니즘 개선)
- 관련: [ADR 0001](0001-single-public-repo.md), [ADR 0004](0004-redaction-fail-closed-hook.md)

## 맥락

repo가 단일 public이 되면서(ADR 0001), 초안을 커밋하면 그 내용이 **공개 git 역사에 영구히** 박힌다. 초안엔 미익명화 회사 얘기, 다듬다 만 글이 있을 수 있다.

처음(v0.3)엔 초안을 별도 gitignore 폴더 `content/drafts/`에 두려 했다. 그러나 Astro 콘텐츠 컬렉션은 폴더로 정의되므로, 그 폴더의 파일은 컬렉션 밖 → **로컬에서 렌더링 미리보기가 불가**. 발행 전엔 글을 눈으로 못 보고 깜깜이로 쓰게 된다.

## 결정

**초안은 `content/posts/` 안에 `...slug.draft.md` 파일명으로 두고, `.gitignore` 패턴 `src/content/posts/*.draft.md`로 git에서 제외한다.**

- 컬렉션 안에 있으므로 `npm run dev`에서 렌더링 미리보기 가능.
- gitignore 패턴이라 `git add`가 스테이징하지 않음 → 커밋 자체가 안 됨(`--no-verify`로도 우회 불가, 커밋할 게 없으니).
- 발행: `blog-publish`가 `.draft.md` → `.md` rename + `draft: false` 후 그 파일만 커밋.
- 초안 백업/동기화 안 함(유실 감수 — 사용자 결정).

## 결과

- **좋아짐**: "미익명화·미완성이 공개 git에 닿지 않음"(강한 1차 방어)을 유지하면서, 잃었던 **로컬 미리보기를 되찾음.**
- **대가**: 초안이 한 노트북에만 존재. `draft.md` 명명 규칙을 지켜야 함.
- **되돌리기**: 정책이라 바꿀 수 있으나, 이미 커밋한 초안 역사는 못 지움.

## 대안

- **별도 gitignore 폴더 `content/drafts/` (v0.3 초안)**: 미리보기 불가. 개선안으로 대체.
- **`content/posts/`에 그냥 `draft: true`로 커밋**: 미익명화 글 영구 공개 위험. 기각.
- **별도 branch**: 복잡도만 늘고 이득 적음. 기각.
