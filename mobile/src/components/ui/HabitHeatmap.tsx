import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { HABIT_ACTIVE, HABIT_INACTIVE } from "../../constants/colors";

interface HabitHeatmapProps {
  weekData: Array<{ date: string; qualified: boolean }>;
}

function dayLabelFromDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  const dayIdx = d.getUTCDay(); // 0=Sunday..6=Saturday
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return labels[dayIdx] ?? "";
}

export default function HabitHeatmap({
  weekData,
}: HabitHeatmapProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {weekData.map((item) => (
        <View key={item.date} style={styles.cell}>
          <View
            style={[
              styles.circle,
              {
                backgroundColor: item.qualified ? HABIT_ACTIVE : HABIT_INACTIVE,
              },
            ]}
          />
          <Text style={styles.label}>{dayLabelFromDate(item.date)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cell: {
    alignItems: "center",
    gap: 4,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  label: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "500",
  },
});
