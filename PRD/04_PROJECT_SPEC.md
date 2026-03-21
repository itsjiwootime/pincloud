# LinkMap — 프로젝트 스펙

> AI가 코드를 짤 때 지켜야 할 규칙.
> 이 문서를 AI에게 항상 함께 공유하세요.

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 백엔드 프레임워크 | Java 21 + Spring Boot 3 | 포트폴리오 목적, Java 역량 증명 |
| 데이터베이스 | MySQL (또는 PostgreSQL) | JPA 연동 용이, 지리 인덱스 확장 가능 |
| ORM | Spring Data JPA + Hibernate | 도메인 설계 중심 개발 |
| 인증 | Spring Security + JWT + 카카오 OAuth 2.0 | 이메일/비밀번호 + 소셜 로그인 동시 지원 |
| 장소 추출 | OpenAI gpt-4o-mini (Structured Output) | LLM 기반 후보 추출 + 콘텐츠 분류 |
| 지도 API | Kakao Maps API (장소 검색·지도 표시) | 한국 서비스 최적화, 무료 티어 제공 |
| 모바일 프론트엔드 | React Native + Expo | iOS+Android 동시 지원, AI 코딩 친화적 |
| API 통신 | REST API (JSON) | 심플한 구조, 문서화 용이 |
| API 문서 | Swagger (SpringDoc OpenAPI) | 프론트-백 협업 및 포트폴리오 제출용 |
| 배포 (백엔드) | AWS EC2 또는 Railway | 포트폴리오 접근 가능한 퍼블릭 URL |
| 배포 (앱) | Expo Go (개발) / APK (포트폴리오 제출) | |

---

## 프로젝트 구조 (백엔드)

```
pincloud/
├── src/main/java/com/jiwoo/pincloud/
│   ├── domain/
│   │   ├── user/           # User 엔티티, 레포, 서비스
│   │   ├── place/          # SavedPlace 엔티티, 레포, 서비스
│   │   ├── category/       # Category 엔티티, 레포, 서비스
│   │   └── link/           # SourceLink 엔티티, 레포, 서비스
│   ├── api/                # REST 컨트롤러
│   ├── external/           # 카카오 API 클라이언트
│   ├── auth/               # JWT, OAuth 처리
│   └── common/             # 공통 예외처리, 응답 포맷
├── src/main/resources/
│   └── application.yaml
└── src/test/               # 단위/통합 테스트
```

---

## 절대 하지 마 (DO NOT)

- API 키, JWT 시크릿, DB 비밀번호, OpenAI API 키를 코드에 직접 쓰지 마 → `application.yaml` 환경변수 사용
- 기존 DB 스키마를 임의로 변경하지 마 → 마이그레이션 스크립트 작성 후 적용
- 목업/하드코딩 데이터로 완성이라고 하지 마 → 실제 카카오 API 연동 필수
- 테스트 없이 새 API 추가하지 마 → 최소 단위 테스트 1개 이상
- `SavedPlace`와 `Category`를 같은 테이블에 합치지 마 → 설계 분리 유지
- SourceLink를 SavedPlace에 컬럼으로 인라인하지 마 → 별도 테이블 유지 (향후 1:N 확장)
- `visitStatus` 값으로 String 직접 저장하지 마 → Enum 사용 (`WANT`, `VISITED`)
- `(userId, name)` 중복 카테고리 생성을 허용하지 마 → DB unique 제약 + 서비스 레이어 검증

---

## 항상 해 (ALWAYS DO)

- 변경하기 전에 영향 범위를 먼저 설명하고 진행
- 환경변수는 `application.yaml` + OS 환경변수로 주입 (`.env` 파일 절대 커밋 X)
- API 에러 시 `{ success: false, message: "..." }` 포맷으로 사용자 친화적 메시지 반환
- 카카오 장소 API 장소 매칭 실패 시 → 사용자에게 수동 입력 UI 제공
- 모든 외부 API 호출에 타임아웃 설정 (기본 5초, OpenAI는 15초)
- 지도 범위 조회 시 페이지네이션 또는 최대 결과 수 제한 (무한 로딩 방지)
- LLM 응답 파싱 실패 시 → `REVIEW_REQUIRED` + 빈 candidates로 graceful fallback
- LLM이 추출한 searchQueries를 순서대로 Kakao에 시도 (첫 매칭 사용)

---

## API 설계 원칙

```
POST   /api/links/extract          # URL → 장소 정보 추출
POST   /api/saved-places           # 장소 저장
GET    /api/saved-places?bbox=...  # 지도 범위 조회
GET    /api/saved-places/{id}      # 상세 조회
PATCH  /api/saved-places/{id}      # 수정 (memo, visitStatus, category)
DELETE /api/saved-places/{id}      # 삭제

GET    /api/categories             # 카테고리 목록
POST   /api/categories             # 카테고리 생성
PUT    /api/categories/{id}        # 카테고리 수정
DELETE /api/categories/{id}        # 카테고리 삭제

POST   /api/auth/signup            # 이메일 회원가입
POST   /api/auth/login             # 이메일 로그인
POST   /api/auth/kakao             # 카카오 OAuth 콜백
```

---

## 테스트 방법

```bash
# 로컬 실행
./gradlew bootRun

# 테스트 실행
./gradlew test

# 빌드 확인
./gradlew build
```

---

## 환경변수

| 변수명 | 설명 | 어디서 발급 |
|--------|------|------------|
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 | developers.kakao.com |
| `KAKAO_CLIENT_SECRET` | 카카오 OAuth 클라이언트 시크릿 | developers.kakao.com |
| `JWT_SECRET` | JWT 서명 키 (32자 이상 랜덤 문자열) | 직접 생성 |
| `DB_URL` | 데이터베이스 URL | 로컬/클라우드 DB |
| `DB_USERNAME` | DB 사용자명 | DB 설정 |
| `DB_PASSWORD` | DB 비밀번호 | DB 설정 |
| `OPENAI_API_KEY` | OpenAI API 키 (장소 추출 LLM용) | platform.openai.com |

> `application.yaml`에서 `${KAKAO_REST_API_KEY}` 방식으로 참조.
> 절대 GitHub에 올리지 마세요 — `.gitignore`에 `application-secret.yaml` 추가

---

## [NEEDS CLARIFICATION]

- [ ] 카카오 장소 API 장소 매칭 실패 시 사용자 수동 입력 UI 구현 여부 (MVP 포함 vs Phase 2)
- [ ] JWT 토큰 만료 시간 설정 (기본값: access 1시간, refresh 7일)
- [ ] 배포 서버 선택 (AWS EC2 t2.micro vs Railway 무료 티어)
