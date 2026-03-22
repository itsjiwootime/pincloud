import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { COLORS, DISPLAY_FONT_FAMILY, RADII, SHADOWS } from "../../constants/theme";
import { getErrorMessage } from "../../services/api";
import { deleteSavedPlace, getSavedPlace, updateSavedPlace } from "../../services/places";
import { useAuth } from "../../stores/authStore";
import { useCategories } from "../../stores/categoryStore";
import { SavedPlace, VisitStatus } from "../../types";

function getVisitStatusLabel(status: VisitStatus) {
  return status === "VISITED" ? "방문 완료" : "가고 싶어요";
}

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isFocused = useIsFocused();
  const { categories, loadCategories } = useCategories();
  const [place, setPlace] = useState<SavedPlace | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.ink} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void loadCategories();
  }, [isFocused, loadCategories]);

  useEffect(() => {
    if (!id || !isFocused) {
      return;
    }

    let isMounted = true;

    const loadPlace = async () => {
      setIsLoading(true);

      try {
        const response = await getSavedPlace(id);

        if (!isMounted) {
          return;
        }

        setPlace(response);
        setMemoDraft(response.memo ?? "");
        setSelectedCategoryId(response.category?.id ?? null);
        setError(null);
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPlace();

    return () => {
      isMounted = false;
    };
  }, [id, isFocused]);

  const handleToggleVisitStatus = async () => {
    if (!place) {
      return;
    }

    const nextStatus: VisitStatus = place.visitStatus === "WANT" ? "VISITED" : "WANT";
    setIsSubmitting(true);

    try {
      const updatedPlace = await updateSavedPlace(place.id, { visitStatus: nextStatus });
      setPlace(updatedPlace);
      setError(null);
    } catch (updateError) {
      Alert.alert("상태 변경 실패", getErrorMessage(updateError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!place) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPlace = await updateSavedPlace(place.id, {
        memo: memoDraft.trim(),
        categoryId: selectedCategoryId,
      });

      setPlace(updatedPlace);
      setMemoDraft(updatedPlace.memo ?? "");
      setSelectedCategoryId(updatedPlace.category?.id ?? null);
      setIsEditing(false);
      setError(null);
    } catch (updateError) {
      Alert.alert("수정 실패", getErrorMessage(updateError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!place || isDeleting) {
      return;
    }

    Alert.alert("장소 삭제", "이 장소를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setIsDeleting(true);

            try {
              await deleteSavedPlace(place.id);
              router.replace("/list");
            } catch (deleteError) {
              Alert.alert("삭제 실패", getErrorMessage(deleteError));
            } finally {
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  const openSourceLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("링크 열기 실패", "브라우저에서 링크를 열 수 없어요.");
    }
  };

  const openDirections = () => {
    if (!place) {
      return;
    }

    const { latitude, longitude, name } = place;
    const encodedName = encodeURIComponent(name);

    Alert.alert("길찾기 앱 선택", undefined, [
      {
        text: "카카오맵",
        onPress: () => void Linking.openURL(`kakaomap://look?p=${latitude},${longitude}`),
      },
      {
        text: "네이버지도",
        onPress: () =>
          void Linking.openURL(
            `nmap://place?lat=${latitude}&lng=${longitude}&name=${encodedName}&appname=com.pincloud`
          ),
      },
      {
        text: "티맵",
        onPress: () =>
          void Linking.openURL(
            `tmap://route?goalname=${encodedName}&goaly=${latitude}&goalx=${longitude}`
          ),
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.ink} />
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error ?? "장소 정보를 찾을 수 없습니다."}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.replace("/list")}>
          <Text style={styles.retryLabel}>리스트로 돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const thumbnailUrl = place.sourceLinks?.[0]?.thumbnailUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>PLACE NOTE</Text>
          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.address}>{place.address}</Text>

          <View style={styles.heroBadges}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusLabel}>{getVisitStatusLabel(place.visitStatus)}</Text>
            </View>

            {place.category ? (
              <View style={[styles.categoryBadge, { backgroundColor: place.category.colorCode }]}>
                <Text style={styles.categoryLabel}>{place.category.name}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroActions}>
            <Pressable
              style={[styles.primaryAction, isSubmitting && styles.buttonDisabled]}
              disabled={isSubmitting}
              onPress={() => void handleToggleVisitStatus()}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryActionLabel}>
                  {place.visitStatus === "WANT" ? "방문 완료로 변경" : "가고 싶어요로 변경"}
                </Text>
              )}
            </Pressable>

            <Pressable style={styles.secondaryAction} onPress={() => void openDirections()}>
              <Text style={styles.secondaryActionLabel}>길찾기</Text>
            </Pressable>
          </View>
        </View>

        {thumbnailUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>썸네일</Text>
            <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>출처 링크</Text>
          {place.sourceLinks?.length ? (
            place.sourceLinks.map((sourceLink) => (
              <Pressable
                key={sourceLink.id}
                style={styles.linkButton}
                onPress={() => void openSourceLink(sourceLink.originalUrl)}
              >
                <Text style={styles.linkPlatform}>{sourceLink.platform}</Text>
                <Text style={styles.linkUrl}>{sourceLink.originalUrl}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.sectionBody}>연결된 출처 링크가 없습니다.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>메모 및 카테고리</Text>
            <Pressable
              style={styles.editToggleButton}
              onPress={() => {
                setIsEditing((current) => !current);
                setMemoDraft(place.memo ?? "");
                setSelectedCategoryId(place.category?.id ?? null);
              }}
            >
              <Text style={styles.editToggleLabel}>{isEditing ? "닫기" : "수정"}</Text>
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>메모</Text>
              <TextInput
                value={memoDraft}
                onChangeText={setMemoDraft}
                placeholder="메모를 입력해주세요"
                multiline
                style={[styles.input, styles.memoInput]}
              />

              <Text style={styles.fieldLabel}>카테고리</Text>
              <View style={styles.categoryRow}>
                <Pressable
                  style={[
                    styles.categoryChip,
                    selectedCategoryId === null && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      selectedCategoryId === null && styles.categoryChipLabelSelected,
                    ]}
                  >
                    선택 안 함
                  </Text>
                </Pressable>

                {categories.map((category) => {
                  const isSelected = selectedCategoryId === category.id;

                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          backgroundColor: category.colorCode,
                          borderColor: category.colorCode,
                        },
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipLabel,
                          isSelected && styles.categoryChipLabelSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[styles.primaryEditButton, isSubmitting && styles.buttonDisabled]}
                disabled={isSubmitting}
                onPress={() => void handleSaveEdit()}
              >
                <Text style={styles.primaryEditLabel}>수정 저장</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionBody}>{place.memo || "등록된 메모가 없습니다."}</Text>
              <Text style={styles.metaText}>
                카테고리: {place.category?.name ?? "선택되지 않음"}
              </Text>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>좌표</Text>
          <Text style={styles.sectionBody}>
            {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
          </Text>
        </View>

        <View style={styles.footerActions}>
          <Pressable style={styles.footerButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.footerButtonLabel}>수정</Text>
          </Pressable>
          <Pressable
            style={[styles.footerButton, styles.deleteButton, isDeleting && styles.buttonDisabled]}
            disabled={isDeleting}
            onPress={handleDelete}
          >
            {isDeleting ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <Text style={[styles.footerButtonLabel, styles.deleteLabel]}>삭제</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sand,
    paddingHorizontal: 24,
    gap: 12,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 110,
  },
  hero: {
    borderRadius: RADII.xl,
    backgroundColor: COLORS.ink,
    padding: 24,
    gap: 12,
    ...SHADOWS.floating,
  },
  heroEyebrow: {
    color: COLORS.sun,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  address: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 15,
    lineHeight: 22,
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBadge: {
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginTop: 4,
  },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
  },
  primaryActionLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 104,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  secondaryActionLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  section: {
    borderRadius: RADII.lg,
    backgroundColor: "rgba(255,253,248,0.98)",
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionBody: {
    color: COLORS.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  thumbnail: {
    width: "100%",
    height: 220,
    borderRadius: RADII.md,
    backgroundColor: COLORS.line,
  },
  linkButton: {
    gap: 6,
    borderRadius: RADII.md,
    backgroundColor: COLORS.paper,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  linkPlatform: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  linkUrl: {
    color: COLORS.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  editToggleButton: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editToggleLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  editSection: {
    gap: 10,
  },
  fieldLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderRadius: RADII.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.ink,
  },
  memoInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  categoryChipLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryChipLabelSelected: {
    color: COLORS.white,
  },
  primaryEditButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    marginTop: 4,
  },
  primaryEditLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  metaText: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingVertical: 16,
  },
  footerButtonLabel: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    borderColor: "#F0B2A7",
    backgroundColor: "#FCEAE6",
  },
  deleteLabel: {
    color: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  retryLabel: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "600",
  },
});
