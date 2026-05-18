import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { listExercisesApi } from '../../../lib/api/exercises.api';
import { getWeeklyStatsApi } from '../../../lib/api/workouts.api';
import type { ICategory, IExercise } from '../../../lib/api/types';
import ExerciseCard from '../../../components/ui/ExerciseCard';
import CategoryFilterChip from '../../../components/ui/CategoryFilterChip';
import WeeklyStatCard from '../../../components/ui/WeeklyStatCard';
import DailyChallengeCard from '../../../components/ui/DailyChallengeCard';
import { BACKGROUND, PRIMARY, TEXT, TEXT_SECONDARY } from '../../../constants/colors';

type FilterId = 'all' | ICategory;

interface FilterChip {
  id: FilterId;
  label: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'weights', label: 'Tạ' },
  { id: 'stretching', label: 'Giãn cơ' },
];

export default function ExerciseListScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const {
    data: exercises,
    isLoading: exercisesLoading,
    isError: exercisesError,
    refetch: refetchExercises,
  } = useQuery({
    queryKey: ['exercises', activeFilter],
    queryFn: () =>
      listExercisesApi(activeFilter === 'all' ? undefined : activeFilter),
  });

  const { data: stats } = useQuery({
    queryKey: ['workouts', 'stats', 'weekly'],
    queryFn: getWeeklyStatsApi,
  });

  const handleExercisePress = (item: IExercise): void => {
    router.push(`/(tabs)/exercises/${item._id}`);
  };

  const renderSkeleton = (): React.JSX.Element => (
    <>
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.skeleton} />
      ))}
    </>
  );

  const renderEmpty = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Không có bài tập nào trong danh mục này.
      </Text>
    </View>
  );

  const renderError = (): React.JSX.Element => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        Không thể tải danh sách bài tập. Kiểm tra kết nối và thử lại.
      </Text>
      <Pressable style={styles.retryButton} onPress={() => refetchExercises()}>
        <Text style={styles.retryText}>Thử lại</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <Text style={styles.heading}>Tập luyện</Text>

        {/* Weekly stats row */}
        <View style={styles.statsRow}>
          <WeeklyStatCard label="Ngày tập" value={stats?.days ?? 0} />
          <WeeklyStatCard label="Bài tập" value={stats?.exercises ?? 0} />
          <WeeklyStatCard label="kcal" value={stats?.kcal ?? 0} />
          <WeeklyStatCard label="Phút" value={stats?.minutes ?? 0} />
        </View>

        {/* Daily challenge card */}
        <DailyChallengeCard
          targetKcal={stats?.targetKcal ?? 300}
          currentKcal={stats?.todayKcal ?? 0}
        />

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTER_CHIPS.map((chip) => (
            <CategoryFilterChip
              key={chip.id}
              label={chip.label}
              active={activeFilter === chip.id}
              onPress={() => setActiveFilter(chip.id)}
            />
          ))}
        </ScrollView>

        {/* Exercise list */}
        {exercisesLoading ? (
          renderSkeleton()
        ) : exercisesError ? (
          renderError()
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ExerciseCard
                exercise={item}
                onPress={() => handleExercisePress(item)}
              />
            )}
            ListEmptyComponent={renderEmpty}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  chipsScroll: {
    marginTop: 16,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  skeleton: {
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    margin: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 8,
  },
});
