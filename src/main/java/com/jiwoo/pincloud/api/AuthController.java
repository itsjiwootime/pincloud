package com.jiwoo.pincloud.api;

import com.jiwoo.pincloud.auth.AuthResponse;
import com.jiwoo.pincloud.auth.AuthService;
import com.jiwoo.pincloud.auth.LoginRequest;
import com.jiwoo.pincloud.auth.SignupRequest;
import com.jiwoo.pincloud.common.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("회원가입이 완료되었습니다", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("로그인이 완료되었습니다", authService.login(request)));
    }

    @PostMapping("/kakao")
    public ResponseEntity<ApiResponse<AuthResponse>> kakaoLogin(@RequestParam("code") String code) {
        return ResponseEntity.ok(ApiResponse.ok("카카오 로그인이 완료되었습니다", authService.kakaoLogin(code)));
    }

    @GetMapping("/kakao/callback")
    public void kakaoCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        AuthResponse auth = authService.kakaoLogin(code);
        String deepLink = "linkmap://auth"
                + "?token=" + URLEncoder.encode(auth.accessToken(), StandardCharsets.UTF_8)
                + "&refreshToken=" + URLEncoder.encode(auth.refreshToken() != null ? auth.refreshToken() : "", StandardCharsets.UTF_8)
                + "&userId=" + auth.userId()
                + "&nickname=" + URLEncoder.encode(auth.nickname() != null ? auth.nickname() : "", StandardCharsets.UTF_8);
        response.sendRedirect(deepLink);
    }
}
