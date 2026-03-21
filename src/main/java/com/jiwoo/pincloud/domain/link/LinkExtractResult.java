package com.jiwoo.pincloud.domain.link;

import com.jiwoo.pincloud.external.PlaceCandidate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LinkExtractResult {

  private Platform platform;
  private String originalUrl;
  private String title;
  private String thumbnailUrl;

  /** SINGLE_PLACE / MULTI_PLACE / REVIEW_REQUIRED */
  private ContentType contentType;

  /** LLM이 추출하고 Kakao로 검증한 장소 후보 목록 (확신도 순) */
  private List<PlaceCandidate> topCandidates;

  public boolean hasCandidates() {
    return topCandidates != null && !topCandidates.isEmpty();
  }
}
