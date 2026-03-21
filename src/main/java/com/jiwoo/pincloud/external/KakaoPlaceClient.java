package com.jiwoo.pincloud.external;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class KakaoPlaceClient {

    private final WebClient webClient;
    private final String restApiKey;

    public KakaoPlaceClient(
            @Value("${kakao.rest-api-key}") String restApiKey,
            @Value("${kakao.place-search-url}") String placeSearchUrl
    ) {
        this.restApiKey = restApiKey;
        this.webClient = WebClient.builder()
                .baseUrl(placeSearchUrl)
                .build();
    }

    public KakaoPlaceResult searchPlace(String query) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("query", query)
                            .queryParam("size", 1)
                            .build())
                    .header("Authorization", "KakaoAK " + restApiKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (response == null) {
                return null;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> documents = (List<Map<String, Object>>) response.get("documents");
            if (documents == null || documents.isEmpty()) {
                return null;
            }

            Map<String, Object> place = documents.get(0);
            return KakaoPlaceResult.builder()
                    .name((String) place.get("place_name"))
                    .address(resolveAddress(place))
                    .latitude(Double.parseDouble((String) place.getOrDefault("y", "0")))
                    .longitude(Double.parseDouble((String) place.getOrDefault("x", "0")))
                    .category((String) place.get("category_name"))
                    .build();
        } catch (Exception e) {
            log.error("Kakao place search failed: {}", e.getMessage());
            return null;
        }
    }

    private String resolveAddress(Map<String, Object> place) {
        Object roadAddress = place.get("road_address_name");
        if (roadAddress instanceof String value && !value.isBlank()) {
            return value;
        }
        return (String) place.get("address_name");
    }
}
