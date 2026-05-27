import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExerciseApi } from '../../../../lib/api/exercises.api';
import { createWorkoutLogApi } from '../../../../lib/api/workouts.api';
import PrimaryButton from '../../../../components/ui/PrimaryButton';
import { useTimerStore } from '../../../../stores/timerStore';
import { TIMER_BG } from '../../../../constants/colors';

export default function CompleteScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const resetTimer = useTimerStore((s) => s.reset);

  const { data: exercise } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExerciseApi(id),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: createWorkoutLogApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
    },
  });

  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (exercise && !hasFiredRef.current) {
      hasFiredRef.current = true;
      mutation.mutate({
        exerciseId: exercise._id,
        exerciseName: exercise.name,
        durationMinutes: exercise.durationMinutes,
        caloriesBurned: exercise.caloriesBurned,
        completedAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // mutation.mutate is stable but not in deps to avoid re-firing on re-render
  }, [exercise]);

  const handleDone = (): void => {
    resetTimer();
    router.replace('/(tabs)/exercises');
  };

  const handleRetry = (): void => {
    if (!exercise) return;
    mutation.mutate({
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      durationMinutes: exercise.durationMinutes,
      caloriesBurned: exercise.caloriesBurned,
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Ionicons name="trophy-outline" size={64} color="#FFFFFF" />
          <Text style={styles.heading}>Xuất sắc!</Text>
          <Text style={styles.subtitle}>Bạn đã hoàn thành bài tập!</Text>
          <Text style={styles.summary}>
            {exercise?.durationMinutes} phút · {exercise?.caloriesBurned} kcal
          </Text>
          {mutation.isPending && <ActivityIndicator color="#FFFFFF" style={{ marginTop: 24 }} />}
          {mutation.isError && (
            <>
              <Text style={styles.errorText}>Không thể lưu buổi tập. Vui lòng thử lại.</Text>
              <Pressable onPress={handleRetry} accessibilityRole="button" style={{ marginTop: 12 }}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </>
          )}
        </View>
        <View style={styles.bottom}>
          <PrimaryButton label="Hoàn tất" onPress={handleDone} disabled={mutation.isPending} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TIMER_BG },
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#FFFFFF', marginTop: 8 },
  summary: { fontSize: 14, color: '#FFFFFF', marginTop: 12, opacity: 0.9 },
  errorText: { color: '#FFFFFF', marginTop: 16, textAlign: 'center' },
  retryText: { color: '#FFFFFF', textDecorationLine: 'underline', fontSize: 14 },
  bottom: { paddingHorizontal: 16, paddingBottom: 32 },
});
