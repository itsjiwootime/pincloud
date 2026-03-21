import * as SecureStore from "expo-secure-store";

import { login, signup } from "../../services/auth";
import api from "../../services/api";

jest.mock("expo-secure-store");

jest.mock("../../services/api", () => {
  const actual = jest.requireActual("../../services/api");

  return {
    __esModule: true,
    ...actual,
    default: {
      post: jest.fn(),
    },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("auth service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signup calls the signup endpoint and returns auth data", async () => {
    const request = { email: "tester@example.com", password: "secret1", nickname: "tester" };
    const payload = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      userId: 1,
      nickname: "tester",
    };

    mockedApi.post.mockResolvedValueOnce({
      data: { success: true, message: "", data: payload },
    });

    await expect(signup(request)).resolves.toEqual(payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/api/auth/signup", request);
  });

  it("login stores access token and refresh token in SecureStore", async () => {
    const request = { email: "tester@example.com", password: "secret1" };
    const payload = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      userId: 1,
      nickname: "tester",
    };

    mockedApi.post.mockResolvedValueOnce({
      data: { success: true, message: "", data: payload },
    });

    await expect(login(request)).resolves.toEqual(payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/api/auth/login", request);
    expect(mockedSecureStore.setItemAsync).toHaveBeenNthCalledWith(1, "jwt_token", "access-token");
    expect(mockedSecureStore.setItemAsync).toHaveBeenNthCalledWith(
      2,
      "refresh_token",
      "refresh-token"
    );
  });

  it("login deletes refresh token in SecureStore when it is missing", async () => {
    const request = { email: "tester@example.com", password: "secret1" };
    const payload = {
      accessToken: "access-token",
      refreshToken: "",
      userId: 1,
      nickname: "tester",
    };

    mockedApi.post.mockResolvedValueOnce({
      data: { success: true, message: "", data: payload },
    });

    await login(request);

    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith("jwt_token", "access-token");
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith("refresh_token");
  });
});
