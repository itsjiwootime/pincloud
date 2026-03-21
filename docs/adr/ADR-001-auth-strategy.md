# ADR-001: 인증 전략 — JWT + 카카오 OAuth 2.0 이중 방식

- 날짜: 2026-03-18
- 상태: 결정됨

---

## 배경

LinkMap은 개인 장소 저장 앱이므로 사용자별 데이터 격리가 필수다.
두 가지 가입 경로를 지원해야 한다:
1. 이메일/비밀번호 (직접 가입)
2. 카카오 소셜 로그인 (국내 사용자 주력 채널)

서버가 단일 인스턴스 구조(MVP)이지만, 향후 수평 확장 가능성을 열어둬야 한다.

---

## 결정사항

**Spring Security + JWT (Stateless) + 카카오 OAuth 2.0 콜백**을 채택한다.

- 이메일 로그인: BCrypt 암호화된 비밀번호 검증 후 JWT(Access + Refresh) 발급
- 카카오 로그인: 인가 코드 → 카카오 토큰 교환 → 유저 정보 조회 → 내부 JWT 발급
- 모든 인증 요청은 `Authorization: Bearer {accessToken}` 헤더로 처리
- `SecurityContext`에 `userId(Long)` 저장하여 컨트롤러에서 꺼내 씀
- Access Token: 1시간, Refresh Token: 7일 (환경변수로 조정 가능)

---

## 대안

### A. Session 기반 인증 (Spring Security 기본)
- 장점: 구현 단순, 강제 로그아웃 즉시 가능
- 단점: 서버 메모리에 세션 저장 → 수평 확장 시 세션 공유 문제 발생, Redis 추가 필요

### B. Spring Security OAuth2 Login (자동 처리)
- 장점: 카카오 OAuth 흐름 자동화, 코드량 감소
- 단점: JWT 발급 흐름과 통합하기 복잡, 커스텀 유저 매핑 제어가 어려움

### C. Auth0 / Firebase Auth 같은 외부 인증 서비스
- 장점: 보안 인프라 아웃소싱, 소셜 로그인 다수 지원
- 단점: 외부 의존성 증가, 포트폴리오용 Java 역량 증명에 불리, 비용 발생 가능

---

## 결과

### 긍정적
- Stateless JWT로 서버 확장 시 별도 세션 저장소 불필요
- 카카오 / 이메일 두 경로를 내부 JWT로 통일하여 API 인증 로직 단순화
- JWT 시크릿 환경변수화로 보안 사고 방지

### 부정적
- Access Token 즉시 무효화(강제 로그아웃) 불가 — 만료까지 유효
- Refresh Token 탈취 시 대응을 위한 토큰 블랙리스트 로직 미구현 (MVP 이후 과제)
- 카카오 OAuth redirect_uri를 환경마다 맞춰야 하는 배포 번거로움

### 중립적
- Refresh Token 갱신 로직은 Phase 2에서 구현 예정
- User.password 컬럼은 카카오 전용 유저는 null — nullable 허용으로 처리
