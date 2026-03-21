package com.jiwoo.pincloud.domain.link;

import com.jiwoo.pincloud.external.KakaoPlaceClient;
import com.jiwoo.pincloud.external.KakaoPlaceResult;
import com.jiwoo.pincloud.external.LlmExtractionResult;
import com.jiwoo.pincloud.external.LlmPlaceCandidate;
import com.jiwoo.pincloud.external.OgTagExtractor;
import com.jiwoo.pincloud.external.OgTagResult;
import com.jiwoo.pincloud.external.OpenAiClient;
import com.jiwoo.pincloud.external.PlaceCandidate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class LinkExtractService {

  private final KakaoPlaceClient kakaoPlaceClient;
  private final OgTagExtractor ogTagExtractor;
  private final OpenAiClient openAiClient;

  public LinkExtractResult extract(String url) {
    if (!StringUtils.hasText(url)) {
      throw new IllegalArgumentException("URL must not be blank");
    }

    String trimmedUrl = url.trim();
    Platform platform = Platform.detect(trimmedUrl);

    // 1. 콘텐츠 수집 (OG 태그)
    OgTagResult ogTag = ogTagExtractor.extract(trimmedUrl);
    String title = ogTag.getTitle();
    String description = ogTag.getDescription();

    // 2. LLM으로 장소 후보 추출 + 콘텐츠 분류
    LlmExtractionResult llmResult = openAiClient.extractPlaces(title, description);
    log.info(
        "LLM extraction: contentType={}, candidates={}",
        llmResult.getContentType(),
        llmResult.getCandidates().size());

    // 3. 후보별 Kakao 장소 매칭
    List<PlaceCandidate> topCandidates = matchCandidates(llmResult.getCandidates());

    return LinkExtractResult.builder()
        .platform(platform)
        .originalUrl(trimmedUrl)
        .title(title)
        .thumbnailUrl(ogTag.getThumbnailUrl())
        .contentType(llmResult.getContentType())
        .topCandidates(topCandidates)
        .build();
  }

  private List<PlaceCandidate> matchCandidates(List<LlmPlaceCandidate> llmCandidates) {
    List<PlaceCandidate> results = new ArrayList<>();

    for (LlmPlaceCandidate candidate : llmCandidates) {
      KakaoPlaceResult kakaoResult = searchKakao(candidate);

      if (kakaoResult != null) {
        results.add(
            PlaceCandidate.builder()
                .rawName(candidate.getRawName())
                .normalizedName(candidate.getNormalizedName())
                .regionHint(candidate.getRegionHint())
                .categoryHint(candidate.getCategoryHint())
                .kakaoMatched(true)
                .matchedName(kakaoResult.getName())
                .roadAddress(kakaoResult.getAddress())
                .address(kakaoResult.getAddress())
                .latitude(kakaoResult.getLatitude())
                .longitude(kakaoResult.getLongitude())
                .kakaoCategory(kakaoResult.getCategory())
                .build());
      } else {
        // Kakao 미매칭 — 후보는 살리되 좌표 없이 반환
        results.add(
            PlaceCandidate.builder()
                .rawName(candidate.getRawName())
                .normalizedName(candidate.getNormalizedName())
                .regionHint(candidate.getRegionHint())
                .categoryHint(candidate.getCategoryHint())
                .kakaoMatched(false)
                .build());
      }
    }

    return results;
  }

  /** LLM이 생성한 searchQueries를 순서대로 시도하여 첫 번째 매칭 반환 */
  private KakaoPlaceResult searchKakao(LlmPlaceCandidate candidate) {
    for (String query : candidate.getSearchQueries()) {
      KakaoPlaceResult result = kakaoPlaceClient.searchPlace(query);
      if (result != null) {
        log.debug("Kakao matched '{}' with query '{}'", candidate.getRawName(), query);
        return result;
      }
    }
    log.debug("Kakao no match for '{}'", candidate.getRawName());
    return null;
  }
}
