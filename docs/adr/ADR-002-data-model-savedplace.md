# ADR-002: 장소 데이터 모델 — SavedPlace 단일 테이블 vs Place/SavedPlace 2층 구조

- 날짜: 2026-03-18
- 상태: 결정됨 (Phase 3에서 재검토)

---

## 배경

장소 데이터를 어떻게 모델링할지 결정이 필요했다.
핵심 질문: "블루보틀 성수"를 여러 사용자가 저장할 때, 장소 마스터 데이터를 공유할 것인가?

두 사용자가 같은 카페를 저장하면:
- **단일 테이블**: 각각 독립 레코드 (중복 데이터)
- **2층 구조**: 공통 `Place` + 사용자별 `SavedPlace` 분리

---

## 결정사항

**MVP(Phase 1)에서는 `SavedPlace` 단일 테이블**을 사용한다.

```
SavedPlace: id, userId, categoryId, name, address, latitude, longitude,
            memo(TEXT), visitStatus(ENUM), createdAt, updatedAt
```

- 장소 마스터 테이블(`Place`) 없이 `SavedPlace`가 모든 장소 정보를 포함
- 각 사용자의 저장 레코드가 완전히 독립적
- Phase 3에서 `Place` + `SavedPlace` 2층 구조로 마이그레이션 예정

---

## 대안

### A. Place + SavedPlace 2층 구조 (Phase 3 목표)
```
Place: id, name, address, latitude, longitude, kakaoPlaceId
SavedPlace: id, userId, placeId(FK), categoryId, memo, visitStatus
```
- 장점: 같은 장소 중복 제거, 통계/공유 기능 구현 용이
- 단점: 설계·구현 복잡도 증가, MVP에서 과도한 선투자
- 단점: Place 마스터 데이터 신뢰성 관리 필요 (카카오 API 변경 시 동기화)

### B. 단순 단일 테이블 + kakaoPlaceId 컬럼 추가
- 장점: MVP 구현 단순 + Phase 3 마이그레이션 비용 절감
- 단점: 아직 kakaoPlaceId 활용 기능 없음 → 데드 컬럼 위험

---

## 결과

### 긍정적
- 구현 단순, 도메인 복잡도 낮음
- 사용자 데이터 완전 독립 — 다른 사용자 데이터 의도치 않은 노출 없음
- Phase 1 기능에 충분

### 부정적
- 동일 장소를 N명이 저장하면 동일 name/address/좌표 N개 중복 저장
- Phase 3 마이그레이션 시 데이터 정합성 작업 필요
- 주변 장소 공유·통계 기능(Phase 3) 구현 전 재설계 필요

### 중립적
- Phase 3 마이그레이션 비용을 낮추기 위해 `kakaoPlaceId` 컬럼 조기 추가 검토 가능
- 좌표 타입은 현재 `Double` — 트래픽 증가 시 PostGIS 지리 타입으로 전환 고려
