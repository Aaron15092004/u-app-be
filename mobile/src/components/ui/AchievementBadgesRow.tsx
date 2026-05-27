import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AchievementBadge from "./AchievementBadge";
import { TEXT } from "../../constants/colors";

const MILESTONES = [7, 14, 28, 60];

interface AchievementBadgesRowProps {
  streakDays: number;
}

export default function AchievementBadgesRow({
  streakDays,
}: AchievementBadgesRowProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Thành tích</Text>
      <View style={styles.row}>
        {MILESTONES.map((milestone) => (
          <AchievementBadge
            key={milestone}
            milestone={milestone}
            unlocked={streakDays >= milestone}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
