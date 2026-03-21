# LinkMap — 데이터 모델

> 이 문서는 앱에서 다루는 핵심 데이터의 구조를 정의합니다.

---

## 전체 구조

```
User
 ├── 1:N → Category  (사용자 정의 카테고리)
 └── 1:N → SavedPlace (저장한 장소)
               ├── N:1 → Category
               └── 1:1 → SourceLink (출처 링크, 향후 1:N 확장 가능)
```

---

## 엔티티 상세

### User
"이 앱을 쓰는 사람"

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동 생성) | 1 | O |
| email | 로그인 이메일 | jiwoo@naver.com | O |
| nickname | 앱에서 표시되는 이름 | jiwoo | O |
| createdAt | 가입일 (자동) | 2026-03-17 | O |
| updatedAt | 마지막 수정일 (자동) | 2026-03-17 | O |

---

### Category
"사용자가 직접 만드는 분류 태그" (예: 카페, 맛집, 전시)

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 | 1 | O |
| userId | 이 카테고리를 만든 사용자 | 1 | O |
| name | 카테고리 이름 | 카페 | O |
| colorCode | 지도 핀 색상 | #FF6B6B | O |
| createdAt | 생성일 (자동) | 2026-03-17 | O |
| updatedAt | 수정일 (자동) | 2026-03-17 | O |

> **제약**: `(userId, name)` 조합은 유일해야 함 (같은 사용자가 같은 이름의 카테고리를 중복 생성 불가)

---

### SavedPlace
"사용자가 저장한 장소 레코드"
— 장소 자체의 마스터 데이터가 아닌, **사용자 개인의 저장 맥락을 포함한 레코드**

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 | 1 | O |
| userId | 저장한 사용자 | 1 | O |
| categoryId | 분류 카테고리 (미분류 허용) | 1 | X |
| name | 장소 이름 | 블루보틀 성수 | O |
| address | 주소 | 서울 성동구 아차산로 | O |
| latitude | 위도 (Double) | 37.5447 | O |
| longitude | 경도 (Double) | 127.0559 | O |
| memo | 저장 이유 / 메모 (TEXT) | 유튜브에서 봤는데 분위기 좋아 보임 | X |
| visitStatus | 방문 상태 | WANT / VISITED | O |
| createdAt | 저장일 (자동) | 2026-03-17 | O |
| updatedAt | 수정일 (자동) | 2026-03-17 | O |

> **visitStatus 기본값**: `WANT` (저장하는 순간 대부분 "가보고 싶음")
> **좌표 타입**: MVP에서는 Double 사용. 조회 트래픽이 늘면 인덱스 또는 지리 타입(PostGIS 등) 고려

---

### SourceLink
"장소를 저장하게 된 출처 링크"

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 | 1 | O |
| savedPlaceId | 연결된 저장 장소 | 1 | O |
| originalUrl | 원본 URL | https://www.instagram.com/p/xxx | O |
| platform | 플랫폼 구분 | INSTAGRAM / YOUTUBE / BLOG / OTHER | O |
| title | 오픈 그래프 제목 | 성수 블루보틀 방문기 | X |
| thumbnailUrl | 대표 이미지 URL | https://... | X |
| createdAt | 생성일 (자동) | 2026-03-17 | O |

> **확장 가능성**: MVP에서는 SavedPlace와 1:1. 향후 동일 장소에 여러 출처를 붙일 수 있도록 1:N 구조로 마이그레이션 예정

---

## 관계 요약

- User 1명이 여러 개의 Category를 가질 수 있음
- User 1명이 여러 개의 SavedPlace를 가질 수 있음
- SavedPlace는 Category 1개를 참조 (없어도 됨)
- SavedPlace는 SourceLink 1개를 가짐 (향후 여러 개로 확장 가능)

---

## 확장 구조 (Phase 3 고려)

Phase 3에서 동일 장소를 여러 사용자가 저장하는 경우 중복을 줄이기 위해 아래 2층 구조 도입 예정:

```
Place (실제 장소 마스터)
 - id, name, address, latitude, longitude, kakaoPlaceId

SavedPlace (사용자 저장 레코드)
 - userId, placeId(FK), categoryId, memo, visitStatus, ...
```

---

## [NEEDS CLARIFICATION]

- [ ] 카카오 장소 API의 `kakaoPlaceId`를 MVP부터 저장해둘지 여부 (Phase 3 마이그레이션 비용 절감 가능)
- [ ] `memo` 필드의 최대 길이 제한 (DB TEXT vs VARCHAR 선택)
