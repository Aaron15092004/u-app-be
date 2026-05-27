import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getExerciseApi } from "../../../../lib/api/exercises.api";
import ScreenHeader from "../../../../components/ui/ScreenHeader";
import PrimaryButton from "../../../../components/ui/PrimaryButton";
import {
  BACKGROUND,
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
} from "../../../../constants/colors";
import type { IExercise } from "../../../../lib/api/types";

// Difficulty display mapping
const DIFFICULTY_DISPLAY: Record<string, { label: string; color: string }> = {
  easy: { label: "Dễ", color: DIFFICULTY_EASY },
  medium: { label: "Trung bình", color: DIFFICULTY_MEDIUM },
  hard: { label: "Khó", color: DIFFICULTY_HARD },
};

// Category icon mapping (D-42: no image)
const CATEGORY_ICON: Record<
  string,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  yoga: "body-outline",
  cardio: "bicycle-outline",
  weights: "barbell-outline",
  stretching: "fitness-outline",
};

function ExerciseContent({
  exercise,
}: {
  exercise: IExercise;
}): React.JSX.Element {
  const difficultyInfo = DIFFICULTY_DISPLAY[exercise.difficulty] ?? {
    label: exercise.difficulty,
    color: TEXT_SECONDARY,
  };
  const iconName = CATEGORY_ICON[exercise.category] ?? "fitness-outline";

  return (
    <>
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        <Ionicons name={iconName} size={64} color={TEXT_SECONDARY} />
      </View>

      {/* Name */}
      <Text style={styles.exerciseName}>{exercise.name}</Text>

      {/* Metadata row */}
      <View style={styles.metaRow}>
        <View
          style={[
            styles.difficultyPill,
            { backgroundColor: difficultyInfo.color },
          ]}
        >
          <Text style={styles.pillText}>{difficultyInfo.label}</Text>
        </View>
        <Ionicons
          name="time-outline"
          size={16}
          color={TEXT_SECONDARY}
          style={styles.metaIcon}
        />
        <Text style={styles.metaText}>{exercise.durationMinutes} phút</Text>
        <Ionicons
          name="flame-outline"
          size={16}
          color={TEXT_SECONDARY}
          style={styles.metaIcon}
        />
        <Text style={styles.metaText}>{exercise.caloriesBurned} kcal</Text>
      </View>

      {/* Mô tả section */}
      {exercise.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Mô tả</Text>
          <Text style={styles.sectionBody}>{exercise.description}</Text>
        </View>
      ) : null}

      {/* Các động tác section */}
      {exercise.steps && exercise.steps.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Các động tác</Text>
          {exercise.steps.map((step) => (
            <View key={step.order} style={styles.step}>
              <Text style={styles.stepInstruction}>
                {step.order}. {step.instruction}
              </Text>
              {step.durationSeconds != null ? (
                <Text style={styles.stepDuration}>
                  {step.durationSeconds} giây
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

export default function ExerciseDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: exercise,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => getExerciseApi(id),
    enabled: Boolean(id),
  });

  const handleStart = (): void => {
    router.push(`/(tabs)/exercises/${id}/timer`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="" showBack />

      {isLoading ? (
        <View style={styles.centeredFill}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : isError || !exercise ? (
        <View style={styles.centeredFill}>
          <Text style={styles.errorText}>Không thể tải bài tập.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ExerciseContent exercise={exercise} />
        </ScrollView>
      )}

      {/* Sticky bottom button */}
      {!isLoading && !isError && exercise ? (
        <View style={styles.stickyBottom}>
          <PrimaryButton label="Bắt đầu tập" onPress={handleStart} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centeredFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 96,
    paddingHorizontal: 16,
  },
  thumbnail: {
    height: 200,
    backgroundColor: SURFACE,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  difficultyPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  metaIcon: {
    marginLeft: 4,
  },
  metaText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  step: {
    marginBottom: 12,
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 12,
  },
  stepInstruction: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 20,
    marginBottom: 4,
  },
  stepDuration: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
});
