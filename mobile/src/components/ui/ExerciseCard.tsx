import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { IExercise } from "../../lib/api/types";
import {
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
} from "../../constants/colors";

// Difficulty display mapping
const DIFFICULTY_DISPLAY: Record<string, { label: string; color: string }> = {
  easy: { label: "Dễ", color: DIFFICULTY_EASY },
  medium: { label: "Trung bình", color: DIFFICULTY_MEDIUM },
  hard: { label: "Khó", color: DIFFICULTY_HARD },
};

// Category icon mapping (D-42: no image, use icons)
const CATEGORY_ICON: Record<
  string,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  yoga: "body-outline",
  cardio: "bicycle-outline",
  weights: "barbell-outline",
  stretching: "fitness-outline",
};

interface ExerciseCardProps {
  exercise: IExercise;
  onPress: () => void;
}

export default function ExerciseCard({
  exercise,
  onPress,
}: ExerciseCardProps): React.JSX.Element {
  const difficultyInfo = DIFFICULTY_DISPLAY[exercise.difficulty] ?? {
    label: exercise.difficulty,
    color: TEXT_SECONDARY,
  };
  const iconName = CATEGORY_ICON[exercise.category] ?? "fitness-outline";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Left: category icon thumbnail */}
      <View style={styles.thumbnail}>
        <Ionicons name={iconName} size={32} color={TEXT_SECONDARY} />
      </View>

      {/* Center: exercise info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {exercise.name}
        </Text>

        {/* Difficulty pill */}
        <View style={[styles.pill, { backgroundColor: difficultyInfo.color }]}>
          <Text style={styles.pillText}>{difficultyInfo.label}</Text>
        </View>

        {/* Duration + calories */}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={TEXT_SECONDARY} />
          <Text style={styles.metaText}>{exercise.durationMinutes} phút</Text>
          <Ionicons
            name="flame-outline"
            size={14}
            color={TEXT_SECONDARY}
            style={styles.metaIcon}
          />
          <Text style={styles.metaText}>{exercise.caloriesBurned} kcal</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  thumbnail: {
    width: 80,
    height: 80,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 6,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginLeft: 3,
  },
  metaIcon: {
    marginLeft: 10,
  },
});
