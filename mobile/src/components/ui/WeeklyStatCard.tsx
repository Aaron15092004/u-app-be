import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";

interface WeeklyStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

export default function WeeklyStatCard({
  label,
  value,
  unit,
}: WeeklyStatCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 4,
  },
  unit: {
    fontSize: 12,
    fontWeight: "400",
    color: TEXT_SECONDARY,
  },
  label: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
});
