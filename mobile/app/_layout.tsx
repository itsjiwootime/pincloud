import "react-native-gesture-handler";

import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../stores/authStore";
import { CategoryProvider } from "../stores/categoryStore";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CategoryProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerTitleAlign: "center" }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="link-input" options={{ title: "링크에서 장소 추출" }} />
            <Stack.Screen name="place/[id]" options={{ title: "장소 상세" }} />
          </Stack>
        </CategoryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
