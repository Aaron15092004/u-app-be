import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  checkInHabitApi,
  getTodayHabitsApi,
  getWeeklyHabitsApi,
  getStreakApi,
} from '../../../lib/api/habits.api';
import type { IHabitId, ITodayHabits } from '../../../lib/api/types';
import HabitRow from '../../../components/ui/HabitRow';
import HabitHeatmap from '../../../components/ui/HabitHeatmap';
import StreakBadge from '../../../components/ui/StreakBadge';
import FormErrorText from '../../../components/ui/FormErrorText';
import { SURFACE, TEXT, TEXT_SECONDARY } from '../../../constants/colors';

// HAB-02: centralised habit definitions — single source of truth
const HABIT_DEFAULTS: Array<{ id: IHabitId; name: string; iconName: string }> = [
  { id: 'water',      name: 'Uống 8 ly nước',    iconName: 'water-outline' },
  { id: 'vegetables', name: 'Ăn 5 bữa rau củ',   iconName: 'leaf-outline' },
  { id: 'exercise',   name: 'Tập luyện 30 phút', iconName: 'fitness-outline' },
  { id: 'sleep',      name: 'Ngủ đủ 8 tiếng',    iconName: 'moon-outline' },
  { id: 'reading',    name: 'Đọc sách 20 phút',  iconName: 'book-outline' },
  { id: 'nut-milk',   name: 'Uống sữa hạt',      iconName: 'cafe-outline' },
];

const INITIAL_ROW_ERRORS: Record<IHabitId, string | null> = {
  water: null,
  vegetables: null,
  exercise: null,
  sleep: null,
  reading: null,
  'nut-milk': null,
};

export default function HabitsScreen(): React.JSX.Element {
  const qc = useQueryClient();
  const [rowError, setRowError] = useState<Record<IHabitId, string | null>>(INITIAL_ROW_ERRORS);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const todayQuery = useQuery({
    queryKey: ['habits', 'today'],
    queryFn: getTodayHabitsApi,
  });
  const weeklyQuery = useQuery({
    queryKey: ['habits', 'weekly'],
    queryFn: getWeeklyHabitsApi,
  });
  const streakQuery = useQuery({
    queryKey: ['habits', 'streak'],
    queryFn: getStreakApi,
  });

  // ── Optimistic mutation ──────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (habitId: IHabitId) => checkInHabitApi(habitId),
    onMutate: async (habitId) => {
      await qc.cancelQueries({ queryKey: ['habits', 'today'] });
      const previous = qc.getQueryData<ITodayHabits>(['habits', 'today']);
      qc.setQueryData<ITodayHabits>(['habits', 'today'], (old) => {
        if (!old) return old;
        const completed = old.completed.includes(habitId)
          ? old.completed
          : [...old.completed, habitId];
        return {
          completed,
          progress: {
            count: completed.length,
            percent: Math.round((completed.length / 6) * 100),
          },
        };
      });
      setRowError((e) => ({ ...e, [habitId]: null }));
      return { previous, habitId };
    },
    onError: (_err, habitId, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['habits', 'today'], ctx.previous);
      }
      setRowError((e) => ({ ...e, [habitId]: 'Không thể cập nhật. Thử lại.' }));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['habits', 'today'] });
      qc.invalidateQueries({ queryKey: ['habits', 'weekly'] });
      qc.invalidateQueries({ queryKey: ['habits', 'streak'] });
    },
  });

  const completedSet = new Set(todayQuery.data?.completed ?? []);

  // ── Render helpers ───────────────────────────────────────────────────────────
  function renderHabitList(): React.ReactNode {
    if (todayQuery.isLoading) {
      return Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.skeleton} />
      ));
    }

    if (todayQuery.isError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải thói quen. Thử lại.</Text>
          <Pressable onPress={() => { void todayQuery.refetch(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      );
    }

    return HABIT_DEFAULTS.map((habit, idx) => (
      <View key={habit.id}>
        <HabitRow
          habit={habit}
          isCompletedToday={completedSet.has(habit.id)}
          onCheckIn={() => {
            if (!completedSet.has(habit.id)) mutation.mutate(habit.id);
          }}
          disabled={mutation.isPending}
        />
        {rowError[habit.id] != null && (
          <View style={styles.rowErrorWrapper}>
            <FormErrorText message={rowError[habit.id]!} />
          </View>
        )}
        {idx < 5 && <View style={styles.divider} />}
      </View>
    ));
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Thói quen</Text>
          <StreakBadge streakDays={streakQuery.data?.streakDays ?? 0} />
        </View>

        {/* 2. Progress text */}
        <Text style={styles.progressText}>
          {todayQuery.data?.progress.count ?? 0}/6 hoàn thành —{' '}
          {todayQuery.data?.progress.percent ?? 0}%
        </Text>

        {/* 3. Habit list */}
        <View style={styles.habitList}>{renderHabitList()}</View>

        {/* 4. Heatmap section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tuần này</Text>
        </View>
        <View style={styles.card}>
          <HabitHeatmap weekData={weeklyQuery.data ?? []} />
        </View>

        {/* 5. Tips section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mẹo nhỏ</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.tipText}>
            Duy trì thói quen nhỏ mỗi ngày tạo nên sự thay đổi lớn. Bắt đầu từ 5 phút mỗi ngày!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
  },
  // Progress
  progressText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  // Habit list card
  habitList: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  // Error / loading states
  skeleton: {
    height: 72,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#B71C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // Row error
  rowErrorWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Section headings
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
  },
  // Generic card
  card: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
  },
  // Tips text
  tipText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
});
