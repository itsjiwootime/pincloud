import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KAKAO_APP_KEY, KAKAO_REDIRECT_URI } from "../../constants/config";
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>LinkMap</Text>
          <Text style={styles.title}>링크로 저장한 장소를 바로 지도에 쌓아보세요.</Text>
          <Text style={styles.subtitle}>
            이메일과 비밀번호로 로그인하면 저장 장소, 링크 추출, 카테고리 기능을 바로 사용할 수 있습니다.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitLabel}>로그인</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push("/auth/signup")}>
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
              <ActivityIndicator color="#3C1E1E" />
            ) : (
              <Text style={styles.kakaoLabel}>카카오 로그인</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: "space-between",
  },
  hero: {
    gap: 12,
    marginTop: 28,
  },
  kicker: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 42,
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 14,
    paddingBottom: 20,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: -4,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#111827",
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
  },
  secondaryLabel: {
    color: "#111827",
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
    backgroundColor: "#E2E8F0",
  },
  dividerLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  kakaoButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#FEE500",
    paddingVertical: 16,
  },
  kakaoLabel: {
    color: "#3C1E1E",
    fontSize: 16,
    fontWeight: "700",
  },
});
