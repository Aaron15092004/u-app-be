import React, { useEffect, useRef } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import {
  checkInHabitApi,
  getTodayHabitsApi,
  getWeeklyHabitsApi,
  getStreakApi,
} from "../../../lib/api/habits.api";
import { logWaterApi } from "../../../lib/api/water.api";
import { getTodaySummaryApi } from "../../../lib/api/home.api";
import { getProfileStatsApi } from "../../../lib/api/users.api";
import type {
  IHabitId,
  ITodayHabits,
  ITodaySummary,
} from "../../../lib/api/types";
import {
  PRIMARY,
  PRIMARY_DARK,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
  INACTIVE,
} from "../../../constants/colors";

// ─── Habit definitions ────────────────────────────────────────────────────────

type HabitMode = "water-log" | "auto" | "manual";

type HabitDef = {
  id: IHabitId;
  name: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  barColor: string;
  mode: HabitMode;
};

const HABITS: HabitDef[] = [
  {
    id: "water",
    name: "Uống 8 ly nước",
    icon: "water-outline",
    iconColor: "#2196F3",
    iconBg: "#E3F2FD",
    barColor: "#2196F3",
    mode: "water-log",
  },
  {
    id: "vegetables",
    name: "Ăn đủ chất",
    icon: "nutrition-outline",
    iconColor: "#4CAF50",
    iconBg: "#E8F5E9",
    barColor: "#4CAF50",
    mode: "auto",
  },
  {
    id: "exercise",
    name: "Tập luyện hôm nay",
    icon: "barbell-outline",
    iconColor: "#FF6B35",
    iconBg: "#FFF3EE",
    barColor: "#FF6B35",
    mode: "auto",
  },
  {
    id: "sleep",
    name: "Ngủ đủ 8 tiếng",
    icon: "moon-outline",
    iconColor: "#7C3AED",
    iconBg: "#F5F3FF",
    barColor: "#7C3AED",
    mode: "manual",
  },
  {
    id: "nut-milk",
    name: "Uống sữa hạt từ Ủ",
    icon: "cafe-outline",
    iconColor: "#F59E0B",
    iconBg: "#FFFBEB",
    barColor: "#F59E0B",
    mode: "manual",
  },
];

const TOTAL = HABITS.length;

// ─── Week helpers ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toYMD(d);
  });
}

// ─── Per-habit progress ───────────────────────────────────────────────────────

type Progress = {
  current: number;
  total: number;
  unit: string;
  percent: number;
};

function getProgress(
  id: IHabitId,
  isCompleted: boolean,
  summary: ITodaySummary | undefined,
  targetKcal: number,
): Progress {
  switch (id) {
    case "water": {
      const c = summary?.waterGlasses ?? 0;
      const t = summary?.waterGoal ?? 8;
      return {
        current: c,
        total: t,
        unit: "cốc",
        percent: Math.min(1, t > 0 ? c / t : 0),
      };
    }
    case "vegetables": {
      const c = Math.round(summary?.kcalConsumed ?? 0);
      const t = targetKcal;
      return {
        current: c,
        total: t,
        unit: "kcal",
        percent: Math.min(1, t > 0 ? c / t : 0),
      };
    }
    case "exercise": {
      const c = summary?.workoutMinutes ?? 0;
      return {
        current: c,
        total: 30,
        unit: "phút",
        percent: Math.min(1, c / 30),
      };
    }
    default: {
      const done = isCompleted ? 1 : 0;
      return {
        current: done,
        total: 1,
        unit: id === "nut-milk" ? "cốc" : "lần",
        percent: done,
      };
    }
  }
}

function isAutoMet(
  id: IHabitId,
  summary: ITodaySummary | undefined,
  targetKcal: number,
): boolean {
  if (!summary) return false;
  if (id === "water") return summary.waterGlasses >= summary.waterGoal;
  if (id === "vegetables") {
    return (
      summary.kcalConsumed >= targetKcal * 0.85 &&
      summary.macros.protein > 0 &&
      summary.macros.carbs > 0 &&
      summary.macros.fat > 0
    );
  }
  if (id === "exercise") return summary.workoutMinutes >= 30;
  return false;
}

// ─── Habit card ────────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  isCompleted,
  progress,
  onAction,
  isLoading,
}: {
  habit: HabitDef;
  isCompleted: boolean;
  progress: Progress;
  onAction: (() => void) | null;
  isLoading: boolean;
}): React.JSX.Element {
  const pct = progress.percent;
  const showCompleted = isCompleted || (habit.mode === "auto" && pct >= 1);

  const actionLabel =
    habit.mode === "water-log"
      ? "Đánh dấu +1"
      : habit.mode === "manual"
        ? "Xác nhận"
        : null;

  return (
    <View style={cardSt.card}>
      {/* Header row */}
      <View style={cardSt.header}>
        <View style={[cardSt.iconBox, { backgroundColor: habit.iconBg }]}>
          <Ionicons
            name={habit.icon as never}
            size={20}
            color={habit.iconColor}
          />
        </View>
        <View style={cardSt.nameCol}>
          <Text style={cardSt.name}>{habit.name}</Text>
          <Text style={cardSt.progress}>
            {progress.current}/{progress.total} {progress.unit}
          </Text>
        </View>
        {showCompleted && (
          <View
            style={[cardSt.checkCircle, { backgroundColor: habit.iconColor }]}
          >
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={cardSt.barTrack}>
        <View
          style={[
            cardSt.barFill,
            {
              width: `${Math.round(pct * 100)}%` as `${number}%`,
              backgroundColor: habit.barColor,
            },
          ]}
        />
      </View>

      {/* Auto hint */}
      {habit.mode === "auto" && !showCompleted && (
        <Text style={cardSt.autoHint}>
          Tự động cập nhật từ hoạt động của bạn
        </Text>
      )}

      {/* Action button */}
      {showCompleted ? (
        <View style={cardSt.doneBtn}>
          <Ionicons name="checkmark" size={14} color={TEXT_SECONDARY} />
          <Text style={cardSt.doneBtnText}>Hoàn thành</Text>
        </View>
      ) : actionLabel ? (
        <Pressable
          style={[cardSt.actionBtn, isLoading && { opacity: 0.6 }]}
          onPress={isLoading ? undefined : (onAction ?? undefined)}
          disabled={isLoading}
        >
          <Text style={cardSt.actionBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const cardSt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameCol: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: TEXT },
  progress: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 1 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  barTrack: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  barFill: { height: "100%", borderRadius: 3 },
  autoHint: {
    fontSize: 11,
    color: INACTIVE,
    marginBottom: 10,
    fontStyle: "italic",
  },
  actionBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 12,
  },
  doneBtnText: { fontSize: 14, fontWeight: "600", color: TEXT_SECONDARY },
});

// ─── Progress card ─────────────────────────────────────────────────────────────

function ProgressCard({
  completed,
  total,
}: {
  completed: number;
  total: number;
}): React.JSX.Element {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const encouragement =
    pct === 100
      ? "Tuyệt vời! Hoàn thành rồi!"
      : pct >= 50
        ? "Tiếp tục phát huy!"
        : "Bắt đầu thôi nào!";

  return (
    <View style={progSt.card}>
      <Text style={progSt.title}>Tiến độ hôm nay</Text>
      <Text style={progSt.sub}>
        {completed}/{total} thói quen hoàn thành
      </Text>
      <View style={progSt.barTrack}>
        <LinearGradient
          colors={[PRIMARY, PRIMARY_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[progSt.barFill, { width: `${pct}%` as `${number}%` }]}
        />
      </View>
      <View style={progSt.footer}>
        <Text style={progSt.footerText}>{encouragement}</Text>
        <Text style={progSt.pctText}>{pct}%</Text>
      </View>
    </View>
  );
}

const progSt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  title: { fontSize: 16, fontWeight: "700", color: TEXT, marginBottom: 4 },
  sub: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 14 },
  barTrack: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  barFill: { height: "100%", borderRadius: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 13, color: TEXT_SECONDARY },
  pctText: { fontSize: 14, fontWeight: "700", color: PRIMARY_DARK },
});

// ─── Streak card ──────────────────────────────────────────────────────────────

function StreakCard({
  streakDays,
  weekDates,
  weeklyMap,
}: {
  streakDays: number;
  weekDates: string[];
  weeklyMap: Record<string, boolean>;
}): React.JSX.Element {
  const todayStr = toYMD(new Date());

  return (
    <View style={streakSt.card}>
      <View style={streakSt.topRow}>
        <View style={streakSt.left}>
          <Text style={streakSt.title}>Chuỗi ngày liên tiếp</Text>
          <Text style={streakSt.sub}>
            {streakDays > 0 ? "Bạn đang làm rất tốt!" : "Bắt đầu hôm nay nhé!"}
          </Text>
        </View>
        <View style={streakSt.countBox}>
          <Text style={streakSt.countNum}>{streakDays}</Text>
          <Text style={streakSt.countLbl}>ngày</Text>
        </View>
      </View>

      <View style={streakSt.dayRow}>
        {weekDates.map((date, i) => {
          const qualified = weeklyMap[date] ?? false;
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          const circleColor = isFuture
            ? "#E0E0E0"
            : isToday
              ? "#FF6B35"
              : qualified
                ? PRIMARY
                : "#E0E0E0";
          const showCheck = qualified || (isToday && qualified);

          return (
            <View key={date} style={streakSt.dayCol}>
              <View style={[streakSt.circle, { backgroundColor: circleColor }]}>
                {(qualified || isToday) && !isFuture ? (
                  <Ionicons name="checkmark" size={13} color="#FFF" />
                ) : null}
              </View>
              <Text
                style={[
                  streakSt.dayLabel,
                  (qualified || isToday) && !isFuture && { color: TEXT },
                ]}
              >
                {DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const streakSt = StyleSheet.create({
  card: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  left: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: TEXT },
  sub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  countBox: { alignItems: "center" },
  countNum: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FF6B35",
    lineHeight: 36,
  },
  countLbl: { fontSize: 12, color: TEXT_SECONDARY },
  dayRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCol: { alignItems: "center", flex: 1 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayLabel: { fontSize: 11, color: INACTIVE },
});

// ─── Tips card ─────────────────────────────────────────────────────────────────

function TipsCard(): React.JSX.Element {
  return (
    <View style={tipsSt.card}>
      <Text style={tipsSt.title}>Mẹo xây dựng thói quen</Text>
      {[
        "Bắt đầu với thói quen nhỏ, dễ thực hiện",
        "Duy trì ít nhất 21 ngày liên tiếp",
        "Đặt lời nhắc để không quên",
        "Kết nối thói quen mới với thói quen cũ",
      ].map((tip) => (
        <Text key={tip} style={tipsSt.tip}>
          • {tip}
        </Text>
      ))}
    </View>
  );
}

const tipsSt = StyleSheet.create({
  card: {
    backgroundColor: "#F1F8E9",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 10,
  },
  tip: { fontSize: 13, color: "#388E3C", lineHeight: 22 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HabitsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const autoSyncedRef = useRef<Set<IHabitId>>(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────────
  const todayQ = useQuery({
    queryKey: ["habits", "today"],
    queryFn: getTodayHabitsApi,
  });
  const weeklyQ = useQuery({
    queryKey: ["habits", "weekly"],
    queryFn: getWeeklyHabitsApi,
  });
  const streakQ = useQuery({
    queryKey: ["habits", "streak"],
    queryFn: getStreakApi,
  });
  const summaryQ = useQuery({
    queryKey: ["home", "summary"],
    queryFn: getTodaySummaryApi,
    staleTime: 30_000,
  });
  const statsQ = useQuery({
    queryKey: ["users", "profile", "stats"],
    queryFn: getProfileStatsApi,
  });

  const completedSet = new Set(todayQ.data?.completed ?? []);
  const targetKcal =
    (statsQ.data as { dailyTargets?: { kcal: number } } | undefined)
      ?.dailyTargets?.kcal ?? 2000;

  // ── Auto-sync effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!summaryQ.data || !todayQ.data) return;

    const AUTO_IDS: IHabitId[] = ["water", "vegetables", "exercise"];
    for (const id of AUTO_IDS) {
      if (
        isAutoMet(id, summaryQ.data, targetKcal) &&
        !completedSet.has(id) &&
        !autoSyncedRef.current.has(id)
      ) {
        autoSyncedRef.current.add(id);
        void checkInHabitApi(id).then(() => {
          void qc.invalidateQueries({ queryKey: ["habits", "today"] });
          void qc.invalidateQueries({ queryKey: ["habits", "weekly"] });
          void qc.invalidateQueries({ queryKey: ["habits", "streak"] });
        });
      }
    }
  }, [summaryQ.data, todayQ.data, targetKcal]);

  // ── Mutations ──────────────────────────────────────────────────────────────────
  const checkInMutation = useMutation({
    mutationFn: (id: IHabitId) => checkInHabitApi(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["habits", "today"] });
      const prev = qc.getQueryData<ITodayHabits>(["habits", "today"]);
      qc.setQueryData<ITodayHabits>(["habits", "today"], (old) => {
        if (!old) return old;
        const completed = old.completed.includes(id)
          ? old.completed
          : [...old.completed, id];
        return {
          completed,
          progress: {
            count: completed.length,
            percent: Math.round((completed.length / TOTAL) * 100),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["habits", "today"], ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["habits", "today"] });
      void qc.invalidateQueries({ queryKey: ["habits", "weekly"] });
      void qc.invalidateQueries({ queryKey: ["habits", "streak"] });
    },
  });

  const waterMutation = useMutation({
    mutationFn: () => logWaterApi(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["home", "summary"] });
      void qc.invalidateQueries({ queryKey: ["water", "today"] });
    },
  });

  // ── Weekly circles data ────────────────────────────────────────────────────────
  const weekDates = getWeekDates();
  const weeklyMap: Record<string, boolean> = {};
  for (const entry of weeklyQ.data ?? []) {
    weeklyMap[entry.date] = entry.qualified;
  }

  // ── Completed count (use 5 habits, not server percent) ───────────────────────
  const relevantIds: IHabitId[] = [
    "water",
    "vegetables",
    "exercise",
    "sleep",
    "nut-milk",
  ];
  const completedCount = relevantIds.filter((id) =>
    completedSet.has(id),
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <LinearGradient
        colors={[PRIMARY_DARK, PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <Text style={styles.headerTitle}>Thói quen</Text>
        <Text style={styles.headerSub}>
          Theo dõi thói quen lành mạnh hàng ngày
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress card */}
        <ProgressCard completed={completedCount} total={TOTAL} />

        {/* Streak card */}
        <StreakCard
          streakDays={streakQ.data?.streakDays ?? 0}
          weekDates={weekDates}
          weeklyMap={weeklyMap}
        />

        {/* Habit list */}
        <Text style={styles.listTitle}>Danh sách thói quen</Text>

        {todayQ.isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.skeleton} />
            ))
          : HABITS.map((habit) => {
              const isCompleted = completedSet.has(habit.id);
              const prog = getProgress(
                habit.id,
                isCompleted,
                summaryQ.data,
                targetKcal,
              );

              let onAction: (() => void) | null = null;
              if (habit.mode === "water-log" && !isCompleted) {
                onAction = () => waterMutation.mutate();
              } else if (habit.mode === "manual" && !isCompleted) {
                onAction = () => checkInMutation.mutate(habit.id);
              }

              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompleted={isCompleted}
                  progress={prog}
                  onAction={onAction}
                  isLoading={
                    checkInMutation.isPending || waterMutation.isPending
                  }
                />
              );
            })}

        {/* Tips */}
        <TipsCard />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginTop: 24,
    marginBottom: 12,
  },
  skeleton: {
    height: 130,
    backgroundColor: "#E8E8E8",
    borderRadius: 16,
    marginBottom: 10,
  },
});
