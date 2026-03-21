package com.jiwoo.pincloud.external;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OgTagResult {

  private String title;
  private String description;
  private String thumbnailUrl;
}
