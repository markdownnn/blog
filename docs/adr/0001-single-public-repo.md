# ADR 0001 — 단일 public 저장소

- 상태: 채택
- 관련: [ADR 0003](0003-drafts-stay-local.md)

## 맥락

v0.2는 저장소를 둘로 나눴다. 코드·초안은 private repo, 댓글은 별도 public repo(Giscus용 Discussions 전용). 이유는 "코드/초안을 비공개로 두면서 댓글은 공개로 받기".

하지만 블로그 컨셉은 "만드는 사람 — building in public"이다. 코드를 숨기는 건 이 컨셉과 어긋난다. 또 저장소 2개는 운영 복잡도(설정·권한·Giscus 연결)를 늘린다.

## 결정

**public repo 1개로 통합한다.** 코드·발행 콘텐츠·댓글이 한 지붕 아래.

- 댓글은 같은 repo의 **Discussions**에 저장(Giscus). 진짜 버그/PR은 **Issues**로 분리해 섞이지 않게 함.
- 초안은 이 공개 repo에 올리지 않는다 — 별도로 처리(ADR 0003).

## 결과

- **좋아짐**: 컨셉 일치(코드 공개). 저장소 하나로 운영 단순화. 별도 댓글 repo 제거.
- **대가**: 익명화 리스크가 커짐 — 이제 실수가 곧 공개다. 이를 ADR 0003(초안 로컬화) + ADR 0004(fail-closed 훅)로 방어한다.
- **되돌리기**: public → private 전환은 가능하나, 이미 공개된 git 역사·인덱싱은 되돌릴 수 없음. 사실상 편도.

## 대안

- **private repo 유지 + 별도 public 댓글 repo (v0.2)**: 컨셉 불일치 + 저장소 2개 복잡도. 기각.
