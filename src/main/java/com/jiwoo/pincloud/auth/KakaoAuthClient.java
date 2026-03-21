package com.jiwoo.pincloud.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
public class KakaoAuthClient {

    private final WebClient tokenClient;
    private final WebClient userInfoClient;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public KakaoAuthClient(
            @Value("${spring.security.oauth2.client.registration.kakao.client-id}") String clientId,
            @Value("${spring.security.oauth2.client.registration.kakao.client-secret}") String clientSecret,
            @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}") String redirectUri
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.tokenClient = WebClient.builder()
                .baseUrl("https://kauth.kakao.com")
                .build();
        this.userInfoClient = WebClient.builder()
                .baseUrl("https://kapi.kakao.com")
                .build();
    }

    public String getAccessToken(String code) {
        LinkedMultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", clientId);
        formData.add("redirect_uri", redirectUri);
        formData.add("code", code);
        if (StringUtils.hasText(clientSecret)) {
            formData.add("client_secret", clientSecret);
        }

        try {
            Map<String, Object> response = tokenClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            return response != null ? (String) response.get("access_token") : null;
        } catch (WebClientResponseException e) {
            log.warn("Failed to get Kakao access token: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return null;
        } catch (RuntimeException e) {
            log.warn("Failed to get Kakao access token", e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public KakaoUserInfo getUserInfo(String accessToken) {
        try {
            Map<String, Object> response = userInfoClient.get()
                    .uri("/v2/user/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (response == null) {
                return null;
            }

            String kakaoId = String.valueOf(response.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) response.get("kakao_account");
            Map<String, Object> profile = kakaoAccount != null
                    ? (Map<String, Object>) kakaoAccount.get("profile")
                    : null;

            String nickname = profile != null ? (String) profile.get("nickname") : "사용자";
            String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
            return new KakaoUserInfo(kakaoId, email, nickname);
        } catch (WebClientResponseException e) {
            log.warn("Failed to get Kakao user info: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return null;
        } catch (RuntimeException e) {
            log.warn("Failed to get Kakao user info", e);
            return null;
        }
    }
}
