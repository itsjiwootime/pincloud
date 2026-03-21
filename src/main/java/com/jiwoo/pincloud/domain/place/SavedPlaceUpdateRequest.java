package com.jiwoo.pincloud.domain.place;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SavedPlaceUpdateRequest {

  private Long categoryId;

  private String memo;

  private VisitStatus visitStatus;
}
