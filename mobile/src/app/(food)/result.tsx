import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useFoodScanStore } from "../../stores/foodScanStore";
import { saveFoodLogApi, uploadFoodLogImageApi } from "../../lib/api/food.api";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  PRIMARY,
  PRIMARY_DARK,
  BACKGROUND,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
} from "../../constants/colors";

import { VITAMIN_META, MINERAL_META } from "../../constants/nutrition";

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return <Text style={secSt.label}>{title}</Text>;
}

const secSt = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginTop: 24,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
});

// ─── Single nutrition row ─────────────────────────────────────────────────────

function NutrRow({
  icon,
  iconColor,
  label,
  value,
  unit,
  hero,
  last,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: number;
  unit: string;
  hero?: boolean;
  last?: boolean;
}): React.JSX.Element {
  const formatted = value % 1 === 0 ? String(value) : value.toFixed(1);
  return (
    <View style={[rowSt.row, last && { borderBottomWidth: 0 }]}>
      <View style={rowSt.left}>
        <View style={[rowSt.iconWrap, { backgroundColor: iconColor + "18" }]}>
          <Ionicons name={icon as never} size={15} color={iconColor} />
        </View>
        <Text style={[rowSt.label, hero && rowSt.heroLabel]}>{label}</Text>
      </View>
      <View style={rowSt.right}>
        <Text style={[rowSt.value, hero && rowSt.heroValue]}>{formatted}</Text>
        <Text style={[rowSt.unit, hero && rowSt.heroUnit]}>{unit}</Text>
      </View>
    </View>
  );
}

const rowSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, color: TEXT, flex: 1 },
  heroLabel: { fontSize: 15, fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  value: { fontSize: 14, fontWeight: "600", color: TEXT },
  heroValue: { fontSize: 17, fontWeight: "700", color: PRIMARY_DARK },
  unit: { fontSize: 12, color: TEXT_SECONDARY, minWidth: 28, textAlign: "left" },
  heroUnit: { fontSize: 13 },
});

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={cardSt.card}>{children}</View>;
}

const cardSt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ResultScreen(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { scanResult, pendingImageUri, clearScan } = useFoodScanStore();
  const [isSaving, setIsSaving] = useState(false);

  if (!scanResult) return null;

  const { foods, totals } = scanResult;
  const imageSource = scanResult.imageUrl ?? pendingImageUri;

  // Aggregate macros across all foods
  const fiber = foods.reduce((s, f) => s + (f.fiber ?? 0), 0);
  const sugar = foods.reduce((s, f) => s + (f.sugar ?? 0), 0);

  // Aggregate vitamins and minerals from nested objects across all foods
  const allVitamins: Record<string, number> = {};
  const allMinerals: Record<string, number> = {};
  for (const f of foods) {
    for (const [k, v] of Object.entries(f.vitamins ?? {})) {
      allVitamins[k] = (allVitamins[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(f.minerals ?? {})) {
      allMinerals[k] = (allMinerals[k] ?? 0) + v;
    }
  }
  const vitaminEntries = Object.entries(allVitamins).filter(([, v]) => v > 0);
  const mineralEntries = Object.entries(allMinerals).filter(([, v]) => v > 0);

  async function handleSave(): Promise<void> {
    if (!scanResult) return;
    setIsSaving(true);
    try {
      const saved = await saveFoodLogApi({
        foods: scanResult.foods.map((f) => ({
          name: f.name,
          weightG: f.weightG,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          fiber: f.fiber,
          sugar: f.sugar,
          // Flat backward-compat fields
          sodium: f.minerals?.sodium ?? 0,
          vitaminC: f.vitamins?.vitaminC ?? 0,
          // Full nested objects for rich storage
          vitamins: f.vitamins ?? {},
          minerals: f.minerals ?? {},
          tags: f.tags ?? [],
          source: f.source ?? (scanResult.aiProvider === "manual" ? "manual" : "ai_scan"),
          barcode: f.barcode,
          provenance: f.provenance ?? {},
        })),
        totals: scanResult.totals,
        aiProvider: scanResult.aiProvider,
        imageUrl: null,
      });

      if (pendingImageUri) {
        void uploadFoodLogImageApi(saved._id, pendingImageUri)
          .then(() => qc.invalidateQueries({ queryKey: ["food", "logs"] }))
          .catch(() => null);
      }

      await qc.invalidateQueries({ queryKey: ["food", "logs"] });
      clearScan();
      router.replace("/(tabs)/food" as never);
    } catch (err: unknown) {
      setIsSaving(false);
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = e?.response?.data?.error ?? e?.message ?? "Vui lòng thử lại.";
      Alert.alert("Lưu thất bại", msg);
    }
  }

  function handleRetry(): void {
    clearScan();
    router.back();
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Gradient header */}
      <LinearGradient
        colors={[PRIMARY_DARK, PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable style={styles.backBtn} onPress={handleRetry}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Kết quả phân tích</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {foods.length > 1 ? `${foods.length} món ăn` : (foods[0]?.name ?? "Bữa ăn")}
          </Text>
        </View>
        <View style={styles.calBadge}>
          <Text style={styles.calNum}>{Math.round(totals.calories)}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Food photo */}
        {imageSource ? (
          <View style={styles.photoCard}>
            <Image source={{ uri: imageSource }} style={styles.photo} />
          </View>
        ) : (
          <View style={[styles.photoCard, styles.photoPlaceholder]}>
            <Ionicons name="image-outline" size={40} color={TEXT_SECONDARY} />
          </View>
        )}

        {scanResult.commentVi ? (
          <>
            <SectionHeader title="Nhận xét nhanh" />
            <View style={styles.commentCard}>
              <View style={styles.commentIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={PRIMARY_DARK} />
              </View>
              <Text style={styles.commentText}>{scanResult.commentVi}</Text>
            </View>
          </>
        ) : null}

        {/* Dinh duong chinh */}
        <SectionHeader title="Dinh dưỡng chính" />
        <Card>
          <NutrRow icon="flame-outline"   iconColor="#FF5722" label="Năng lượng" value={totals.calories} unit="kcal" hero />
          <NutrRow icon="barbell-outline" iconColor="#4CAF50" label="Chất đạm"   value={totals.protein}  unit="g" />
          <NutrRow icon="pizza-outline"   iconColor="#FF9800" label="Tinh bột"   value={totals.carbs}    unit="g" />
          <NutrRow icon="water-outline"   iconColor="#FFC107" label="Chất béo"   value={totals.fat}      unit="g" />
          <NutrRow icon="leaf-outline"    iconColor="#8BC34A" label="Chất xơ"    value={fiber}           unit="g" last={sugar <= 0} />
          {sugar > 0 && (
            <NutrRow icon="cafe-outline"  iconColor="#EC407A" label="Đường"      value={sugar}           unit="g" last />
          )}
        </Card>

        {/* Vitamins — dynamic, only shown when Gemini returns data */}
        {vitaminEntries.length > 0 && (
          <>
            <SectionHeader title="Vitamin" />
            <Card>
              {vitaminEntries.map(([key, value], i) => {
                const meta = VITAMIN_META[key] ?? { label: key, unit: "mg", icon: "star-outline", color: "#9E9E9E" };
                return (
                  <NutrRow
                    key={key}
                    icon={meta.icon}
                    iconColor={meta.color}
                    label={meta.label}
                    value={value}
                    unit={meta.unit}
                    last={i === vitaminEntries.length - 1}
                  />
                );
              })}
            </Card>
          </>
        )}

        {/* Minerals — dynamic */}
        {mineralEntries.length > 0 && (
          <>
            <SectionHeader title="Khoáng chất" />
            <Card>
              {mineralEntries.map(([key, value], i) => {
                const meta = MINERAL_META[key] ?? { label: key, unit: "mg", icon: "flask-outline", color: "#9E9E9E" };
                return (
                  <NutrRow
                    key={key}
                    icon={meta.icon}
                    iconColor={meta.color}
                    label={meta.label}
                    value={value}
                    unit={meta.unit}
                    last={i === mineralEntries.length - 1}
                  />
                );
              })}
            </Card>
          </>
        )}

        {/* Chi tiet tung mon */}
        {foods.length > 0 && (
          <>
            <SectionHeader title="Chi tiết từng món" />
            <Card>
              {foods.map((f, i) => (
                <View
                  key={i}
                  style={[styles.foodRow, i === foods.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.foodLeft}>
                    <Text style={styles.foodName}>{f.name}</Text>
                    {f.weightG > 0 && (
                      <Text style={styles.foodWeight}>{f.weightG}g</Text>
                    )}
                  </View>
                  <Text style={styles.foodCal}>{Math.round(f.calories)} kcal</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <PrimaryButton
          label="Lưu bữa ăn"
          onPress={handleSave}
          loading={isSaving}
          variant="filled"
        />
        <Pressable style={styles.retryBtn} onPress={handleRetry}>
          <Text style={styles.retryText}>Chụp lại</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  calBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  calNum: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  calUnit: { fontSize: 10, color: "rgba(255,255,255,0.85)" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  photoCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: SURFACE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  photo: { width: "100%", height: 220, resizeMode: "cover" },
  photoPlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  commentCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F1F8E9",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#CDE8B5",
  },
  commentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#DFF2C9",
    alignItems: "center",
    justifyContent: "center",
  },
  commentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  foodLeft: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: "600", color: TEXT },
  foodWeight: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 },
  foodCal: { fontSize: 14, fontWeight: "600", color: PRIMARY_DARK },
  bottomBar: {
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EEEEEE",
    gap: 8,
  },
  retryBtn: { alignItems: "center", paddingVertical: 10 },
  retryText: { fontSize: 15, fontWeight: "600", color: TEXT_SECONDARY },
});
