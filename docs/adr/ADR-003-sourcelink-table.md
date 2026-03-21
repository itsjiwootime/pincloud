# ADR-003: SourceLink — 별도 테이블 유지 (인라인 컬럼 금지)

- 날짜: 2026-03-18
- 상태: 결정됨

---

## 배경

링크 저장 앱의 핵심 데이터는 "어떤 URL에서 이 장소를 발견했는가"다.
이 출처 정보(URL, 플랫폼, 썸네일)를 어디에 저장할지 결정이 필요했다.

현재 MVP는 SavedPlace : SourceLink = 1:1이지만,
Phase 3에서는 한 장소에 여러 출처를 붙일 수 있는 1:N 구조가 목표다.

---

## 결정사항

**SourceLink를 별도 테이블로 분리**하고, `SavedPlace`에 직접 인라인하지 않는다.

```
source_links: id, saved_place_id(FK), original_url, platform(ENUM),
              title, thumbnail_url, created_at
```

- MVP에서는 `SavedPlace : SourceLink = 1:1`
- 관계: `SourceLink.savedPlaceId` (FK) → `SavedPlace.id`
- `platform` 필드: `INSTAGRAM / YOUTUBE / BLOG / OTHER` Enum

---

## 대안

### A. SavedPlace에 컬럼으로 인라인
```
saved_places: ... , original_url, platform, thumbnail_url
```
- 장점: 쿼리 JOIN 불필요, 구현 단순
- 단점: 1:N 확장 불가능 — 컬럼을 배열로 바꾸거나 테이블 재설계 필요
- 단점: "출처"라는 개념이 장소 레코드에 묻혀 도메인 의미 불명확

### B. SourceLink를 Embedded Value로 처리 (JPA @Embedded)
- 장점: 별도 테이블 없이 OOP적으로 분리
- 단점: 결국 같은 테이블에 저장 → 1:N 확장 불가

---

## 결과

### 긍정적
- Phase 3에서 1:N 확장 시 SourceLink 테이블 구조 변경 없이 FK만 추가
- "출처 링크"라는 도메인 개념을 코드 수준에서 명확히 표현
- 향후 동일 장소에 인스타그램 + 유튜브 출처를 동시에 기록 가능

### 부정적
- 장소 상세 조회 시 JOIN 필요 (성능 영향 미미, 인덱스로 해결)
- 현재 1:1이지만 별도 테이블이므로 약간의 구조 복잡도 증가

### 중립적
- MVP에서 1:1이므로 `OneToOne` → Phase 3에서 `OneToMany`로 변경 예정
- `platform` Enum으로 타입 안전성 확보 (String 직접 저장 금지)
