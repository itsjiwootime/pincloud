package com.jiwoo.pincloud.auth;

public record AuthResponse(String accessToken, String refreshToken, Long userId, String nickname) {}
