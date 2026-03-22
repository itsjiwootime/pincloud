import * as Clipboard from "expo-clipboard";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { COLORS, DISPLAY_FONT_FAMILY, RADII, SHADOWS } from "../constants/theme";
import { getErrorMessage } from "../services/api";
import { extractLink, saveLinkedPlace } from "../services/links";
import { useAuth } from "../stores/authStore";
import { useCategories } from "../stores/categoryStore";
import { LinkExtractResult, PlaceCandidate } from "../types";

interface CandidateOverride {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

function getCandidateKey(candidate: PlaceCandidate, index: number) {
  return `${candidate.rawName}-${index}`;
}

function createInitialOverride(candidate: PlaceCandidate): CandidateOverride {
  return {
    name: candidate.matchedName ?? candidate.normalizedName ?? candidate.rawName,
    address: candidate.roadAddress ?? candidate.address ?? "",
    latitude: candidate.latitude != null ? String(candidate.latitude) : "",
    longitude: candidate.longitude != null ? String(candidate.longitude) : "",
  };
}

function looksLikeUrl(value: string) {
  return /^https?:\/\/\S+/i.test(value.trim());
}

export default function LinkInputScreen() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  const isFocused = useIsFocused();
  const { categories, loadCategories } = useCategories();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<LinkExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);
  const [candidateOverrides, setCandidateOverrides] = useState<Record<string, CandidateOverride>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

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
    if (!isFocused || url.trim().length > 0) {
      return;
    }

    let isMounted = true;

    const loadClipboard = async () => {
      try {
        const clipboardText = await Clipboard.getStringAsync();

        if (!isMounted || !looksLikeUrl(clipboardText)) {
          return;
        }

        setUrl(clipboardText.trim());
        setClipboardNotice("클립보드에서 링크를 가져왔어요.");
      } catch {
        if (isMounted) {
          setClipboardNotice(null);
        }
      }
    };

    void loadClipboard();

    return () => {
      isMounted = false;
    };
  }, [isFocused, url]);

  const handleExtract = async () => {
    const nextUrl = url.trim();

    if (!looksLikeUrl(nextUrl)) {
      setError("올바른 URL을 입력해주세요.");
      return;
    }

    setError(null);
    setResult(null);
    setIsExtracting(true);

    try {
      const response = await extractLink(nextUrl);
      const nextOverrides = response.topCandidates.reduce<Record<string, CandidateOverride>>(
        (accumulator, candidate, index) => {
          accumulator[getCandidateKey(candidate, index)] = createInitialOverride(candidate);
          return accumulator;
        },
        {}
      );

      setResult(response);
      setCandidateOverrides(nextOverrides);
    } catch (extractError) {
      setError(getErrorMessage(extractError));
    } finally {
      setIsExtracting(false);
    }
  };

  const updateCandidateOverride = (
    candidate: PlaceCandidate,
    index: number,
    field: keyof CandidateOverride,
    value: string
  ) => {
    const key = getCandidateKey(candidate, index);

    setCandidateOverrides((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? createInitialOverride(candidate)),
        [field]: value,
      },
    }));
  };

  const handleSave = async (candidate: PlaceCandidate, index: number) => {
    if (!result) {
      return;
    }

    const key = getCandidateKey(candidate, index);
    const override = candidateOverrides[key] ?? createInitialOverride(candidate);
    const finalName = override.name.trim() || candidate.rawName;
    const finalAddress = override.address.trim();
    const finalLatitude = Number(override.latitude.trim());
    const finalLongitude = Number(override.longitude.trim());

    if (!finalName || !finalAddress || Number.isNaN(finalLatitude) || Number.isNaN(finalLongitude)) {
      Alert.alert("입력 확인", "장소명, 주소, 위도, 경도를 모두 확인해주세요.");
      return;
    }

    setSavingKey(key);

    try {
      await saveLinkedPlace({
        name: finalName,
        address: finalAddress,
        latitude: finalLatitude,
        longitude: finalLongitude,
        categoryId: selectedCategoryId ?? undefined,
        memo: memo.trim() || undefined,
        visitStatus: "WANT",
        sourceLink: {
          originalUrl: result.originalUrl,
          platform: result.platform,
          title: result.title,
          thumbnailUrl: result.thumbnailUrl,
        },
      });

      router.replace("/");
    } catch (saveError) {
      Alert.alert("저장 실패", getErrorMessage(saveError));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={result?.topCandidates ?? []}
        keyExtractor={(candidate, index) => getCandidateKey(candidate, index)}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.heroCard}>
              <Text style={styles.kicker}>LINK CAPTURE</Text>
              <Text style={styles.title}>링크를 붙여 넣고 저장 가능한 장소 후보로 정리하세요.</Text>
              <Text style={styles.subtitle}>
                게시글, 블로그, 지도 링크에서 장소 후보를 추출한 뒤 카테고리와 메모를 붙여 바로 지도에
                저장할 수 있습니다.
              </Text>

              <View style={styles.heroPills}>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillLabel}>Extract</Text>
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillLabel}>Review</Text>
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillLabel}>Save</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>원본 URL</Text>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://example.com/post"
                placeholderTextColor={COLORS.inkMuted}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
                style={styles.input}
                onSubmitEditing={() => void handleExtract()}
              />

              {clipboardNotice ? <Text style={styles.helperText}>{clipboardNotice}</Text> : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  (isExtracting || url.trim().length === 0) && styles.buttonDisabled,
                ]}
                disabled={isExtracting || url.trim().length === 0}
                onPress={() => void handleExtract()}
              >
                {isExtracting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryLabel}>장소 찾기</Text>
                )}
              </Pressable>
            </View>

            {result ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>추출 결과</Text>
                <Text style={styles.resultTitle}>{result.title || "제목 없음"}</Text>
                <Text style={styles.resultMeta}>
                  {result.platform} · {result.contentType}
                </Text>
                <Text style={styles.resultUrl}>{result.originalUrl}</Text>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeLabel}>{result.topCandidates.length}개 후보</Text>
                </View>

                <Text style={styles.fieldLabel}>카테고리</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryContent}
                >
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
                </ScrollView>

                <Text style={styles.fieldLabel}>메모</Text>
                <TextInput
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="메모가 있다면 함께 저장해주세요."
                  multiline
                  style={[styles.input, styles.memoInput]}
                />
              </View>
            ) : null}

            {result && result.topCandidates.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>추출된 장소 후보가 없습니다.</Text>
                <Text style={styles.emptySubtitle}>다른 링크를 시도하거나 서버 로그를 확인해주세요.</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <CandidateCard
            candidate={item}
            index={index}
            override={candidateOverrides[getCandidateKey(item, index)] ?? createInitialOverride(item)}
            isSaving={savingKey === getCandidateKey(item, index)}
            onChange={updateCandidateOverride}
            onSave={handleSave}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function CandidateCard({
  candidate,
  index,
  override,
  isSaving,
  onChange,
  onSave,
}: {
  candidate: PlaceCandidate;
  index: number;
  override: CandidateOverride;
  isSaving: boolean;
  onChange: (
    candidate: PlaceCandidate,
    index: number,
    field: keyof CandidateOverride,
    value: string
  ) => void;
  onSave: (candidate: PlaceCandidate, index: number) => Promise<void>;
}) {
  const hasCoordinates =
    (candidate.latitude != null || override.latitude.trim().length > 0) &&
    (candidate.longitude != null || override.longitude.trim().length > 0);
  const hasAddress =
    Boolean(candidate.roadAddress ?? candidate.address) || override.address.trim().length > 0;
  const canSave = override.name.trim().length > 0 && hasAddress && hasCoordinates;

  return (
    <View style={styles.candidateCard}>
      <View
        style={[
          styles.candidateAccent,
          { backgroundColor: candidate.kakaoMatched ? COLORS.teal : COLORS.accent },
        ]}
      />
      <View style={styles.candidateHeader}>
        <View style={styles.candidateTitleWrap}>
          <Text style={styles.candidateTitle}>{candidate.matchedName ?? override.name}</Text>
          {candidate.kakaoCategory ? (
            <Text style={styles.candidateMeta}>{candidate.kakaoCategory}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.matchBadge,
            candidate.kakaoMatched ? styles.matchBadgeOn : styles.matchBadgeOff,
          ]}
        >
          <Text style={styles.matchBadgeLabel}>
            {candidate.kakaoMatched ? "카카오 매칭 성공" : "카카오 매칭 실패"}
          </Text>
        </View>
      </View>

      <Text style={styles.candidateBody}>
        {candidate.roadAddress ?? candidate.address ?? "주소 정보가 없어 수동 입력이 필요합니다."}
      </Text>

      {!candidate.kakaoMatched ? (
        <View style={styles.manualSection}>
          <Text style={styles.fieldLabel}>장소명</Text>
          <TextInput
            value={override.name}
            onChangeText={(value) => onChange(candidate, index, "name", value)}
            placeholder="장소명을 입력해주세요"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>주소</Text>
          <TextInput
            value={override.address}
            onChangeText={(value) => onChange(candidate, index, "address", value)}
            placeholder="주소를 입력해주세요"
            style={styles.input}
          />

          <View style={styles.coordinateRow}>
            <View style={styles.coordinateColumn}>
              <Text style={styles.fieldLabel}>위도</Text>
              <TextInput
                value={override.latitude}
                onChangeText={(value) => onChange(candidate, index, "latitude", value)}
                placeholder="37.5665"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.coordinateColumn}>
              <Text style={styles.fieldLabel}>경도</Text>
              <TextInput
                value={override.longitude}
                onChangeText={(value) => onChange(candidate, index, "longitude", value)}
                placeholder="126.9780"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.coordinateText}>
          좌표 {candidate.latitude?.toFixed(6)}, {candidate.longitude?.toFixed(6)}
        </Text>
      )}

      <Pressable
        style={[styles.secondaryButton, (!canSave || isSaving) && styles.buttonDisabled]}
        disabled={!canSave || isSaving}
        onPress={() => void onSave(candidate, index)}
      >
        {isSaving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.secondaryLabel}>저장</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sand,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  headerContent: {
    gap: 16,
    marginBottom: 16,
  },
  heroCard: {
    gap: 12,
    borderRadius: RADII.xl,
    backgroundColor: "rgba(255,249,239,0.94)",
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    ...SHADOWS.card,
  },
  kicker: {
    color: COLORS.accentDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroPill: {
    borderRadius: RADII.pill,
    backgroundColor: COLORS.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroPillLabel: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionCard: {
    gap: 12,
    borderRadius: RADII.lg,
    backgroundColor: "rgba(255,253,248,0.96)",
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.card,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "700",
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
    minHeight: 92,
    textAlignVertical: "top",
  },
  helperText: {
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.accentDeep,
    paddingVertical: 16,
    ...SHADOWS.card,
  },
  primaryLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  resultTitle: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "700",
  },
  resultMeta: {
    color: COLORS.accentDeep,
    fontSize: 13,
    fontWeight: "700",
  },
  resultUrl: {
    color: COLORS.inkMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  resultBadge: {
    alignSelf: "flex-start",
    borderRadius: RADII.pill,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultBadgeLabel: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryContent: {
    gap: 8,
    paddingRight: 12,
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
  emptyState: {
    borderRadius: RADII.lg,
    backgroundColor: "rgba(255,253,248,0.96)",
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 8,
    ...SHADOWS.card,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: COLORS.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  separator: {
    height: 12,
  },
  candidateCard: {
    gap: 12,
    borderRadius: RADII.lg,
    backgroundColor: "rgba(255,253,248,0.98)",
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  candidateAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
  },
  candidateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  candidateTitleWrap: {
    flex: 1,
    gap: 4,
  },
  candidateTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  candidateMeta: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
  candidateBody: {
    color: COLORS.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  matchBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  matchBadgeOn: {
    backgroundColor: COLORS.tealSoft,
  },
  matchBadgeOff: {
    backgroundColor: "#F7DFC0",
  },
  matchBadgeLabel: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: "700",
  },
  manualSection: {
    gap: 10,
  },
  coordinateRow: {
    flexDirection: "row",
    gap: 10,
  },
  coordinateColumn: {
    flex: 1,
    gap: 6,
  },
  coordinateText: {
    color: COLORS.inkMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
    paddingVertical: 14,
  },
  secondaryLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
