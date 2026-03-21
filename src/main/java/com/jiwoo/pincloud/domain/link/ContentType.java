package com.jiwoo.pincloud.domain.link;

public enum ContentType {
  /** 단일 장소 리뷰/방문기 — 장소 1개로 자동 확정 */
  SINGLE_PLACE,

  /** 여러 장소를 소개하는 리스트형 콘텐츠 */
  MULTI_PLACE,

  /** 확신이 낮아 사용자 확인이 필요한 경우 */
  REVIEW_REQUIRED
}
