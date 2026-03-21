import * as SecureStore from "expo-secure-store";
import axios from "axios";

import { AUTH_STORAGE_KEYS, API_BASE_URL } from "../constants/config";
import { ApiResponse } from "../types";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let unauthorizedHandler: null | (() => Promise<void> | void) = null;
let isHandlingUnauthorized = false;

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.jwtToken);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if ((status === 401 || status === 403) && unauthorizedHandler && !isHandlingUnauthorized) {
        isHandlingUnauthorized = true;

        try {
          await unauthorizedHandler();
        } finally {
          isHandlingUnauthorized = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export function registerUnauthorizedHandler(handler: null | (() => Promise<void> | void)) {
  unauthorizedHandler = handler;
}

export function unwrapApiResponse<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message || "요청에 실패했습니다.");
  }

  return response.data.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401 || status === 403) {
      return "로그인이 만료되었어요. 다시 로그인해주세요.";
    }

    if (!error.response || error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
      return "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.";
    }

    if (status != null && status >= 500) {
      return "서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
    }

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    return "요청을 처리하지 못했어요. 입력값을 확인하고 다시 시도해주세요.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

export default api;
