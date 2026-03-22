# [ ] TASK-001 모바일 디자인 재설계

- 상태: IN_PROGRESS
- 담당: 공동
- 우선순위: 높음
- 관련 문서:
  - [PRD/03_PHASES.md](/Users/jiwoo/IdeaProjects/pincloud/PRD/03_PHASES.md)
  - [AGENTS.md](/Users/jiwoo/IdeaProjects/pincloud/AGENTS.md)

## 목표
- LinkMap 모바일 앱의 화면 톤을 하나의 디자인 언어로 통일한다.
- 기능은 유지한 채 `City Field Notes` 컨셉으로 전체 앱 경험을 다시 설계한다.

## 범위
- 공통 테마 토큰 재정의
- 인증 화면: 로그인, 회원가입
- 메인 화면: 지도, 리스트, 설정, 탭 바
- 핵심 흐름 화면: 링크 입력, 장소 상세
- 빈 상태, 에러 상태, CTA 위계, 카드/칩/입력창 스타일 정리

## 제외
- 백엔드 API 변경
- 데이터 모델 변경
- 신규 기능 추가
- 카카오 로그인 안정화 자체를 위한 기능 수정

## 완료 조건
- [x] 모바일 7개 화면이 같은 톤으로 정리된다.
- [x] 로그인 → 지도 → 링크 입력 → 장소 상세 흐름의 위계가 자연스럽다.
- [x] 리스트/설정이 메인 톤과 이질적이지 않다.
- [x] Android 에뮬레이터에서 실제 화면 확인을 마친다.
- [x] `mobile` 테스트와 타입체크가 통과한다.

## 검증
- `cd mobile && npm test -- --runInBand`
- `cd mobile && npm run typecheck`
- `cd mobile && npm start`
- Android 에뮬레이터에서 주요 화면 시각 확인

## ADR
- 작성 필요 여부: 생략 예정
- 메모:
  - 이번 작업은 모바일 UI/디자인 레이어 재설계이며 백엔드 기술 결정 변경이 없다.

## Phase

### Phase 1. 디자인 시스템 기준안
- [x] 컨셉 확정: `City Field Notes`
- [x] 공통 테마 파일 추가
- [x] 토큰 최종 확정

### Phase 2. 인증/메인 화면 1차 개편
- [x] 로그인 화면 1차 개편
- [x] 회원가입 화면 1차 개편
- [x] 지도 화면 1차 개편
- [x] 리스트 화면 1차 개편
- [x] 설정 화면 1차 개편
- [x] 탭 바 스타일 1차 개편

### Phase 3. 핵심 흐름 화면 정리
- [x] 링크 입력 화면 재설계
- [x] 장소 상세 화면 재설계
- [x] 액션 위계 및 카드 밀도 조정

### Phase 4. 전체 QA 및 마감
- [x] 에뮬레이터 실화면 최종 점검
- [x] 화면 간 spacing / radius / button hierarchy 재조정
- [ ] 최종 커밋 정리

## 구현 메모
- `City Field Notes`는 밝은 종이 톤 배경, 진한 잉크 텍스트, coral/teal 포인트를 핵심 언어로 사용한다.
- 현재 auth, 지도, 리스트, 설정은 1차 리디자인이 한 번 들어간 상태다.
- `link-input`은 `붙여넣기 → 추출 → 검토`의 워크플로 카드 구조로 정리했다.
- `place/[id]`는 히어로 카드와 보조 섹션 카드로 분리하고, 액션 버튼 비율을 재조정했다.
- 디자인 작업은 기능 로직보다 화면 구조와 위계 조정이 우선이다.

## 작업 로그
- 2026-03-22: 작업 카드 구조 정의 및 `docs/tasks` 레이어 생성
- 2026-03-22: `City Field Notes` 컨셉 기준으로 auth/메인 화면 1차 개편 완료
- 2026-03-22: `link-input`, `place/[id]` 화면 재설계 및 액션/카드 밀도 조정 완료
- 2026-03-22: Android 에뮬레이터에서 로그인, 지도, 리스트, 링크 입력, 장소 상세 실화면 확인
- 2026-03-22: `cd mobile && npm run typecheck`, `cd mobile && npm test -- --runInBand` 검증 완료
