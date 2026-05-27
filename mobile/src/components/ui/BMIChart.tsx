// EXPO GO FALLBACK — victory-native requires @shopify/react-native-skia (native build only)
// Restore CartesianChart/Bar implementation before EAS/production build
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PRIMARY, TEXT_SECONDARY } from "../../constants/colors";
import type { IBMIHistoryEntry } from "../../lib/api/types";

interface BMIChartProps {
  records: IBMIHistoryEntry[];
}

export default function BMIChart({
  records,
}: BMIChartProps): React.JSX.Element {
  if (records.length === 0) {
    return (
      <Text style={styles.empty}>
        Chưa có dữ liệu BMI. Nhập số đo và nhấn Lưu số đo để bắt đầu theo dõi.
      </Text>
    );
  }

  const max = Math.max(...records.map((r) => r.bmi), 30);
  const last5 = records.slice(-5);

  return (
    <View style={styles.container}>
      {last5.map((r, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.label}>{r.bmi.toFixed(1)}</Text>
          <View
            style={[styles.bar, { width: `${(r.bmi / max) * 100}%` as any }]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: TEXT_SECONDARY,
    textAlign: "center",
    padding: 24,
    fontSize: 14,
  },
  container: { paddingVertical: 8, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 40, fontSize: 12, color: TEXT_SECONDARY, textAlign: "right" },
  bar: { height: 20, backgroundColor: PRIMARY, borderRadius: 4, minWidth: 4 },
});
