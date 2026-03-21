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
          <Text style={styles.summaryTitle}>현재 지도 범위</Text>
          <Text style={styles.summaryValue}>{visiblePlaces.length}개의 핀</Text>
          {isLoadingPlaces || isLoadingCategories ? (
            <ActivityIndicator size="small" color="#2563EB" />
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
    backgroundColor: "#E5E7EB",
  },
  overlay: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  chipLabelSelected: {
    color: "#FFFFFF",
  },
  summaryCard: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    gap: 4,
    maxWidth: "88%",
  },
  summaryTitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "500",
  },
  callout: {
    minWidth: 120,
    gap: 6,
  },
  calloutTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  calloutLink: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111827",
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "500",
    marginTop: -2,
  },
});
