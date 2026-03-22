import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  updateCategory as updateCategoryRequest,
} from "../../services/categories";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../stores/authStore";
import { useCategories } from "../../stores/categoryStore";

const COLOR_OPTIONS = [
  "#E85D5D",
  "#F59E0B",
  "#10B981",
  "#0EA5E9",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#111827",
];

export default function SettingsScreen() {
  const isFocused = useIsFocused();
  const { logout } = useAuth();
  const { categories, isLoading, error, loadCategories } = useCategories();
  const [name, setName] = useState("");
  const [selectedColorCode, setSelectedColorCode] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColorCode, setEditColorCode] = useState(COLOR_OPTIONS[0]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void loadCategories();
  }, [isFocused, loadCategories]);

  const handleCreateCategory = async () => {
    if (name.trim().length === 0) {
      Alert.alert("입력 확인", "카테고리 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCategoryRequest({
        name: name.trim(),
        colorCode: selectedColorCode,
      });
      setName("");
      await loadCategories();
    } catch (createError) {
      Alert.alert("카테고리 생성 실패", getErrorMessage(createError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (id: number, currentName: string, currentColorCode: string) => {
    setEditingId(id);
    setEditName(currentName);
    setEditColorCode(currentColorCode);
  };

  const handleSaveEdit = async () => {
    if (editingId === null || editName.trim().length === 0) {
      Alert.alert("입력 확인", "카테고리 이름을 입력해주세요.");
      return;
    }

    setIsSavingEdit(true);

    try {
      await updateCategoryRequest(editingId, {
        name: editName.trim(),
        colorCode: editColorCode,
      });
      setEditingId(null);
      await loadCategories();
    } catch (editError) {
      Alert.alert("카테고리 수정 실패", getErrorMessage(editError));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCategory = (id: number) => {
    Alert.alert("카테고리 삭제", "이 카테고리를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setDeletingId(id);

            try {
              await deleteCategoryRequest(id);
              await loadCategories();
            } catch (deleteError) {
              Alert.alert("카테고리 삭제 실패", getErrorMessage(deleteError));
            } finally {
              setDeletingId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>SYSTEM</Text>
          <Text style={styles.title}>지도에 쌓이는 분류 기준을 직접 다듬으세요.</Text>
          <Text style={styles.subtitle}>
            카테고리 색과 이름을 정리하고, 지금 세션을 안전하게 마무리할 수 있습니다.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>새 카테고리 추가</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="예: 디저트, 데이트, 출장"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>색상 선택</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((colorCode) => {
              const isSelected = selectedColorCode === colorCode;

              return (
                <Pressable
                  key={colorCode}
                  style={[
                    styles.colorButton,
                    { backgroundColor: colorCode },
                    isSelected && styles.colorButtonSelected,
                  ]}
                  onPress={() => setSelectedColorCode(colorCode)}
                />
              );
            })}
          </View>

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            disabled={isSubmitting}
            onPress={() => void handleCreateCategory()}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonLabel}>카테고리 추가</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리 목록</Text>
          {isLoading ? <ActivityIndicator size="small" color={COLORS.teal} /> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {categories.length === 0 && !isLoading ? (
            <Text style={styles.emptyText}>아직 생성된 카테고리가 없습니다.</Text>
          ) : null}

          {categories.map((category) =>
            editingId === category.id ? (
              <View key={category.id} style={styles.editRow}>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={[styles.input, styles.editNameInput]}
                  autoFocus
                />
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((colorCode) => (
                    <Pressable
                      key={colorCode}
                      style={[
                        styles.colorButton,
                        { backgroundColor: colorCode },
                        editColorCode === colorCode && styles.colorButtonSelected,
                      ]}
                      onPress={() => setEditColorCode(colorCode)}
                    />
                  ))}
                </View>
                <View style={styles.editActions}>
                  <Pressable
                    style={[styles.editSaveButton, isSavingEdit && styles.buttonDisabled]}
                    disabled={isSavingEdit}
                    onPress={() => void handleSaveEdit()}
                  >
                    {isSavingEdit ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.editSaveLabel}>저장</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.editCancelButton}
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.editCancelLabel}>취소</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View key={category.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: category.colorCode }]} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>

                <View style={styles.categoryActions}>
                  <Pressable
                    style={styles.editChip}
                    onPress={() => handleStartEdit(category.id, category.name, category.colorCode)}
                  >
                    <Text style={styles.editChipLabel}>수정</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.deleteChip,
                      deletingId === category.id && styles.buttonDisabled,
                    ]}
                    disabled={deletingId === category.id}
                    onPress={() => handleDeleteCategory(category.id)}
                  >
                    {deletingId === category.id ? (
                      <ActivityIndicator size="small" color="#B91C1C" />
                    ) : (
                      <Text style={styles.deleteChipLabel}>삭제</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )
          )}
        </View>

        <Pressable style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutButtonLabel}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 110,
  },
  heroCard: {
    gap: 10,
    borderRadius: RADII.xl,
    padding: 20,
    backgroundColor: "rgba(255,249,239,0.94)",
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.card,
  },
  kicker: {
    color: COLORS.teal,
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
  card: {
    gap: 14,
    borderRadius: RADII.lg,
    backgroundColor: "rgba(255,253,248,0.96)",
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.card,
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: 18,
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
  fieldLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonSelected: {
    borderColor: COLORS.ink,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
  },
  primaryButtonLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.inkMuted,
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: RADII.sm,
    backgroundColor: "rgba(244,239,226,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  categoryName: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  editChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: "center",
  },
  editChipLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: "#F0B2A7",
    backgroundColor: "#FCEAE6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: "center",
  },
  deleteChipLabel: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  editRow: {
    gap: 10,
    borderRadius: RADII.sm,
    backgroundColor: "rgba(244,239,226,0.72)",
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  editNameInput: {
    backgroundColor: COLORS.white,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  editSaveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.sm,
    backgroundColor: COLORS.ink,
    paddingVertical: 12,
  },
  editSaveLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  editCancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
  },
  editCancelLabel: {
    color: COLORS.inkMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 16,
  },
  logoutButtonLabel: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "700",
  },
});
