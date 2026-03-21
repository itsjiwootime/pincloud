package com.jiwoo.pincloud.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiwoo.pincloud.domain.link.ContentType;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
public class OpenAiClient {

  private static final String SYSTEM_PROMPT =
      """
      당신은 SNS/유튜브/블로그 링크에서 방문할 장소 정보를 추출하는 전문가입니다.

      주어진 콘텐츠(제목, 설명)를 분석하여 다음을 반환하세요:

      1. contentType: 콘텐츠 유형
         - SINGLE_PLACE: 단일 장소 방문기/리뷰 (예: "블루보틀 성수 방문기")
         - MULTI_PLACE: 여러 장소를 소개하는 리스트형 (예: "성수 카페 5곳 추천")
         - REVIEW_REQUIRED: 판단하기 어려운 경우

      2. candidates: 장소 후보 목록 (최대 5개, 확신도 높은 순)
         - rawName: 콘텐츠에서 추출한 원문 장소명
         - normalizedName: 지역명 제거한 정규화 이름
         - regionHint: 지역 힌트 (없으면 빈 문자열)
         - categoryHint: 카테고리 힌트 (카페/맛집/전시/술집/기타, 없으면 빈 문자열)
         - searchQueries: Kakao 검색용 쿼리 목록 (다양한 변형, 우선순위 순)
           예: ["블루보틀 성수", "블루보틀 성수점", "블루보틀"]

      규칙:
      - 메뉴명, 브랜드 제품명, 일반 단어는 candidates에 포함하지 마세요
      - 장소명이 확실하지 않으면 candidates를 비워두세요
      - searchQueries는 반드시 1개 이상 포함하세요
      """;

  private static final String RESPONSE_SCHEMA =
      """
      {
        "type": "object",
        "properties": {
          "contentType": {
            "type": "string",
            "enum": ["SINGLE_PLACE", "MULTI_PLACE", "REVIEW_REQUIRED"]
          },
          "candidates": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "rawName":        { "type": "string" },
                "normalizedName": { "type": "string" },
                "regionHint":     { "type": "string" },
                "categoryHint":   { "type": "string" },
                "searchQueries":  { "type": "array", "items": { "type": "string" } }
              },
              "required": ["rawName", "normalizedName", "regionHint", "categoryHint", "searchQueries"],
              "additionalProperties": false
            }
          }
        },
        "required": ["contentType", "candidates"],
        "additionalProperties": false
      }
      """;

  private final WebClient webClient;
  private final String model;
  private final ObjectMapper objectMapper;

  public OpenAiClient(
      @Value("${openai.api-key}") String apiKey,
      @Value("${openai.base-url}") String baseUrl,
      @Value("${openai.model}") String model,
      ObjectMapper objectMapper) {
    this.model = model;
    this.objectMapper = objectMapper.copy();
    this.webClient =
        WebClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
  }

  public LlmExtractionResult extractPlaces(String title, String description) {
    String userContent = buildUserContent(title, description);

    Map<String, Object> requestBody =
        Map.of(
            "model",
            model,
            "messages",
            List.of(
                Map.of("role", "system", "content", SYSTEM_PROMPT),
                Map.of("role", "user", "content", userContent)),
            "response_format",
            Map.of(
                "type",
                "json_schema",
                "json_schema",
                Map.of("name", "place_extraction_result", "strict", true, "schema", parseSchema())),
            "temperature",
            0.1);

    try {
      JsonNode response =
          webClient
              .post()
              .uri("/chat/completions")
              .bodyValue(requestBody)
              .retrieve()
              .bodyToMono(JsonNode.class)
              .timeout(Duration.ofSeconds(15))
              .block();

      if (response == null) {
        log.warn("OpenAI returned null response for title: {}", title);
        return emptyResult();
      }

      String content = response.path("choices").get(0).path("message").path("content").asText();
      return parseResult(content);

    } catch (Exception e) {
      log.error("OpenAI extraction failed for title '{}': {}", title, e.getMessage());
      return emptyResult();
    }
  }

  private String buildUserContent(String title, String description) {
    StringBuilder sb = new StringBuilder();
    if (title != null && !title.isBlank()) {
      sb.append("제목: ").append(title).append("\n");
    }
    if (description != null && !description.isBlank()) {
      // 토큰 절약: 설명은 500자로 제한
      String desc =
          description.length() > 500 ? description.substring(0, 500) + "..." : description;
      sb.append("설명: ").append(desc);
    }
    return sb.toString();
  }

  private LlmExtractionResult parseResult(String json) {
    try {
      JsonNode root = objectMapper.readTree(json);
      ContentType contentType =
          ContentType.valueOf(root.path("contentType").asText("REVIEW_REQUIRED"));

      List<LlmPlaceCandidate> candidates = new ArrayList<>();
      JsonNode candidatesNode = root.path("candidates");
      if (candidatesNode.isArray()) {
        for (JsonNode c : candidatesNode) {
          List<String> queries = new ArrayList<>();
          c.path("searchQueries").forEach(q -> queries.add(q.asText()));

          candidates.add(
              LlmPlaceCandidate.builder()
                  .rawName(c.path("rawName").asText())
                  .normalizedName(c.path("normalizedName").asText())
                  .regionHint(c.path("regionHint").asText(""))
                  .categoryHint(c.path("categoryHint").asText(""))
                  .searchQueries(queries)
                  .build());
        }
      }

      return LlmExtractionResult.builder().contentType(contentType).candidates(candidates).build();

    } catch (Exception e) {
      log.error("Failed to parse LLM response: {}", e.getMessage());
      return emptyResult();
    }
  }

  private Object parseSchema() {
    try {
      return objectMapper.readValue(RESPONSE_SCHEMA, Object.class);
    } catch (Exception e) {
      throw new IllegalStateException("Invalid response schema", e);
    }
  }

  private LlmExtractionResult emptyResult() {
    return LlmExtractionResult.builder()
        .contentType(ContentType.REVIEW_REQUIRED)
        .candidates(List.of())
        .build();
  }
}
