import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { getErrorMessage } from "../../services/api";
import { getSavedPlaces } from "../../services/places";
import { useAuth } from "../../stores/authStore";
import { SavedPlace } from "../../types";

export default function SavedPlacesListScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { logout } = useAuth();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPlaces = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getSavedPlaces();
      setPlaces(response);
      setError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void loadPlaces();
  }, [isFocused]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>저장한 장소</Text>
          <Text style={styles.subtitle}>백엔드의 저장 장소 목록을 그대로 불러옵니다.</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutLabel}>로그아웃</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={places.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadPlaces(true)} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>저장된 장소가 없습니다.</Text>
            <Text style={styles.emptySubtitle}>링크 추출 화면에서 장소를 추가해보세요.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/place/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View
                style={[
                  styles.badge,
                  item.category ? { backgroundColor: item.category.colorCode } : styles.badgeMuted,
                ]}
              >
                <Text style={styles.badgeLabel}>
                  {item.category?.name ?? item.visitStatus}
                </Text>
              </View>
            </View>
            <Text style={styles.cardAddress}>{item.address}</Text>
            {item.memo ? <Text style={styles.cardMemo}>{item.memo}</Text> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  logoutLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#B91C1C",
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 40,
    gap: 12,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#64748B",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeMuted: {
    backgroundColor: "#CBD5E1",
  },
  badgeLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cardAddress: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },
  cardMemo: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
});
