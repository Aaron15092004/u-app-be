import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PRIMARY, SURFACE, TEXT_SECONDARY } from "../../constants/colors";

interface DailyChallengeCardProps {
  targetKcal: number;
  currentKcal: number;
  title?: string;
}

export default function DailyChallengeCard({
  targetKcal,
  currentKcal,
  title = "Mục tiêu hôm nay: Đốt 300 kcal",
}: DailyChallengeCardProps): React.JSX.Element {
  const progressPercent = Math.min(
    100,
    Math.round((currentKcal / targetKcal) * 100),
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* kcal label */}
      <Text style={styles.kcalLabel}>
        {currentKcal} / {targetKcal} kcal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },
  kcalLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    textAlign: "right",
  },
});
