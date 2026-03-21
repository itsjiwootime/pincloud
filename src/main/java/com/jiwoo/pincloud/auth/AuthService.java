package com.jiwoo.pincloud.auth;

import com.jiwoo.pincloud.domain.user.User;
import com.jiwoo.pincloud.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

  private static final String INVALID_CREDENTIALS_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider jwtTokenProvider;
  private final KakaoAuthClient kakaoAuthClient;

  @Transactional
  public AuthResponse signup(SignupRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
    }

    User user =
        userRepository.save(
            User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .build());

    return createAuthResponse(user);
  }

  public AuthResponse login(LoginRequest request) {
    User user =
        userRepository.findByEmail(request.email()).orElseThrow(this::invalidCredentialsException);

    if (!StringUtils.hasText(user.getPassword())
        || !passwordEncoder.matches(request.password(), user.getPassword())) {
      throw invalidCredentialsException();
    }

    return createAuthResponse(user);
  }

  @Transactional
  public AuthResponse kakaoLogin(String code) {
    String accessToken = kakaoAuthClient.getAccessToken(code);
    if (!StringUtils.hasText(accessToken)) {
      throw new IllegalArgumentException("카카오 로그인에 실패했습니다");
    }

    KakaoUserInfo kakaoUserInfo = kakaoAuthClient.getUserInfo(accessToken);
    if (kakaoUserInfo == null) {
      throw new IllegalArgumentException("카카오 로그인에 실패했습니다");
    }

    User user =
        userRepository
            .findByKakaoId(kakaoUserInfo.kakaoId())
            .orElseGet(() -> getOrCreateKakaoUser(kakaoUserInfo));

    return createAuthResponse(user);
  }

  private User getOrCreateKakaoUser(KakaoUserInfo kakaoUserInfo) {
    String email = resolveEmail(kakaoUserInfo);

    return userRepository
        .findByEmail(email)
        .map(
            existingUser -> {
              if (StringUtils.hasText(existingUser.getKakaoId())
                  && !existingUser.getKakaoId().equals(kakaoUserInfo.kakaoId())) {
                throw new IllegalArgumentException("이미 다른 카카오 계정과 연결된 이메일입니다");
              }
              existingUser.linkKakaoAccount(kakaoUserInfo.kakaoId());
              existingUser.updateNickname(resolveNickname(kakaoUserInfo.nickname()));
              return existingUser;
            })
        .orElseGet(
            () ->
                userRepository.save(
                    User.builder()
                        .email(email)
                        .nickname(resolveNickname(kakaoUserInfo.nickname()))
                        .kakaoId(kakaoUserInfo.kakaoId())
                        .build()));
  }

  private String resolveEmail(KakaoUserInfo kakaoUserInfo) {
    if (StringUtils.hasText(kakaoUserInfo.email())) {
      return kakaoUserInfo.email();
    }
    return "kakao_" + kakaoUserInfo.kakaoId() + "@kakao.local";
  }

  private String resolveNickname(String nickname) {
    return StringUtils.hasText(nickname) ? nickname : "사용자";
  }

  private AuthResponse createAuthResponse(User user) {
    return new AuthResponse(
        jwtTokenProvider.createAccessToken(user.getId()),
        jwtTokenProvider.createRefreshToken(user.getId()),
        user.getId(),
        user.getNickname());
  }

  private IllegalArgumentException invalidCredentialsException() {
    return new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE);
  }
}
