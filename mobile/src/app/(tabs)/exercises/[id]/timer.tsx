import React, { useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, AppState, AppStateStatus, StatusBar, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTimerStore } from '../../../../stores/timerStore';
import { getExerciseApi } from '../../../../lib/api/exercises.api';
import TimerDisplay from '../../../../components/ui/TimerDisplay';
import TimerControls from '../../../../components/ui/TimerControls';
import { TIMER_BG } from '../../../../constants/colors';

export default function TimerScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: exercise } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExerciseApi(id),
    enabled: !!id,
  });

  const { isRunning, isPaused, remainingSeconds, exerciseId, start, pause, resume, tick, reset } = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiredCompleteRef = useRef(false);

  // Seed timer when exercise data loads (D-48)
  useEffect(() => {
    if (exercise && exerciseId !== exercise._id) {
      start(exercise._id, exercise.durationMinutes * 60);
      hasFiredCompleteRef.current = false;
    }
  }, [exercise, exerciseId, start]);

  // 1Hz tick loop
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => { tick(); }, 1000);
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [isRunning, isPaused, tick]);

  // AppState background auto-pause (D-45)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' && isRunning && !isPaused) {
        pause();
      }
    });
    return () => sub.remove();
  }, [isRunning, isPaused, pause]);

  // Auto-navigate to complete when timer hits 0
  useEffect(() => {
    if (isRunning && remainingSeconds <= 0 && !hasFiredCompleteRef.current) {
      hasFiredCompleteRef.current = true;
      router.replace(`/(tabs)/exercises/${id}/complete`);
    }
  }, [isRunning, remainingSeconds, id, router]);

  const handleStop = (): void => {
    Alert.alert(
      'Dừng buổi tập?',
      'Buổi tập sẽ không được lưu. Bạn có chắc muốn dừng?',
      [
        { text: 'Tiếp tục tập', style: 'cancel' },
        { text: 'Dừng', style: 'destructive', onPress: () => { reset(); router.back(); } },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.exerciseName}>{exercise?.name ?? ''}</Text>
        </View>
        <View style={styles.center}>
          <TimerDisplay
            remainingSeconds={remainingSeconds}
            totalSeconds={(exercise?.durationMinutes ?? 0) * 60}
          />
          {isPaused && <Text style={styles.pausedText}>Đã tạm dừng</Text>}
        </View>
        <TimerControls isPaused={isPaused} onPause={pause} onResume={resume} onStop={handleStop} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TIMER_BG },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' },
  exerciseName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pausedText: { color: '#FFFFFF', fontSize: 14, opacity: 0.85, marginTop: 16 },
});
