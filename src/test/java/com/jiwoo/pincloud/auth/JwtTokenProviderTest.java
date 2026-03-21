package com.jiwoo.pincloud.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET = "testSecretKeyForJwtProviderShouldBeLongEnough12345";

    @Test
    void createAccessToken_생성한_토큰에서_같은_userId를_반환한다() {
        // given
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(SECRET, 3_600_000L, 604_800_000L);

        // when
        String token = jwtTokenProvider.createAccessToken(1L);
        Long userId = jwtTokenProvider.getUserId(token);

        // then
        assertThat(userId).isEqualTo(1L);
    }

    @Test
    void validateToken_유효한_토큰이면_검증에_통과한다() {
        // given
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(SECRET, 3_600_000L, 604_800_000L);
        String token = jwtTokenProvider.createAccessToken(1L);

        // when
        boolean valid = jwtTokenProvider.validateToken(token);

        // then
        assertThat(valid).isTrue();
    }

    @Test
    void validateToken_만료된_토큰이면_검증에_실패한다() throws InterruptedException {
        // given
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(SECRET, 1L, 604_800_000L);
        String token = jwtTokenProvider.createAccessToken(1L);

        // when
        Thread.sleep(20L);
        boolean valid = jwtTokenProvider.validateToken(token);

        // then
        assertThat(valid).isFalse();
    }

    @Test
    void validateToken_잘못된_토큰이면_검증에_실패한다() {
        // given
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(SECRET, 3_600_000L, 604_800_000L);

        // when
        boolean valid = jwtTokenProvider.validateToken("invalid.token.value");

        // then
        assertThat(valid).isFalse();
    }
}
