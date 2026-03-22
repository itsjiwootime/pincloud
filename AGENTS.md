# AGENTS.md

## 프로젝트 개요
- 프로젝트명: LinkMap
- 목적: 링크에서 장소 후보를 추출하고, 지도 기반으로 저장/탐색하는 서비스
- 백엔드: Spring Boot 3, Java 21, JPA, MySQL, JWT, Kakao OAuth
- 모바일: Expo, React Native, expo-router

## 먼저 읽을 문서
1. [PRD/01_PRD.md](/Users/jiwoo/IdeaProjects/pincloud/PRD/01_PRD.md)
2. [PRD/03_PHASES.md](/Users/jiwoo/IdeaProjects/pincloud/PRD/03_PHASES.md)
3. [PRD/04_PROJECT_SPEC.md](/Users/jiwoo/IdeaProjects/pincloud/PRD/04_PROJECT_SPEC.md)
4. [docs/adr/README.md](/Users/jiwoo/IdeaProjects/pincloud/docs/adr/README.md)

## 작업 원칙
- 실제 동작하는 코드 기준으로 수정한다. 목업이나 더미 흐름으로 대체하지 않는다.
- 환경변수는 코드에 하드코딩하지 않는다.
- 백엔드와 모바일은 각각 독립적으로 검증 가능한 상태를 유지한다.
- 변경 범위가 크면 기능 단위로 커밋을 나눈다.

## 실행 및 검증

### 백엔드
- 실행: `./gradlew bootRun`
- 테스트: `./gradlew test`
- CI 기준 검증: `./gradlew --no-daemon spotlessCheck spotbugsMain test jacocoTestReport jacocoTestCoverageVerification bootJar`

### 모바일
- 실행: `cd mobile && npm start`
- 테스트: `cd mobile && npm test -- --runInBand`
- 타입체크: `cd mobile && npm run typecheck`

## 환경변수 메모
- 백엔드는 루트 `.env`를 사용한다.
- 모바일은 `mobile/.env`를 사용한다.
- 주요 키:
  - `OPENAI_API_KEY`
  - `KAKAO_CLIENT_ID`
  - `KAKAO_CLIENT_SECRET`
  - `KAKAO_REST_API_KEY`
  - `KAKAO_REDIRECT_URI`
  - `EXPO_PUBLIC_KAKAO_APP_KEY`

## ADR 규칙

### 원칙
- 백엔드에서 기능을 추가하거나 동작을 의미 있게 변경할 때는 ADR 필요 여부를 먼저 판단한다.
- 아래 조건에 해당하면 ADR을 작성한다.

### ADR을 반드시 작성해야 하는 경우
- 인증/인가 방식이 바뀌는 경우
- 도메인 모델 구조가 바뀌는 경우
- API 계약 또는 요청/응답 흐름이 크게 바뀌는 경우
- 외부 API 연동 방식이 바뀌는 경우
- 저장 전략, 조회 전략, 중복 처리 전략 등 핵심 비즈니스 규칙이 바뀌는 경우
- 보안, 트랜잭션, 예외 처리 정책이 구조적으로 바뀌는 경우
- 이후 유지보수에 장기적인 영향을 주는 기술 선택을 새로 하는 경우

### ADR 없이 진행 가능한 경우
- 단순 버그 수정
- 테스트 추가/수정
- UI 전용 수정
- 네이밍/포맷/리팩터링만 있는 변경
- 기존 결정 범위 안에서의 작은 구현 보완

### ADR 작성 방식
- 새 ADR은 [docs/adr](/Users/jiwoo/IdeaProjects/pincloud/docs/adr) 아래에 추가한다.
- 파일명은 기존 규칙을 따른다: `ADR-XXX-<slug>.md`
- 번호는 가장 마지막 ADR 다음 번호를 사용한다.
- 형식은 [docs/adr/README.md](/Users/jiwoo/IdeaProjects/pincloud/docs/adr/README.md)의 구조를 따른다.
  - 배경
  - 결정사항
  - 대안
  - 결과
- 새 ADR을 만들면 [docs/adr/README.md](/Users/jiwoo/IdeaProjects/pincloud/docs/adr/README.md)의 목록도 함께 갱신한다.

### 작업 응답 규칙
- 백엔드 변경 작업 후 최종 응답에는 아래 둘 중 하나를 반드시 명시한다.
  - `ADR 작성함: ADR-XXX`
  - `ADR 생략: 단순 구현/버그 수정으로 신규 결정 없음`

## 테스트 및 문서 반영 규칙
- 백엔드 변경 시 최소 `./gradlew test`는 확인한다.
- 모바일 변경 시 최소 `npm test -- --runInBand`와 `npm run typecheck`를 확인한다.
- PRD나 ADR과 실제 구현 상태가 크게 어긋나면 관련 문서 업데이트를 함께 고려한다.
