package com.jiwoo.pincloud.external;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoPlaceResult {

  private String name;
  private String address;
  private Double latitude;
  private Double longitude;
  private String category;
}
