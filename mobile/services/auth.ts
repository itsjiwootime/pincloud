import * as SecureStore from "expo-secure-store";

import { AUTH_STORAGE_KEYS } from "../constants/config";
import { ApiResponse, AuthResponse, KakaoLoginResponse, LoginRequest, SignupRequest } from "../types";
import api, { unwrapApiResponse } from "./api";

async function persistTokens(accessToken: string, refreshToken?: string | null) {
  await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.jwtToken, accessToken);

  if (refreshToken) {
    await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  } else {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.refreshToken);
  }
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>("/api/auth/signup", request);
  return unwrapApiResponse(response);
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>("/api/auth/login", request);
  const authResponse = unwrapApiResponse(response);
  await persistTokens(authResponse.accessToken, authResponse.refreshToken);
  return authResponse;
}

export async function kakaoLogin(code: string): Promise<KakaoLoginResponse> {
  const response = await api.post<ApiResponse<KakaoLoginResponse>>(`/api/auth/kakao?code=${encodeURIComponent(code)}`);
  const authResponse = unwrapApiResponse(response);
  await persistTokens(authResponse.accessToken, authResponse.refreshToken);
  return authResponse;
}
