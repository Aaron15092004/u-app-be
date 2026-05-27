import React, { useState, useMemo } from "react";
import {
  Image,
  Modal,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import {
  getFoodLogsApi,
  getFoodLogsRangeApi,
  deleteFoodLogApi,
} from "../../../lib/api/food.api";
import { getProfileStatsApi } from "../../../lib/api/users.api";
import type { IFoodLog, IFoodDaySummary } from "../../../lib/api/types";
import { VITAMIN_META, MINERAL_META } from "../../../constants/nutrition";
import {
  BACKGROUND,
  PRIMARY,
  PRIMARY_DARK,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
  INACTIVE,
} from "../../../constants/colors";

// ─── Types ──────────────────────────────────────────────────────────────────

type Period = "day" | "week" | "month";

const KCAL_GOAL_DEFAULT = 2000;
const VN_DAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// ─── Date helpers ────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function getMonday(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - (r.getDay() === 0 ? 6 : r.getDay() - 1));
  return r;
}

function getRange(period: Period, offset: number) {
  const today = new Date();
  if (period === "day") {
    const d = addDays(today, offset);
    const label = offset === 0 ? "Hôm nay" : offset === -1 ? "Hôm qua" : `${d.getDate()}/${d.getMonth() + 1}`;
    return { from: toYMD(d), to: toYMD(d), label };
  }
  if (period === "week") {
    const start = addDays(getMonday(today), offset * 7);
    const end = addDays(start, 6);
    return { from: toYMD(start), to: toYMD(end), label: `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}` };
  }
  const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return {
    from: toYMD(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: toYMD(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
  };
}

// ─── Bar chart ───────────────────────────────────────────────────────────────

function BarChart({ data, kcalGoal }: { data: IFoodDaySummary[]; kcalGoal: number }): React.JSX.Element {
  const todayStr = toYMD(new Date());
  const max = Math.max(...data.map((d) => d.calories), 100);
  const CHART_H = 80;
  const isWeek = data.length <= 7;

  const bars = (
    <View style={[barSt.row, !isWeek && { gap: 3 }]}>
      {data.map((d) => {
        const h = d.calories > 0 ? Math.max(3, (d.calories / max) * CHART_H) : 3;
        const today = d.date === todayStr;
        const lbl = isWeek
          ? VN_DAY[new Date(d.date + "T12:00:00").getDay()]
          : String(parseInt(d.date.slice(8), 10));
        return (
          <View key={d.date} style={[barSt.col, !isWeek && { width: 18 }]}>
            <View style={barSt.track}>
              <LinearGradient
                colors={today ? [PRIMARY_DARK, PRIMARY_DARK] : [PRIMARY, "#D4E87A"]}
                style={[barSt.fill, { height: h }]}
              />
            </View>
            <Text style={[barSt.lbl, today && barSt.lblToday]}>{lbl}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={barSt.card}>
      <View style={barSt.titleRow}>
        <Text style={barSt.title}>Calo theo ngày</Text>
        <Text style={barSt.goal}>Mục tiêu {kcalGoal.toLocaleString("vi-VN")} kcal</Text>
      </View>
      {isWeek ? bars : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{bars}</ScrollView>}
    </View>
  );
}

const barSt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 13, fontWeight: "600", color: TEXT },
  goal: { fontSize: 11, color: INACTIVE },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  col: { flex: 1, alignItems: "center" },
  track: { width: "100%", height: 80, justifyContent: "flex-end", alignItems: "center" },
  fill: { width: "100%", borderRadius: 4 },
  lbl: { fontSize: 10, color: TEXT_SECONDARY, marginTop: 5 },
  lblToday: { color: PRIMARY_DARK, fontWeight: "700" },
});

// ─── Summary card ────────────────────────────────────────────────────────────

function SummaryCard({ calories, protein, carbs, fat, fiber, kcalGoal, period, activeDays }: {
  calories: number; protein: number; carbs: number; fat: number; fiber: number; kcalGoal: number;
  period: Period; activeDays: number;
}): React.JSX.Element {
  const isDay = period === "day";
  const d = Math.max(activeDays, 1);
  const displayCal = isDay ? Math.round(calories) : Math.round(calories / d);
  const displayProtein = isDay ? protein : protein / d;
  const displayCarbs = isDay ? carbs : carbs / d;
  const displayFat = isDay ? fat : fat / d;
  const displayFiber = isDay ? fiber : fiber / d;
  const pct = Math.min(displayCal / kcalGoal, 1);
  const overLimit = displayCal >= kcalGoal;
  const progressColors: [string, string] = overLimit
    ? ["#EF5350", "#B71C1C"]
    : [PRIMARY, PRIMARY_DARK];
  const subLine = isDay
    ? `/ ${kcalGoal.toLocaleString("vi-VN")} kcal`
    : `tb/ngày · tổng ${Math.round(calories).toLocaleString("vi-VN")} kcal`;
  return (
    <View style={sumSt.card}>
      <View style={sumSt.kcalRow}>
        <View>
          <Text style={[sumSt.kcalNum, overLimit && sumSt.kcalNumOver]}>
            {displayCal.toLocaleString("vi-VN")}
          </Text>
          <Text style={sumSt.kcalSub}>{subLine}</Text>
        </View>
        <View style={sumSt.pillRow}>
          <MacroPill label="Đạm" v={displayProtein} color="#4CAF50" />
          <MacroPill label="Carbs" v={displayCarbs} color="#FF6B35" />
          <MacroPill label="Béo" v={displayFat} color="#FFA726" />
          {displayFiber > 0 && <MacroPill label="Xơ" v={displayFiber} color="#66BB6A" />}
        </View>
      </View>
      <View style={sumSt.track}>
        <LinearGradient
          colors={progressColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[sumSt.fill, { width: `${pct * 100}%` as `${number}%` }]}
        />
      </View>
    </View>
  );
}

function MacroPill({ label, v, color }: { label: string; v: number; color: string }): React.JSX.Element {
  return (
    <View style={sumSt.pill}>
      <View style={[sumSt.dot, { backgroundColor: color }]} />
      <Text style={sumSt.pillText}>{Math.round(v)}g {label}</Text>
    </View>
  );
}

const sumSt = StyleSheet.create({
  card: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginTop: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  kcalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  kcalNum: { fontSize: 36, fontWeight: "700", color: TEXT, lineHeight: 40 },
  kcalNumOver: { color: "#EF5350" },
  kcalSub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  pillRow: { gap: 6, alignItems: "flex-end" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F8F8F8", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, color: TEXT_SECONDARY },
  track: { height: 4, backgroundColor: "#F0F0F0", borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
});

// ─── Meal card (press to open modal) ─────────────────────────────────────────

function MealCard({ log, onPress }: { log: IFoodLog; onPress: () => void }): React.JSX.Element {
  const time = new Date(log.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Pressable style={mealSt.card} onPress={onPress}>
      {log.imageUrl ? (
        <Image source={{ uri: log.imageUrl }} style={mealSt.thumb} />
      ) : (
        <View style={mealSt.thumbPlaceholder}>
          <Ionicons name="restaurant-outline" size={20} color={INACTIVE} />
        </View>
      )}
      <View style={mealSt.info}>
        <Text style={mealSt.time}>{time}</Text>
        <Text style={mealSt.names} numberOfLines={1}>
          {log.foods.map((f) => f.name).join(", ")}
        </Text>
        <View style={mealSt.inlinePills}>
          <Text style={mealSt.pill}>{Math.round(log.totals.protein)}g đạm</Text>
          <Text style={mealSt.pill}>{Math.round(log.totals.carbs)}g carbs</Text>
          <Text style={mealSt.pill}>{Math.round(log.totals.fat)}g béo</Text>
        </View>
      </View>
      <View style={mealSt.calCol}>
        <Text style={mealSt.calNum}>{Math.round(log.totals.calories)}</Text>
        <Text style={mealSt.calUnit}>kcal</Text>
        <Ionicons name="chevron-forward" size={14} color={INACTIVE} style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );
}

const mealSt = StyleSheet.create({
  card: { backgroundColor: SURFACE, borderRadius: 16, marginTop: 10, flexDirection: "row", alignItems: "center", padding: 14, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F5F5F5" },
  thumbPlaceholder: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 2 },
  time: { fontSize: 11, color: INACTIVE },
  names: { fontSize: 14, fontWeight: "600", color: TEXT },
  inlinePills: { flexDirection: "row", gap: 6, marginTop: 3 },
  pill: { fontSize: 11, color: TEXT_SECONDARY },
  calCol: { alignItems: "center", minWidth: 44 },
  calNum: { fontSize: 18, fontWeight: "700", color: PRIMARY_DARK },
  calUnit: { fontSize: 10, color: TEXT_SECONDARY },
});

// ─── Nutrition row (used inside the detail modal) ─────────────────────────────

function NutrRow({ label, value, unit, hero, last }: {
  label: string; value: number; unit: string; hero?: boolean; last?: boolean;
}): React.JSX.Element {
  const formatted = value % 1 === 0 ? String(Math.round(value)) : value.toFixed(1);
  return (
    <View style={[nutrSt.row, last && nutrSt.rowLast]}>
      <Text style={[nutrSt.label, hero && nutrSt.heroLabel]}>{label}</Text>
      <View style={nutrSt.right}>
        <Text style={[nutrSt.value, hero && nutrSt.heroValue]}>{formatted}</Text>
        <Text style={nutrSt.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const nutrSt = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5EA" },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 15, color: TEXT },
  heroLabel: { fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  value: { fontSize: 15, fontWeight: "500", color: TEXT },
  heroValue: { fontSize: 17, fontWeight: "700", color: PRIMARY_DARK },
  unit: { fontSize: 13, color: TEXT_SECONDARY },
});

// ─── Food log detail modal ────────────────────────────────────────────────────

function FoodLogDetailModal({ log, visible, onClose, onDelete }: {
  log: IFoodLog | null;
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}): React.JSX.Element | null {
  if (!log) return null;

  const fiber = log.foods.reduce((s, f) => s + (f.fiber ?? 0), 0);
  const sugar = log.foods.reduce((s, f) => s + (f.sugar ?? 0), 0);
  const time = new Date(log.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const allVitamins: Record<string, number> = {};
  const allMinerals: Record<string, number> = {};
  for (const f of log.foods) {
    for (const [k, v] of Object.entries(f.vitamins ?? {})) {
      allVitamins[k] = (allVitamins[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(f.minerals ?? {})) {
      allMinerals[k] = (allMinerals[k] ?? 0) + v;
    }
  }
  const vitaminEntries = Object.entries(allVitamins).filter(([, v]) => v > 0);
  const mineralEntries = Object.entries(allMinerals).filter(([, v]) => v > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modalSt.root}>
        {/* Drag handle */}
        <View style={modalSt.handleWrap}>
          <View style={modalSt.handle} />
        </View>

        {/* Header */}
        <View style={modalSt.header}>
          <View style={modalSt.headerInfo}>
            <Text style={modalSt.headerTime}>{time}</Text>
            <Text style={modalSt.headerName} numberOfLines={2}>
              {log.foods.map((f) => f.name).join(", ")}
            </Text>
          </View>
          <View style={modalSt.calBadge}>
            <Text style={modalSt.calNum}>{Math.round(log.totals.calories)}</Text>
            <Text style={modalSt.calUnit}>kcal</Text>
          </View>
        </View>

        <ScrollView
          style={modalSt.scroll}
          contentContainerStyle={modalSt.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Food photo */}
          {log.imageUrl ? (
            <Image source={{ uri: log.imageUrl }} style={modalSt.photo} />
          ) : null}

          {/* Macros */}
          <Text style={modalSt.sectionLabel}>Dinh dưỡng chính</Text>
          <View style={modalSt.card}>
            <NutrRow label="Năng lượng" value={log.totals.calories} unit="kcal" hero />
            <NutrRow label="Chất đạm"   value={log.totals.protein}  unit="g" />
            <NutrRow label="Tinh bột"   value={log.totals.carbs}    unit="g" />
            <NutrRow label="Chất béo"   value={log.totals.fat}      unit="g" last={fiber <= 0 && sugar <= 0} />
            {fiber > 0 && (
              <NutrRow label="Chất xơ"  value={fiber}               unit="g" last={sugar <= 0} />
            )}
            {sugar > 0 && (
              <NutrRow label="Đường"    value={sugar}               unit="g" last />
            )}
          </View>

          {/* Vitamins */}
          {vitaminEntries.length > 0 && (
            <>
              <Text style={modalSt.sectionLabel}>Vitamin</Text>
              <View style={modalSt.card}>
                {vitaminEntries.map(([key, value], i) => {
                  const meta = VITAMIN_META[key] ?? { label: key, unit: "mg" };
                  return (
                    <NutrRow
                      key={key}
                      label={meta.label}
                      value={value}
                      unit={meta.unit}
                      last={i === vitaminEntries.length - 1}
                    />
                  );
                })}
              </View>
            </>
          )}

          {/* Minerals */}
          {mineralEntries.length > 0 && (
            <>
              <Text style={modalSt.sectionLabel}>Khoáng chất</Text>
              <View style={modalSt.card}>
                {mineralEntries.map(([key, value], i) => {
                  const meta = MINERAL_META[key] ?? { label: key, unit: "mg" };
                  return (
                    <NutrRow
                      key={key}
                      label={meta.label}
                      value={value}
                      unit={meta.unit}
                      last={i === mineralEntries.length - 1}
                    />
                  );
                })}
              </View>
            </>
          )}

          {/* Per-food breakdown */}
          {log.foods.length > 0 && (
            <>
              <Text style={modalSt.sectionLabel}>Chi tiết từng món</Text>
              <View style={modalSt.card}>
                {log.foods.map((f, i) => (
                  <View
                    key={i}
                    style={[modalSt.foodRow, i === log.foods.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={modalSt.foodLeft}>
                      <Text style={modalSt.foodName}>{f.name}</Text>
                      {(f.weightG ?? 0) > 0 && (
                        <Text style={modalSt.foodWeight}>{f.weightG}g</Text>
                      )}
                    </View>
                    <Text style={modalSt.foodCal}>{Math.round(f.calories)} kcal</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Delete */}
          <Pressable
            style={modalSt.deleteBtn}
            onPress={() => { onDelete(); onClose(); }}
          >
            <Ionicons name="trash-outline" size={15} color="#EF5350" />
            <Text style={modalSt.deleteText}>Xóa bữa ăn này</Text>
          </Pressable>
        </ScrollView>

        {/* Close button */}
        <Pressable style={modalSt.closeBtn} onPress={onClose}>
          <Text style={modalSt.closeBtnText}>Đóng</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const modalSt = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#DEDEDE" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },
  headerInfo: { flex: 1, marginRight: 12 },
  headerTime: { fontSize: 12, color: INACTIVE, marginBottom: 2 },
  headerName: { fontSize: 16, fontWeight: "700", color: TEXT },
  calBadge: { backgroundColor: PRIMARY + "20", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", minWidth: 60 },
  calNum: { fontSize: 22, fontWeight: "700", color: PRIMARY_DARK },
  calUnit: { fontSize: 11, color: TEXT_SECONDARY },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  photo: { width: "100%", height: 200, borderRadius: 14, resizeMode: "cover", marginBottom: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  foodLeft: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: "600", color: TEXT },
  foodWeight: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 },
  foodCal: { fontSize: 14, fontWeight: "600", color: PRIMARY_DARK },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FDECEA",
  },
  deleteText: { fontSize: 14, fontWeight: "600", color: "#EF5350" },
  closeBtn: {
    marginHorizontal: 16,
    marginBottom: 32,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEEEEE",
  },
  closeBtnText: { fontSize: 15, fontWeight: "600", color: TEXT_SECONDARY },
});

// ─── Daily summary row ───────────────────────────────────────────────────────

function DayRow({ d, kcalGoal }: { d: IFoodDaySummary; kcalGoal: number }): React.JSX.Element {
  const date = new Date(d.date + "T12:00:00");
  const today = d.date === toYMD(new Date());
  const pct = Math.min(d.calories / kcalGoal, 1);

  return (
    <View style={daySt.row}>
      <View style={daySt.dateCol}>
        <Text style={[daySt.dayName, today && daySt.todayText]}>{VN_DAY[date.getDay()]}</Text>
        <Text style={[daySt.dayNum, today && daySt.todayText]}>{date.getDate()}</Text>
      </View>
      <View style={daySt.barCol}>
        <View style={daySt.track}>
          {pct > 0 && (
            <LinearGradient
              colors={[PRIMARY, PRIMARY_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[daySt.fill, { width: `${pct * 100}%` as `${number}%` }]}
            />
          )}
        </View>
      </View>
      <Text style={[daySt.calText, d.calories === 0 && daySt.zeroText]}>
        {d.calories > 0 ? `${Math.round(d.calories)}` : "—"}
      </Text>
    </View>
  );
}

const daySt = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F5F5F5" },
  dateCol: { width: 28, alignItems: "center" },
  dayName: { fontSize: 10, color: TEXT_SECONDARY },
  dayNum: { fontSize: 15, fontWeight: "700", color: TEXT },
  todayText: { color: PRIMARY_DARK },
  barCol: { flex: 1 },
  track: { height: 4, backgroundColor: "#F0F0F0", borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  calText: { fontSize: 12, fontWeight: "600", color: TEXT, width: 48, textAlign: "right" },
  zeroText: { color: INACTIVE },
});

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onScan }: { onScan: () => void }): React.JSX.Element {
  return (
    <View style={emptySt.container}>
      <Ionicons name="restaurant-outline" size={44} color={INACTIVE} />
      <Text style={emptySt.title}>Chưa có bữa ăn</Text>
      <Text style={emptySt.sub}>Quét ảnh để theo dõi dinh dưỡng của bạn</Text>
      <Pressable style={emptySt.btn} onPress={onScan}>
        <Ionicons name="scan-outline" size={16} color={PRIMARY_DARK} />
        <Text style={emptySt.btnText}>Quét ngay</Text>
      </Pressable>
    </View>
  );
}

const emptySt = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 48, gap: 8 },
  title: { fontSize: 16, fontWeight: "600", color: TEXT_SECONDARY },
  sub: { fontSize: 13, color: INACTIVE, textAlign: "center" },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(183,205,101,0.15)" },
  btnText: { fontSize: 14, fontWeight: "600", color: PRIMARY_DARK },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function FoodScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("day");
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<IFoodLog | null>(null);

  const range = useMemo(() => getRange(period, offset), [period, offset]);

  const statsQ = useQuery({
    queryKey: ["users", "profile", "stats"],
    queryFn: getProfileStatsApi,
    staleTime: 5 * 60 * 1000, // 5 min — calorie goal rarely changes mid-session
  });
  const kcalGoal = statsQ.data?.dailyTargets.kcal ?? KCAL_GOAL_DEFAULT;

  const dayQ = useQuery({
    queryKey: ["food", "logs", "day", range.from],
    queryFn: () => getFoodLogsApi(range.from),
    enabled: period === "day",
  });

  const rangeQ = useQuery({
    queryKey: ["food", "logs", "range", range.from, range.to],
    queryFn: () => getFoodLogsRangeApi(range.from, range.to),
    enabled: period !== "day",
  });

  const summary = useMemo(() => {
    if (period === "day") {
      const logs = dayQ.data ?? [];
      return {
        calories: logs.reduce((s, l) => s + l.totals.calories, 0),
        protein: logs.reduce((s, l) => s + l.totals.protein, 0),
        carbs: logs.reduce((s, l) => s + l.totals.carbs, 0),
        fat: logs.reduce((s, l) => s + l.totals.fat, 0),
        fiber: logs.reduce((s, l) => s + l.foods.reduce((fs, f) => fs + (f.fiber ?? 0), 0), 0),
      };
    }
    const days = rangeQ.data ?? [];
    return {
      calories: days.reduce((s, d) => s + d.calories, 0),
      protein: days.reduce((s, d) => s + d.protein, 0),
      carbs: days.reduce((s, d) => s + d.carbs, 0),
      fat: days.reduce((s, d) => s + d.fat, 0),
      fiber: days.reduce((s, d) => s + d.fiber, 0),
    };
  }, [period, dayQ.data, rangeQ.data]);

  const isLoading = period === "day" ? dayQ.isLoading : rangeQ.isLoading;

  const activeDays = useMemo(() => {
    if (period === "day") return 1;
    return (rangeQ.data ?? []).filter((d) => d.calories > 0).length || 1;
  }, [period, rangeQ.data]);

  const handleDelete = (logId: string): void => {
    void deleteFoodLogApi(logId).then(() => {
      void qc.invalidateQueries({ queryKey: ["food", "logs", "day", range.from] });
    });
  };

  const handlePeriod = (p: Period): void => {
    setPeriod(p);
    setOffset(0);
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: "day", label: "Ngày" },
    { key: "week", label: "Tuần" },
    { key: "month", label: "Tháng" },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[PRIMARY_DARK, PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Bữa ăn</Text>
            <Text style={styles.headerSub}>{range.label}</Text>
          </View>
          <Pressable
            style={styles.scanBtn}
            onPress={() => router.push("/(food)/scan" as never)}
            accessibilityRole="button"
            accessibilityLabel="Quét bữa ăn"
          >
            <Ionicons name="scan-outline" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Segmented period control */}
        <View style={styles.segmented}>
          {PERIODS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.segment, period === key && styles.segmentActive]}
              onPress={() => handlePeriod(key)}
            >
              <Text style={[styles.segmentText, period === key && styles.segmentTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* ── Date navigator ── */}
      <View style={styles.dateNav}>
        <Pressable style={styles.navArrow} onPress={() => setOffset((o) => o - 1)}>
          <Ionicons name="chevron-back" size={18} color={TEXT} />
        </Pressable>
        <Text style={styles.navLabel}>{range.label}</Text>
        <Pressable
          style={[styles.navArrow, offset >= 0 && styles.navArrowDisabled]}
          onPress={() => setOffset((o) => Math.min(o + 1, 0))}
          disabled={offset >= 0}
        >
          <Ionicons name="chevron-forward" size={18} color={offset >= 0 ? INACTIVE : TEXT} />
        </Pressable>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        {!isLoading && (
          <SummaryCard
            calories={summary.calories}
            protein={summary.protein}
            carbs={summary.carbs}
            fat={summary.fat}
            fiber={summary.fiber}
            kcalGoal={kcalGoal}
            period={period}
            activeDays={activeDays}
          />
        )}

        {/* Week / Month view */}
        {period !== "day" && !isLoading && (rangeQ.data?.length ?? 0) > 0 && (
          <>
            <BarChart data={rangeQ.data!} kcalGoal={kcalGoal} />
            <View style={styles.dayListCard}>
              <Text style={styles.dayListTitle}>Chi tiết từng ngày</Text>
              {rangeQ.data!.map((d) => (
                <DayRow key={d.date} d={d} kcalGoal={kcalGoal} />
              ))}
            </View>
          </>
        )}

        {/* Day view */}
        {period === "day" && !isLoading && (
          (dayQ.data?.length ?? 0) === 0 ? (
            <EmptyState onScan={() => router.push("/(food)/scan" as never)} />
          ) : (
            dayQ.data!.map((log) => (
              <MealCard
                key={log._id}
                log={log}
                onPress={() => setSelectedLog(log)}
              />
            ))
          )
        )}

        {/* Loading skeleton */}
        {isLoading && [1, 2, 3].map((i) => (
          <View key={i} style={styles.skeleton} />
        ))}
      </ScrollView>

      {/* ── Detail modal ── */}
      <FoodLogDetailModal
        log={selectedLog}
        visible={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        onDelete={() => {
          if (selectedLog) handleDelete(selectedLog._id);
        }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  scanBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: "#FFFFFF" },
  segmentText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.65)" },
  segmentTextActive: { color: PRIMARY_DARK },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  navArrow: { padding: 10, borderRadius: 8 },
  navArrowDisabled: { opacity: 0.3 },
  navLabel: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "600", color: TEXT },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  dayListCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dayListTitle: { fontSize: 13, fontWeight: "600", color: TEXT, marginBottom: 10 },
  skeleton: {
    height: 72,
    backgroundColor: "#F2F2F2",
    borderRadius: 16,
    marginTop: 10,
  },
});
