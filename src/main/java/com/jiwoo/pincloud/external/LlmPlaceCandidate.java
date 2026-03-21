package com.jiwoo.pincloud.external;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LlmPlaceCandidate {

  /** LLM이 추출한 원문 장소명 (예: "스탠다드브레드 성수") */
  private String rawName;

  /** 지역 힌트 제거한 정규화 이름 (예: "스탠다드브레드") */
  private String normalizedName;

  /** 지역 힌트 (예: "성수", "홍대") */
  private String regionHint;

  /** 카테고리 힌트 (예: "카페", "맛집", "전시") */
  private String categoryHint;

  /** Kakao 검색에 사용할 쿼리 목록 (우선순위 순) */
  private List<String> searchQueries;
}
