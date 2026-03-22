import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { COLORS, RADII, SHADOWS } from "../../constants/theme";
import { useAuth } from "../../stores/authStore";

export default function TabsLayout() {
  const { isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: COLORS.sand,
        },
        tabBarActiveTintColor: COLORS.ink,
        tabBarInactiveTintColor: COLORS.inkMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
          paddingHorizontal: 10,
          borderRadius: RADII.lg,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: COLORS.line,
          backgroundColor: "rgba(255,249,239,0.96)",
          ...SHADOWS.floating,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "지도" }} />
      <Tabs.Screen name="list" options={{ title: "리스트" }} />
      <Tabs.Screen name="settings" options={{ title: "설정" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sand,
  },
});
