import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { DEFAULT_PIN_COLOR, INITIAL_REGION } from "../../constants/config";
import { COLORS, DISPLAY_FONT_FAMILY, RADII, SHADOWS } from "../../constants/theme";
import { getErrorMessage } from "../../services/api";
import { getSavedPlacesByBbox } from "../../services/places";
import { useCategories } from "../../stores/categoryStore";
import { SavedPlace } from "../../types";

function regionToBbox(region: Region): string {
  const minLat = region.latitude - region.latitudeDelta / 2;
  const maxLat = region.latitude + region.latitudeDelta / 2;
  const minLng = region.longitude - region.longitudeDelta / 2;
  const maxLng = region.longitude + region.longitudeDelta / 2;

  return [minLat, minLng, maxLat, maxLng].map((value) => value.toFixed(6)).join(",");
}

export default function MapScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { categories, selectedCategoryId, selectCategory, isLoading: isLoadingCategories } =
    useCategories();
  const [viewportRegion, setViewportRegion] = useState<Region>(INITIAL_REGION);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    const loadPlaces = async () => {
      setIsLoadingPlaces(true);

      try {
        const response = await getSavedPlacesByBbox(regionToBbox(viewportRegion));

        if (!isMounted) {
          return;
        }

        setPlaces(response);
        setError(null);
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlaces(false);
        }
      }
    };

    void loadPlaces();

    return () => {
      isMounted = false;
    };
  }, [
    isFocused,
    viewportRegion.latitude,
    viewportRegion.longitude,
    viewportRegion.latitudeDelta,
    viewportRegion.longitudeDelta,
  ]);

  const visiblePlaces =
    selectedCategoryId === null
      ? places
      : places.filter((place) => place.category?.id === selectedCategoryId);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MapView
        initialRegion={INITIAL_REGION}
        style={StyleSheet.absoluteFill}
        onRegionChangeComplete={setViewportRegion}
      >
        {visiblePlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor={place.category?.colorCode ?? DEFAULT_PIN_COLOR}
          >
            <Callout onPress={() => router.push(`/place/${place.id}`)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{place.name}</Text>
                <Text style={styles.calloutLink}>상세보기</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroEyebrow}>FIELD VIEW</Text>
            <Text style={styles.heroTitle}>지금 보고 있는 지도 범위에서 저장 장소를 바로 훑어보세요.</Text>
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroMeta}>{visiblePlaces.length}개의 핀</Text>
            <Pressable style={styles.heroAction} onPress={() => router.push("/link-input")}>
              <Text style={styles.heroActionLabel}>링크 추가</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          <Pressable
            style={[
              styles.chip,
              selectedCategoryId === null && styles.chipSelected,
            ]}
            onPress={() => selectCategory(null)}
          >
            <Text
              style={[
                styles.chipLabel,
                selectedCategoryId === null && styles.chipLabelSelected,
              ]}
            >
              전체
            </Text>
          </Pressable>

          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;

            return (
              <Pressable
                key={category.id}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: category.colorCode },
                ]}
                onPress={() => selectCategory(category.id)}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && styles.chipLabelSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>필터 요약</Text>
          <Text style={styles.summaryValue}>
            {selectedCategoryId === null ? "전체 카테고리" : "선택 카테고리"} · {visiblePlaces.length}곳
          </Text>
          {isLoadingPlaces || isLoadingCategories ? (
            <ActivityIndicator size="small" color={COLORS.teal} />
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>

      <Pressable style={styles.fab} onPress={() => router.push("/link-input")}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  overlay: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  heroCard: {
    borderRadius: RADII.xl,
    padding: 18,
    backgroundColor: "rgba(255,249,239,0.94)",
    borderWidth: 1,
    borderColor: "rgba(216,205,186,0.9)",
    gap: 14,
    ...SHADOWS.card,
  },
  heroTextBlock: {
    gap: 8,
  },
  heroEyebrow: {
    color: COLORS.accentDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: COLORS.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroMeta: {
    color: COLORS.inkMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  heroAction: {
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroActionLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
  chipsContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    borderRadius: RADII.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,253,248,0.92)",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chipSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.ink,
  },
  chipLabelSelected: {
    color: COLORS.white,
  },
  summaryCard: {
    alignSelf: "flex-start",
    borderRadius: RADII.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(20,33,61,0.9)",
    gap: 4,
    maxWidth: "88%",
    ...SHADOWS.card,
  },
  summaryTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.accentSoft,
    fontSize: 13,
    fontWeight: "500",
  },
  callout: {
    minWidth: 120,
    gap: 6,
  },
  calloutTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  calloutLink: {
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.floating,
  },
  fabLabel: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "700",
    marginTop: -2,
  },
});
