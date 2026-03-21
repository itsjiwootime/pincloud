# ADR-005: 외부 API 클라이언트 — WebClient (Reactive) vs RestTemplate

- 날짜: 2026-03-18
- 상태: 결정됨

---

## 배경

카카오 장소 검색 API, 카카오 OAuth 토큰 교환, 카카오 유저 정보 조회 등
여러 외부 HTTP 호출이 필요하다.

Spring Boot 3에서 HTTP 클라이언트 선택지가 여러 개 존재하며,
타임아웃 설정과 유지보수성을 기준으로 선택해야 한다.

---

## 결정사항

**Spring WebClient** (spring-boot-starter-webflux 포함)를 채택하되,
비동기가 아닌 **동기 블로킹 방식** (`.block()`)으로 사용한다.

```java
webClient.get()
    .uri(...)
    .retrieve()
    .bodyToMono(Map.class)
    .timeout(Duration.ofSeconds(5))
    .block();
```

- 모든 외부 API 호출에 `Duration.ofSeconds(5)` 타임아웃 적용
- 현재 서버 아키텍처는 동기(Servlet) 기반이므로 `.block()` 허용

---

## 대안

### A. RestTemplate (레거시)
- 장점: 구현 단순, Spring MVC와 자연스러운 통합
- 단점: Spring 5부터 maintenance 모드, Spring Boot 3에서 공식 비권장
- 단점: 타임아웃 설정이 상대적으로 번거로움

### B. OpenFeign (Spring Cloud OpenFeign)
- 장점: 선언적 인터페이스로 코드 간결
- 단점: Spring Cloud 의존성 추가, 단순 외부 API 2-3개에 과한 설정

### C. HttpClient (Java 11+)
- 장점: 외부 라이브러리 불필요
- 단점: Spring 생태계와의 통합 약함, 에러 처리 번거로움

---

## 결과

### 긍정적
- Spring Boot 3 공식 권장 클라이언트
- `.timeout()` 체이닝으로 타임아웃 설정 간결
- 향후 비동기 아키텍처 전환 시 `.block()` 제거로 논블로킹 전환 가능

### 부정적
- Webflux 의존성 추가로 빌드 사이즈 소폭 증가
- `.block()` 사용은 리액티브 스택에서 안티패턴 — 동기 컨텍스트에서만 허용

### 중립적
- 외부 API 응답이 null인 경우 서비스 레이어에서 명시적으로 처리
- 카카오 API 장소 미매칭 시 `kakaoMatchFound = false`로 프론트에 알림
