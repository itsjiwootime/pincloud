# Architecture Decision Records (ADR)

LinkMap 개발 과정에서 내려진 주요 기술적 결정들을 기록합니다.

## 형식

각 ADR은 다음 구조를 따릅니다:
- **배경**: 어떤 기술적 문제 또는 선택이 필요했는지
- **결정사항**: 어떤 결정을 내렸고 그 이유는 무엇인지
- **대안**: 고려한 다른 선택지와 각각의 장단점
- **결과**: 긍정적·부정적·중립적 트레이드오프

## 목록

| ADR | 제목 | 상태 |
|-----|------|------|
| [ADR-001](./ADR-001-auth-strategy.md) | 인증 전략 — JWT + 카카오 OAuth 2.0 이중 방식 | 결정됨 |
| [ADR-002](./ADR-002-data-model-savedplace.md) | 장소 데이터 모델 — SavedPlace 단일 테이블 vs 2층 구조 | 결정됨 (Phase 3 재검토) |
| [ADR-003](./ADR-003-sourcelink-table.md) | SourceLink — 별도 테이블 유지 (인라인 금지) | 결정됨 |
| [ADR-004](./ADR-004-link-extraction.md) | 링크 정보 추출 — OG 태그 파싱 + 카카오 장소 API 매칭 | 결정됨 |
| [ADR-005](./ADR-005-external-api-client.md) | 외부 API 클라이언트 — WebClient (동기 블로킹) | 결정됨 |
| [ADR-006](./ADR-006-category-uniqueness.md) | 카테고리 유일성 — DB 제약 + 서비스 레이어 이중 검증 | 결정됨 |
| [ADR-007](./ADR-007-place-extraction-llm.md) | 장소 추출 전략 — LLM 단독 방식 | 결정됨 (구현 예정) |

## 상태 정의

- **결정됨**: 현재 적용 중
- **결정됨 (Phase N 재검토)**: 현재 적용 중이나 향후 변경 예정
- **폐기됨**: 더 이상 유효하지 않은 결정
