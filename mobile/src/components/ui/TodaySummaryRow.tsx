import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TEXT, TEXT_SECONDARY } from "../../constants/colors";

interface TodaySummaryRowProps {
  kcal: number;
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  onWaterPress: () => void;
}

interface StatColProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string | number;
  unit: string;
  onPress?: () => void;
}

function StatCol({
  icon,
  iconColor,
  value,
  unit,
  onPress,
}: StatColProps): React.JSX.Element {
  const inner = (
    <View style={styles.col}>
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.colWrapper, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.colWrapper}>{inner}</View>;
}

export default function TodaySummaryRow({
  kcal,
  waterGlasses,
  waterGoal,
  workoutMinutes,
  onWaterPress,
}: TodaySummaryRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <StatCol
        icon="flame-outline"
        iconColor="#FF6B35"
        value={kcal.toLocaleString("vi-VN")}
        unit="kcal"
      />
      <View style={styles.divider} />
      <StatCol
        icon="water-outline"
        iconColor="#42A5F5"
        value={`${waterGlasses}/${waterGoal}`}
        unit="cốc"
        onPress={onWaterPress}
      />
      <View style={styles.divider} />
      <StatCol
        icon="flash-outline"
        iconColor="#FFA726"
        value={workoutMinutes}
        unit="phút"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  colWrapper: {
    flex: 1,
  },
  col: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
  },
  unit: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: "#E0E0E0",
  },
  pressed: {
    opacity: 0.75,
  },
});
