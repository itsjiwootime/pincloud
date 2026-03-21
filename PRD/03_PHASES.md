# LinkMap — Phase 분리 계획

> 한 번에 다 만들면 복잡해져서 품질이 떨어집니다.
> Phase별로 나눠서 각각 "진짜 동작하는 제품"을 만듭니다.

---

## Phase 1: MVP (포트폴리오 핵심)

### 목표
"링크를 붙여넣으면 자동으로 지도에 저장된다"는 핵심 경험 구현

### 기능
- [x] 회원가입 / 로그인 (카카오 OAuth + 이메일/비밀번호) — **백엔드 완료**
- [x] 링크 입력 → 플랫폼 자동 구분 (Instagram / YouTube / Blog / Other) — **백엔드 완료**
- [x] 링크 메타데이터 추출 → LLM(gpt-4o-mini) 장소 후보 추출 → 카카오 장소 API 매칭 — **백엔드 완료**
- [x] SavedPlace 저장 (이름, 주소, 좌표, 카테고리, memo, visitStatus) — **백엔드 완료**
- [x] SourceLink 함께 저장 (원본 URL, 플랫폼, 썸네일) — **백엔드 완료**
- [ ] 카카오맵 위에 핀 표시 (카테고리별 색상) — **프론트엔드 미구현**
- [ ] 핀 클릭 → 상세화면 (memo, 출처 링크, visitStatus 표시) — **프론트엔드 미구현**
- [x] 카테고리 생성 / 편집 / 삭제 — **백엔드 완료**
- [ ] 카테고리별 핀 필터링 — **프론트엔드 미구현**

### 데이터
- User, Category, SavedPlace, SourceLink

### 인증
- 카카오 OAuth 2.0
- 이메일 + 비밀번호 (Spring Security + JWT)

### "진짜 제품" 체크리스트
- [ ] 실제 DB 연결 (MySQL 환경변수 설정 후 `./gradlew bootRun` 검증 필요)
- [x] 실제 인증 (JWT + 카카오 OAuth 구현 완료, 하드코딩 없음)
- [x] 실제 카카오 장소 API 연동 (더미 데이터 X — `KAKAO_REST_API_KEY` 환경변수로 주입)
- [ ] Expo로 테스트 기기에서 실행 가능 — **React Native 앱 미착수**
- [x] API 에러 시 사용자에게 친절한 메시지 표시 (`GlobalExceptionHandler` + `ApiResponse` 포맷)

### 백엔드 구현 현황 (2026-03-18 기준)
- **Java 소스 파일**: 45개 (도메인, API, 인증, 외부 연동, 공통)
- **테스트**: 28개 전체 통과 (5개 테스트 클래스)
- **ADR**: 7개 작성 완료 (`docs/adr/`)
- **환경변수 미설정**: `OPENAI_API_KEY`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `KAKAO_REST_API_KEY`

### Phase 1 시작 프롬프트
```
이 PRD를 읽고 LinkMap Phase 1을 구현해주세요.
@PRD/01_PRD.md
@PRD/02_DATA_MODEL.md
@PRD/04_PROJECT_SPEC.md

Phase 1 범위:
- 링크 입력 → 플랫폼 구분 → 장소 자동 추출 → 저장
- 카카오맵 핀 표시 + 카테고리 필터
- 카테고리 CRUD
- 상세화면 (출처 링크·memo·visitStatus)
- 로그인 (카카오 OAuth + 이메일/비밀번호)

반드시 지켜야 할 것:
- 04_PROJECT_SPEC.md의 "절대 하지 마" 목록 준수
- 실제 DB 연결 (목업 X)
- 실제 카카오 API 연동 (더미 데이터 X)
- API 키는 환경변수로만 사용
```

---

## Phase 2: 활용 확장

### 전제 조건
- Phase 1이 테스트 기기에서 안정적으로 동작하는 상태

### 목표
저장한 장소를 실제 방문으로 연결하고, 일상적으로 쓸 수 있도록 편의 기능 추가

### 기능
- [ ] 길찾기 연결 — 카카오맵·네이버지도·티맵 딥링크
- [ ] visitStatus 변경 기능 (WANT ↔ VISITED)
- [ ] 원문 바로가기 (SourceLink URL 인앱 브라우저 열기)
- [ ] 메모 나중에 추가 / 수정
- [ ] 리스트 보기 (VISITED / WANT 탭 필터)
- [ ] 지도 범위 기반 조회 (viewbox query — 현재 화면에 보이는 핀만 로드)

### 추가 없음
Phase 1 데이터 모델 유지. SavedPlace에 `updatedAt` 활용 시작.

### 통합 테스트
- Phase 1 기능(링크 저장·지도 핀·카테고리 필터)이 여전히 정상 동작하는지 확인

---

## Phase 3: 고도화

### 전제 조건
- Phase 1 + 2가 안정적으로 동작하고 실제 사용 데이터가 쌓인 상태

### 목표
동일 장소 중복 최소화, 다중 출처, 탐색 경험 고도화

### 기능
- [ ] Place / SavedPlace 2층 도메인 분리 (DB 마이그레이션 포함)
- [ ] SourceLink 1:N 확장 (동일 장소에 여러 출처 링크 추가)
- [ ] 주변 장소 탐색 (반경 N km 내 저장 장소 검색)
- [ ] 콜렉션 공유 (특정 카테고리를 링크로 공유)
- [ ] 방문 로그 / 통계 (언제 저장, 언제 방문)

### 주의사항
- Place/SavedPlace 분리 시 기존 데이터 마이그레이션 스크립트 필요
- 반경 검색 시 지리 인덱스(PostGIS 또는 H3) 도입 검토
- 콜렉션 공유 시 공개 URL 생성 → 보안 정책 필요

---

## Phase 로드맵 요약

| Phase | 핵심 기능 | 상태 |
|-------|----------|------|
| Phase 1 (MVP) | 링크 저장 → 지도 핀 → 카테고리 필터 | **백엔드 완료, 프론트엔드 미착수** |
| Phase 2 | 길찾기·visitStatus 변경·리스트·범위 조회 | Phase 1 완료 후 |
| Phase 3 | 2층 도메인·다중 출처·반경 탐색·공유 | Phase 2 완료 후 |
