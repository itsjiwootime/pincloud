import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { AUTH_STORAGE_KEYS } from "../constants/config";
import { registerUnauthorizedHandler } from "../services/api";
import { User } from "../types";

interface AuthContextValue {
  isAuthenticated: boolean;
  isHydrated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user?: User | null, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const setUser = async (nextUser: User | null) => {
    setUserState(nextUser);

    if (nextUser) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(nextUser));
      return;
    }

    await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.user);
  };

  const login = async (
    nextToken: string,
    nextUser: User | null = null,
    refreshToken?: string | null
  ) => {
    setToken(nextToken);

    await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.jwtToken, nextToken);

    if (refreshToken) {
      await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
    } else {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.refreshToken);
    }

    await setUser(nextUser);
  };

  const logout = async () => {
    setToken(null);
    setUserState(null);
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.jwtToken),
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.refreshToken),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.user),
    ]);
  };

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(AUTH_STORAGE_KEYS.jwtToken),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.user),
        ]);

        if (!isMounted) {
          return;
        }

        setToken(storedToken);

        if (storedUser) {
          try {
            setUserState(JSON.parse(storedUser) as User);
          } catch {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.user);
          }
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(async () => {
      await logout();
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        isHydrated,
        token,
        user,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
