import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KAKAO_APP_KEY, KAKAO_REDIRECT_URI } from "../../constants/config";
import { COLORS, DISPLAY_FONT_FAMILY, RADII, SHADOWS } from "../../constants/theme";
import { getErrorMessage } from "../../services/api";
import { login as loginRequest } from "../../services/auth";
import { useAuth } from "../../stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKakaoSubmitting, setIsKakaoSubmitting] = useState(false);
  const isDisabled = email.trim().length === 0 || password.trim().length === 0;
  const entryAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entryAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 120,
      mass: 0.8,
    }).start();
  }, [entryAnimation]);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await loginRequest({ email: normalizedEmail, password });

      await login(
        response.accessToken,
        {
          id: response.userId,
          email: normalizedEmail,
          nickname: response.nickname,
        },
        response.refreshToken
      );

      router.replace("/");
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (!KAKAO_APP_KEY) {
      setError("카카오 앱 키가 설정되지 않았습니다. 관리자에게 문의해주세요.");
      return;
    }

    setError(null);
    setIsKakaoSubmitting(true);

    try {
      const authUrl =
        `https://kauth.kakao.com/oauth/authorize` +
        `?client_id=${KAKAO_APP_KEY}` +
        `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
        `&response_type=code`;

      // 백엔드 콜백이 linkmap://auth?token=...로 리다이렉트하므로 해당 스킴을 인터셉트
      const result = await WebBrowser.openAuthSessionAsync(authUrl, "linkmap://auth");

      if (result.type !== "success") {
        return;
      }

      const url = new URL(result.url);
      const token = url.searchParams.get("token");
      const refreshToken = url.searchParams.get("refreshToken");
      const userId = url.searchParams.get("userId");
      const nickname = url.searchParams.get("nickname");

      if (!token) {
        setError("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      await login(
        token,
        { id: Number(userId), email: "", nickname: nickname ?? "" },
        refreshToken
      );

      router.replace("/");
    } catch (kakaoError) {
      setError(getErrorMessage(kakaoError));
    } finally {
      setIsKakaoSubmitting(false);
    }
  };

  const entryStyle = {
    opacity: entryAnimation,
    transform: [
      {
        translateY: entryAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [26, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, entryStyle]}>
            <View style={styles.hero}>
              <View style={styles.heroTopRow}>
                <Text style={styles.kicker}>LINKMAP</Text>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeLabel}>CITY FIELD NOTES</Text>
                </View>
              </View>

              <Text style={styles.title}>링크에서 발견한 장소를 취향의 지도에 쌓아두세요.</Text>
              <Text style={styles.subtitle}>
                흩어진 맛집 링크와 여행 후보를 모아 카테고리별로 정리하고, 다시 찾고 싶은 순간을
                빠르게 꺼내보세요.
              </Text>

              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Collect</Text>
                  <Text style={styles.statValue}>링크 추출</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Arrange</Text>
                  <Text style={styles.statValue}>지도와 분류</Text>
                </View>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formEyebrow}>SIGN IN</Text>

              <Text style={styles.label}>이메일</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={COLORS.inkMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
              />
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor={COLORS.inkMuted}
                secureTextEntry
                textContentType="password"
                style={styles.input}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[
                  styles.submitButton,
                  (isSubmitting || isDisabled) && styles.buttonDisabled,
                ]}
                disabled={isSubmitting || isDisabled}
                onPress={() => void handleLogin()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitLabel}>로그인</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push("/auth/signup")}
              >
                <Text style={styles.secondaryLabel}>회원가입</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>또는</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={[styles.kakaoButton, isKakaoSubmitting && styles.buttonDisabled]}
                disabled={isKakaoSubmitting}
                onPress={() => void handleKakaoLogin()}
              >
                {isKakaoSubmitting ? (
                  <ActivityIndicator color={COLORS.kakaoText} />
                ) : (
                  <Text style={styles.kakaoLabel}>카카오 로그인</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -54,
    right: -16,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.accentSoft,
    opacity: 0.95,
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: 120,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.tealSoft,
    opacity: 0.8,
  },
  hero: {
    gap: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: {
    color: COLORS.accentDeep,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  heroBadge: {
    borderRadius: RADII.pill,
    backgroundColor: "rgba(20,33,61,0.08)",
    borderWidth: 1,
    borderColor: "rgba(20,33,61,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeLabel: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  title: {
    color: COLORS.ink,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 46,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: RADII.md,
    backgroundColor: "rgba(255,249,239,0.78)",
    borderWidth: 1,
    borderColor: "rgba(20,33,61,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statLabel: {
    color: COLORS.accentDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  formCard: {
    gap: 14,
    borderRadius: RADII.xl,
    backgroundColor: "rgba(255,253,248,0.94)",
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(185,167,138,0.52)",
    ...SHADOWS.card,
  },
  formEyebrow: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  label: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: -4,
  },
  input: {
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    color: COLORS.ink,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  submitLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 16,
  },
  secondaryLabel: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
  },
  dividerLabel: {
    color: COLORS.inkMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  kakaoButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.kakao,
    paddingVertical: 16,
  },
  kakaoLabel: {
    color: COLORS.kakaoText,
    fontSize: 16,
    fontWeight: "700",
  },
});
