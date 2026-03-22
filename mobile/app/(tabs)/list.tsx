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

import { COLORS, DISPLAY_FONT_FAMILY, RADII, SHADOWS } from "../../constants/theme";
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
        <ActivityIndicator size="large" color={COLORS.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.kicker}>COLLECTION</Text>
            <Text style={styles.title}>저장한 장소를 카드처럼 훑어보세요.</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={() => void logout()}>
            <Text style={styles.logoutLabel}>로그아웃</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          링크에서 추출해 쌓은 장소를 한 번에 확인하고 상세 화면으로 이어집니다.
        </Text>
        <View style={styles.collectionBadge}>
          <Text style={styles.collectionBadgeLabel}>{places.length} places archived</Text>
        </View>
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
            <View
              style={[
                styles.cardAccent,
                { backgroundColor: item.category?.colorCode ?? COLORS.accent },
              ]}
            />
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
    backgroundColor: COLORS.sand,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sand,
  },
  headerCard: {
    borderRadius: RADII.xl,
    padding: 18,
    backgroundColor: "rgba(255,249,239,0.94)",
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 12,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    gap: 8,
  },
  kicker: {
    color: COLORS.accentDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.ink,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  collectionBadge: {
    alignSelf: "flex-start",
    borderRadius: RADII.pill,
    backgroundColor: COLORS.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  collectionBadgeLabel: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: "rgba(20,33,61,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.ink,
  },
  logoutLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: COLORS.danger,
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
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: COLORS.inkMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: "rgba(255,253,248,0.98)",
    borderRadius: RADII.lg,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeMuted: {
    backgroundColor: COLORS.lineStrong,
  },
  badgeLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  cardAddress: {
    color: COLORS.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  cardMemo: {
    color: COLORS.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
