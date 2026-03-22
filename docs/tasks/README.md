# Tasks

실행 중심 작업 문서를 모아두는 폴더입니다.

이 레이어의 목적은 아래 3가지입니다.
- AI 에이전트에게 작업을 분배할 때 바로 넘길 수 있는 카드 유지
- 내가 어떤 작업을 했는지 목표/검증/메모까지 한 번에 추적
- PRD와 ADR 사이에서 "실행 이력"을 관리

## 언제 쓰는가
- 기능 구현 작업을 나눠 진행할 때
- 디자인 리디자인처럼 여러 phase로 나눠 처리할 때
- 완료 조건, 검증 명령, ADR 필요 여부를 함께 기록해야 할 때

## 문서 규칙
- 파일명: `TASK-XXX-<slug>.md`
- 예시:
  - `TASK-001-mobile-design-redesign.md`
  - `TASK-002-kakao-login-stabilization.md`
- 작업 하나당 문서 하나를 기본으로 한다.
- 작업이 커지면 한 문서 안에서 phase를 나눈다.

## 카드에 반드시 포함할 것
- 목표
- 범위
- 완료 조건
- 검증
- ADR
- 구현 메모
- 작업 로그

## 상태 표기
- 헤더 체크박스:
  - `[ ]` 진행 전 또는 진행 중
  - `[x]` 완료
- 본문 상태:
  - `TODO`
  - `IN_PROGRESS`
  - `BLOCKED`
  - `DONE`

## 에이전트에게 넘기는 방식
- 작업을 맡길 때는 해당 카드 파일 경로를 함께 준다.
- 에이전트는 구현 전 카드의 목표/범위/완료 조건/검증/ADR 섹션을 먼저 읽는다.
- 작업이 끝나면 `구현 메모`와 `작업 로그`를 갱신한다.

## 다른 문서와의 관계
- PRD: 왜 만드는지, 어떤 범위인지
- ADR: 어떤 기술 결정을 왜 했는지
- Tasks: 실제로 무엇을 어떤 순서로 구현했고, 어떻게 검증했는지

## 시작점
- 템플릿: [TEMPLATE.md](/Users/jiwoo/IdeaProjects/pincloud/docs/tasks/TEMPLATE.md)
- 현재 작업 카드:
  - [TASK-001-mobile-design-redesign.md](/Users/jiwoo/IdeaProjects/pincloud/docs/tasks/TASK-001-mobile-design-redesign.md)
