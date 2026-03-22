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

import { COLORS, DISPLAY_FONT_FAMILY, RADII, SHADOWS } from "../../constants/theme";
import { getErrorMessage } from "../../services/api";
import { signup as signupRequest } from "../../services/auth";
import { getSignupValidationError, normalizeEmail } from "../../utils/validation";

export default function SignupScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const entryAnimation = useRef(new Animated.Value(0)).current;
  const isDisabled =
    nickname.trim().length === 0 ||
    email.trim().length === 0 ||
    password.trim().length === 0 ||
    passwordConfirm.trim().length === 0;

  useEffect(() => {
    Animated.spring(entryAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 120,
      mass: 0.8,
    }).start();
  }, [entryAnimation]);

  const validate = () => {
    return getSignupValidationError(email, password, passwordConfirm);
  };

  const handleSignup = async () => {
    const normalizedEmail = normalizeEmail(email);
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signupRequest({ email: normalizedEmail, password, nickname: nickname.trim() });
      router.replace("/auth/login");
    } catch (signupError) {
      setError(getErrorMessage(signupError));
    } finally {
      setIsSubmitting(false);
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
                <Text style={styles.kicker}>NEW ROUTE</Text>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeLabel}>MAKE YOUR MAP</Text>
                </View>
              </View>

              <Text style={styles.title}>수집한 링크를 한곳에 모을 개인 지도를 시작하세요.</Text>
              <Text style={styles.subtitle}>
                계정을 만들면 저장 장소, 링크 추출, 카테고리 정리 흐름을 바로 이어서 사용할 수
                있습니다.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formEyebrow}>CREATE ACCOUNT</Text>

              <Text style={styles.label}>닉네임</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임"
                placeholderTextColor={COLORS.inkMuted}
                style={styles.input}
              />
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
                placeholder="최소 6자 이상"
                placeholderTextColor={COLORS.inkMuted}
                secureTextEntry
                textContentType="newPassword"
                style={styles.input}
              />
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder="비밀번호를 다시 입력해주세요"
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
                onPress={() => void handleSignup()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitLabel}>계정 만들기</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.replace("/auth/login")}
              >
                <Text style={styles.secondaryLabel}>로그인으로 돌아가기</Text>
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
    top: -44,
    left: -20,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.tealSoft,
    opacity: 0.9,
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: 110,
    right: -24,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.accentSoft,
    opacity: 0.9,
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
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
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
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 44,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: 15,
    lineHeight: 24,
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
    color: COLORS.accentDeep,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  label: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
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
});
