package com.jiwoo.pincloud.external;

import lombok.Builder;
import lombok.Getter;

/** LLM 추출 + Kakao 매칭이 완료된 최종 장소 후보 */
@Getter
@Builder
public class PlaceCandidate {

  // LLM 추출 정보
  private String rawName;
  private String normalizedName;
  private String regionHint;
  private String categoryHint;

  // Kakao 매칭 결과
  private boolean kakaoMatched;
  private String matchedName;
  private String roadAddress;
  private String address;
  private Double latitude;
  private Double longitude;
  private String kakaoCategory;
}
