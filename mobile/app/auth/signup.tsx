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
  const isDisabled =
    nickname.trim().length === 0 ||
    email.trim().length === 0 ||
    password.trim().length === 0 ||
    passwordConfirm.trim().length === 0;

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            계정을 만든 뒤 로그인해서 링크 추출과 장소 저장 기능을 사용할 수 있습니다.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
            style={styles.input}
          />
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
            placeholder="최소 6자 이상"
            secureTextEntry
            textContentType="newPassword"
            style={styles.input}
          />
          <Text style={styles.label}>비밀번호 확인</Text>
          <TextInput
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            placeholder="비밀번호를 다시 입력해주세요"
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitLabel}>계정 만들기</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.replace("/auth/login")}>
            <Text style={styles.secondaryLabel}>로그인으로 돌아가기</Text>
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
  title: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "700",
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
});
