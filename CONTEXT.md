# CONTEXT — 용어집

이 블로그 프로젝트에서 쓰는 말의 뜻을 하나로 고정한다. 구현 세부는 여기 적지 않는다 (그건 SPEC.md / ADR).

## Post
발행되었거나 발행 예정인 글 하나. `content/posts/`(발행본) 또는 `content/drafts/`(초안)에 사는 md/mdx 파일 하나 = Post 하나.

## Draft (초안)
아직 사이트에 노출되지 않는 Post. 두 가지 뜻이 겹치지 않게 구분:
- **파일명으로서의 초안**: `...slug.draft.md` → gitignore 패턴으로 커밋 안 됨. 단 `posts` 컬렉션 안이라 dev에서 미리보기 가능. = "작업 중."
- **플래그로서의 초안**: frontmatter `draft: true` → 사이트 노출에서 제외(`core/posts.ts`가 거름). 커밋돼 있어도 화면엔 안 뜸. = "올렸지만 안 보이게(소프트 런치)."
발행 = `.draft.md`를 `.md`로 rename하고 `draft: false`로 전환.

## Published Post (발행본)
`content/posts/`에 있고 `draft: false`인 Post. 사이트에 노출되고 RSS·사이트맵에 포함됨.

## Project
사이드 프로젝트 하나 (saju-app / recall-extension / indie-game). `content/projects/`의 파일 하나. Post의 `project` 필드가 이걸 가리켜 build-log를 묶는다.

## Category
Post의 성격 분류. 셋 중 하나로 고정:
- **engineering** — 회사 경력 기반 기술 글. 익명화 필수.
- **build-log** — 사이드 프로젝트 진행 기록.
- **notes** — 짧은 생각/관찰/도메인 지식.

## Slug
글의 URL에서 글을 식별하는 부분. 날짜를 뗀 형태(예: `recall-prd-writing`). **한 번 발행하면 불변** — 바꾸면 외부 링크·검색 순위·Giscus 댓글이 미아가 됨.

## Redaction (익명화)
회사 경력 글에서 신원 식별 정보(회사명·고객사·인물·구체 수치)를 제거/치환하는 것. 기준은 SPEC.md 8번 체크리스트. 실제 금칙어 목록은 로컬 파일 `~/.blog-redact-terms.txt`.

## Fail-closed
안전장치가 정상 작동 못 하는 상황(예: 금칙어 목록 파일 없음)에서 "통과"가 아니라 "차단"을 택하는 원칙. pre-push 훅에 적용.

## core / integrations
- **core**: 안 바뀌는 알맹이. 순수 로직 + 타입. 외부 라이브러리 의존 없음.
- **integrations**: 갈아끼울 수 있는 외부 서비스 어댑터(댓글·분석·OG 이미지). 각자 얇은 래퍼 하나.
