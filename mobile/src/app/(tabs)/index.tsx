import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { getTodaySummaryApi, getShopUrlApi } from "../../lib/api/home.api";
import { getProfileStatsApi } from "../../lib/api/users.api";
import { logWaterApi } from "../../lib/api/water.api";
import NotificationRationaleModal from "../../components/ui/NotificationRationaleModal";
import TodaySummaryRow from "../../components/ui/TodaySummaryRow";
import NutritionProgressCard from "../../components/ui/NutritionProgressCard";
import BMIWidget from "../../components/ui/BMIWidget";
import ShopBanner from "../../components/ui/ShopBanner";
import QuickActionsRow from "../../components/ui/QuickActionsRow";
import {
  BACKGROUND,
  PRIMARY,
  PRIMARY_DARK,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
} from "../../constants/colors";
import { getNotifAsked, setNotifAsked } from "../../lib/storage/mmkv";

// ─── Water card ──────────────────────────────────────────────────────────────

function WaterCard({
  glasses,
  goal,
  onAdd,
  isAdding,
}: {
  glasses: number;
  goal: number;
  onAdd: () => void;
  isAdding: boolean;
}): React.JSX.Element {
  const pct = goal > 0 ? Math.min(1, glasses / goal) : 0;
  const done = glasses >= goal;
  return (
    <View style={waterSt.card}>
      <View style={waterSt.header}>
        <View style={waterSt.iconBox}>
          <Ionicons name="water" size={18} color="#2196F3" />
        </View>
        <View style={waterSt.info}>
          <Text style={waterSt.title}>Uống nước</Text>
          <Text style={waterSt.sub}>
            {glasses}/{goal} ly hôm nay
          </Text>
        </View>
        {done ? (
          <View style={waterSt.doneBadge}>
            <Ionicons name="checkmark-circle" size={22} color="#2196F3" />
          </View>
        ) : (
          <Pressable
            style={[waterSt.addBtn, isAdding && { opacity: 0.6 }]}
            onPress={isAdding ? undefined : onAdd}
            disabled={isAdding}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={waterSt.addBtnText}>+1 ly</Text>
          </Pressable>
        )}
      </View>
      <View style={waterSt.barTrack}>
        <View style={[waterSt.barFill, { width: `${Math.round(pct * 100)}%` as `${number}%` }]} />
      </View>
      <View style={waterSt.glassRow}>
        {Array.from({ length: Math.min(goal, 10) }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < glasses ? "water" : "water-outline"}
            size={16}
            color={i < glasses ? "#2196F3" : "#BDBDBD"}
          />
        ))}
        {goal > 10 && <Text style={waterSt.moreText}>+{goal - 10}</Text>}
      </View>
    </View>
  );
}

const waterSt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#E3F2FD",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", color: TEXT },
  sub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 },
  doneBadge: { padding: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#2196F3", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  barTrack: { height: 5, backgroundColor: "#E3F2FD", borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  barFill: { height: "100%", borderRadius: 3, backgroundColor: "#2196F3" },
  glassRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  moreText: { fontSize: 12, color: TEXT_SECONDARY, marginLeft: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

function getVietnameseDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
}

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [showNotificationRationale, setShowNotificationRationale] = useState(false);

  useEffect(() => {
    if (!getNotifAsked()) {
      setShowNotificationRationale(true);
    }
  }, []);

  const handleNotificationAccept = async (): Promise<void> => {
    setNotifAsked(true);
    setShowNotificationRationale(false);
    router.push("/(tabs)/profile/notifications" as never);
  };

  const handleNotificationDismiss = (): void => {
    setNotifAsked(true);
    setShowNotificationRationale(false);
  };

  const waterMutation = useMutation({
    mutationFn: () => logWaterApi(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["home", "summary"] });
      void qc.invalidateQueries({ queryKey: ["water", "today"] });
      void qc.invalidateQueries({ queryKey: ["habits", "today"] });
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["home", "summary"],
    queryFn: getTodaySummaryApi,
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: ["users", "profile", "stats"],
    queryFn: getProfileStatsApi,
    staleTime: 5 * 60_000,
  });

  const shopUrlQuery = useQuery({
    queryKey: ["config", "shop-url"],
    queryFn: getShopUrlApi,
    staleTime: 60 * 60 * 1000,
  });

  const name = auth.user?.name ?? "bạn";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />

      {/* ── Gradient header with rounded bottom corners ── */}
      <LinearGradient
        colors={[PRIMARY_DARK, PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greeting}>Xin chào, {name}!</Text>
            <Text style={styles.dateSubline}>{getVietnameseDate()}</Text>
          </View>
          <Pressable
            style={styles.bellButton}
            accessibilityLabel="Thông báo"
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/profile/notifications" as never)}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Stats white card inside header */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardLabel}>Tổng quan hôm nay</Text>
          {summaryQuery.isLoading || summaryQuery.isError ? (
            <View style={styles.statsSkeletonRow}>
              <View style={styles.statsSkeleton} />
              <View style={styles.statsSkeleton} />
              <View style={styles.statsSkeleton} />
            </View>
          ) : (
            <TodaySummaryRow
              kcal={summaryQuery.data!.kcalConsumed}
              waterGlasses={summaryQuery.data!.waterGlasses}
              waterGoal={summaryQuery.data!.waterGoal}
              workoutMinutes={summaryQuery.data!.workoutMinutes}
              onWaterPress={() => router.push("/(home)/water")}
            />
          )}
        </View>
      </LinearGradient>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hành động nhanh</Text>
        <QuickActionsRow
          onScan={() => router.push("/(food)/scan")}
          onWorkout={() => router.push("/(tabs)/exercises")}
          onHabits={() => router.push("/(tabs)/habits")}
        />

        {/* Water card */}
        {!summaryQuery.isLoading && (
          <WaterCard
            glasses={summaryQuery.data?.waterGlasses ?? 0}
            goal={summaryQuery.data?.waterGoal ?? 8}
            onAdd={() => waterMutation.mutate()}
            isAdding={waterMutation.isPending}
          />
        )}

        {/* BMI Widget */}
        <View style={styles.sectionGap}>
          <BMIWidget
            bmi={summaryQuery.data?.bmi ?? null}
            onPress={() => router.push("/(tabs)/bmi")}
          />
        </View>

        {/* Nutrition — title lives inside the card now */}
        <View style={styles.sectionGap}>
          <NutritionProgressCard
            kcal={summaryQuery.data?.kcalConsumed ?? 0}
            macros={summaryQuery.data?.macros ?? { protein: 0, carbs: 0, fat: 0 }}
            kcalGoal={statsQuery.data?.dailyTargets.kcal}
            macroGoals={statsQuery.data?.dailyTargets}
            onSeeMore={() => router.push("/(tabs)/food" as never)}
          />
        </View>

        {/* Shop */}
        <ShopBanner
          url={shopUrlQuery.data?.url ?? null}
          isLoading={shopUrlQuery.isLoading}
        />
      </ScrollView>
      <NotificationRationaleModal
        visible={showNotificationRationale}
        onAccept={handleNotificationAccept}
        onDismiss={handleNotificationDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greetingLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dateSubline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  statsCardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    marginBottom: 12,
  },
  statsSkeletonRow: {
    flexDirection: "row",
    gap: 8,
  },
  statsSkeleton: {
    flex: 1,
    height: 56,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 12,
  },
  sectionGap: {
    marginTop: 16,
  },
});
