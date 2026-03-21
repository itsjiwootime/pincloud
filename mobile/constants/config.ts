import { Platform } from "react-native";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Platform.select({
    android: "http://10.0.2.2:8080",
    default: "http://localhost:8080",
  }) ??
  "http://localhost:8080";

export const AUTH_STORAGE_KEYS = {
  jwtToken: "jwt_token",
  refreshToken: "refresh_token",
  user: "auth_user",
} as const;

export const INITIAL_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const DEFAULT_PIN_COLOR = "#E85D5D";

export const KAKAO_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? "";

export const KAKAO_REDIRECT_URI = `${API_BASE_URL}/api/auth/kakao/callback`;
