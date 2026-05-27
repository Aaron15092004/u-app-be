import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { PRIMARY, SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";

// ─── Ring chart ───────────────────────────────────────────────────────────────

function RingChart({
  size, sw, pct, color, trackColor,
}: {
  size: number; sw: number; pct: number; color: string; trackColor: string;
}): React.JSX.Element {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(pct, 0), 1));
  const c = size / 2;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={sw} fill="none" />
      {pct > 0 && (
        <Circle
          cx={c} cy={c} r={r}
          stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

// ─── Macro ring cell ─────────────────────────────────────────────────────────

function MacroRing({
  label, value, goal, color,
}: {
  label: string; value: number; goal: number; color: string;
}): React.JSX.Element {
  const pct = goal > 0 ? value / goal : 0;
  const over = value > goal && goal > 0;
  const ringColor = over ? "#EF5350" : color;
  return (
    <View style={mSt.item}>
      <View style={mSt.ringWrap}>
        <RingChart size={72} sw={7} pct={pct} color={ringColor} trackColor="#F0F0F0" />
        <View style={mSt.center}>
          <Text style={[mSt.val, { color: ringColor }]}>{Math.round(value)}</Text>
          <Text style={mSt.unit}>g</Text>
        </View>
      </View>
      <Text style={mSt.goalText}>
        / {Math.round(goal)}g
      </Text>
      <Text style={mSt.label}>{label}</Text>
    </View>
  );
}

const mSt = StyleSheet.create({
  item: { flex: 1, alignItems: "center", gap: 4 },
  ringWrap: { position: "relative", width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  val: { fontSize: 15, fontWeight: "700", lineHeight: 17 },
  unit: { fontSize: 10, color: TEXT_SECONDARY, lineHeight: 12 },
  goalText: { fontSize: 11, color: TEXT_SECONDARY },
  label: { fontSize: 11, fontWeight: "600", color: TEXT_SECONDARY },
});

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  kcal: number;
  macros: { protein: number; carbs: number; fat: number };
  kcalGoal?: number;
  macroGoals?: { protein: number; carbs: number; fat: number };
  onSeeMore?: () => void;
}

export default function NutritionProgressCard({
  kcal,
  macros,
  kcalGoal = 2000,
  macroGoals = { protein: 100, carbs: 250, fat: 67 },
  onSeeMore,
}: Props): React.JSX.Element {
  const kcalPct = kcalGoal > 0 ? kcal / kcalGoal : 0;
  const overKcal = kcal > kcalGoal && kcalGoal > 0;
  const kcalColor = overKcal ? "#EF5350" : PRIMARY;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Dinh dưỡng hôm nay</Text>
        {onSeeMore && (
          <Pressable onPress={onSeeMore} accessibilityRole="button">
            <Text style={styles.seeMore}>Xem chi tiết →</Text>
          </Pressable>
        )}
      </View>

      {/* Calorie ring */}
      <View style={styles.kcalWrap}>
        <RingChart size={128} sw={11} pct={kcalPct} color={kcalColor} trackColor="#F0F0F0" />
        <View style={styles.kcalCenter}>
          <Text style={[styles.kcalNum, overKcal && styles.kcalOver]}>
            {Math.round(kcal).toLocaleString("vi-VN")}
          </Text>
          <Text style={styles.kcalGoalText}>/ {kcalGoal.toLocaleString("vi-VN")}</Text>
          <Text style={styles.kcalGoalText}>kcal</Text>
        </View>
      </View>

      {/* Macro rings */}
      <View style={styles.macroRow}>
        <MacroRing label="Protein" value={macros.protein} goal={macroGoals.protein} color="#4CAF50" />
        <View style={styles.macroDivider} />
        <MacroRing label="Carbs" value={macros.carbs} goal={macroGoals.carbs} color="#FF6B35" />
        <View style={styles.macroDivider} />
        <MacroRing label="Chất béo" value={macros.fat} goal={macroGoals.fat} color="#FFA726" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: "700", color: TEXT },
  seeMore: { fontSize: 13, fontWeight: "600", color: PRIMARY },
  // Calorie ring
  kcalWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    height: 128,
  },
  kcalCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  kcalNum: { fontSize: 26, fontWeight: "700", color: TEXT, lineHeight: 30 },
  kcalOver: { color: "#EF5350" },
  kcalGoalText: { fontSize: 11, color: TEXT_SECONDARY, lineHeight: 15 },
  // Macro row
  macroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F0F0",
  },
  macroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 90,
    backgroundColor: "#F0F0F0",
    alignSelf: "center",
  },
});
