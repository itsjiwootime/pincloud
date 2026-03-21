# LinkMap — 디자인 문서

> Show Me The PRD로 생성됨 (2026-03-17)

## 문서 구성

| 문서 | 내용 | 언제 읽나 |
|------|------|----------|
| [01_PRD.md](./01_PRD.md) | 뭘 만드는지, 누가 쓰는지, 핵심 기능 | 프로젝트 시작 전 |
| [02_DATA_MODEL.md](./02_DATA_MODEL.md) | 데이터 구조 (User, SavedPlace, Category, SourceLink) | DB 설계할 때 |
| [03_PHASES.md](./03_PHASES.md) | 단계별 개발 계획 (Phase 1~3) | 개발 순서 정할 때 |
| [04_PROJECT_SPEC.md](./04_PROJECT_SPEC.md) | 기술 스택·AI 규칙·환경변수 | AI에게 코드 시킬 때마다 |

## 한 줄 요약

**LinkMap** — 인스타그램·유튜브·블로그 링크를 붙여넣으면 장소를 자동 저장하고, 카카오맵 위에서 다시 탐색할 수 있는 일상형 장소 저장 앱

## 기술 스택 요약

| 영역 | 선택 |
|------|------|
| 백엔드 | Java 17 + Spring Boot 3 |
| 모바일 | React Native + Expo |
| 지도 | Kakao Maps API |
| 인증 | 카카오 OAuth + 이메일/비밀번호 |

## 다음 단계

Phase 1을 시작하려면 [03_PHASES.md](./03_PHASES.md)의 **"Phase 1 시작 프롬프트"** 를 복사해서 AI에게 공유하세요.

## 미결 사항 (NEEDS CLARIFICATION)

- [ ] 카카오 장소 API 매칭 실패 시 수동 입력 UI 여부
- [ ] 지원할 블로그 플랫폼 범위 (네이버 블로그, 티스토리, 브런치)
- [ ] 앱 배포 플랫폼 (Android 먼저 vs iOS 동시)
- [ ] JWT 토큰 만료 시간 설정
- [ ] 배포 서버 선택 (AWS EC2 vs Railway)
- [ ] `kakaoPlaceId`를 MVP부터 저장해둘지 여부
