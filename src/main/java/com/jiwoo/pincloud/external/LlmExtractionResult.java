package com.jiwoo.pincloud.external;

import com.jiwoo.pincloud.domain.link.ContentType;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LlmExtractionResult {

  private ContentType contentType;
  private List<LlmPlaceCandidate> candidates;

  public boolean hasCandidates() {
    return candidates != null && !candidates.isEmpty();
  }
}
