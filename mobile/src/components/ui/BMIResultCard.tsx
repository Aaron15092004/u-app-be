import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PRIMARY, SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";
import type { IBMICategory } from "../../lib/api/types";
import BMIScaleBar from "./BMIScaleBar";

interface BMIResultCardProps {
  bmi: number;
  category: IBMICategory;
}

const CATEGORY_VI: Record<IBMICategory, string> = {
  underweight: "Thiếu cân",
  normal: "Bình thường",
  overweight: "Thừa cân",
  obese: "Béo phì",
};

export default function BMIResultCard({
  bmi,
  category,
}: BMIResultCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {/* Top row: BMI score + category */}
      <View style={styles.topRow}>
        <Text style={styles.bmiScore}>{bmi}</Text>
        <Text style={styles.categoryLabel}>{CATEGORY_VI[category]}</Text>
      </View>

      {/* Scale bar */}
      <BMIScaleBar bmi={bmi} />

      {/* Range labels */}
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>15</Text>
        <Text style={styles.rangeText}>40</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
    gap: 12,
  },
  bmiScore: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY,
  },
  categoryLabel: {
    fontSize: 16,
    color: TEXT,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rangeText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
});
