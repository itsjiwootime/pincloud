# ADR-006: 카테고리 유일성 — DB 제약 + 서비스 레이어 이중 검증

- 날짜: 2026-03-18
- 상태: 결정됨

---

## 배경

사용자가 "카페"라는 카테고리를 실수로 중복 생성하면 혼란이 생긴다.
같은 사용자가 동일한 이름의 카테고리를 만들 수 없어야 한다.
단, 다른 사용자는 같은 이름을 사용할 수 있다.

---

## 결정사항

**(userId, name) 복합 유일 제약을 DB + 서비스 레이어 두 곳에 모두 적용**한다.

```java
// 엔티티 레벨 (DB 제약)
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "name"}))

// 서비스 레이어 (사용자 친화적 에러 메시지)
if (categoryRepository.existsByUserIdAndName(userId, name)) {
    throw new IllegalArgumentException("이미 같은 이름의 카테고리가 있습니다");
}
```

---

## 대안

### A. DB 제약만 사용
- 장점: 구현 단순
- 단점: DB `DataIntegrityViolationException` 원문이 사용자에게 노출될 수 있음
- 단점: 에러 처리를 GlobalExceptionHandler에서 별도로 처리해야 함

### B. 서비스 레이어만 검증
- 장점: 코드로 제어, 에러 메시지 명확
- 단점: 동시 요청 시 Race Condition으로 중복 삽입 가능

---

## 결과

### 긍정적
- DB 제약: 동시성 문제(Race Condition)에서 최후 방어선 역할
- 서비스 검증: 사용자에게 명확한 한국어 에러 메시지 제공
- 두 계층 모두 방어 → 안전성 + UX 동시 확보

### 부정적
- 로직 중복처럼 보일 수 있음 (실제로는 역할이 다름)
- DB 쿼리 1회 추가 (`existsByUserIdAndName`)

### 중립적
- 카테고리 수정 시에도 동일 검증 적용 (다른 카테고리의 이름과 충돌 검사)
- 대소문자 구분은 DB collation 설정에 따라 달라짐 (기본 utf8mb4_unicode_ci → 대소문자 무시)
