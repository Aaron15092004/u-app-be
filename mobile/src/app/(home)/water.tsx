import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/ui/ScreenHeader';
import WaterControls from '../../components/ui/WaterControls';
import WaterLogItem from '../../components/ui/WaterLogItem';
import { logWaterApi, getTodayWaterApi, deleteWaterApi } from '../../lib/api/water.api';
import { BACKGROUND, PRIMARY, SURFACE, TEXT, TEXT_SECONDARY } from '../../constants/colors';
import type { IWaterLog } from '../../lib/api/types';

export default function WaterLogScreen(): React.JSX.Element {
  const qc = useQueryClient();

  // Single query — waterGoal embedded in response per WARNING 4 fix
  const waterQuery = useQuery({
    queryKey: ['water', 'today'],
    queryFn: getTodayWaterApi,
  });

  const waterGoal = waterQuery.data?.waterGoal ?? 8;
  const count = waterQuery.data?.count ?? 0;
  const logs: IWaterLog[] = waterQuery.data?.logs ?? [];

  const invalidateBoth = (): void => {
    void qc.invalidateQueries({ queryKey: ['water', 'today'] });
    void qc.invalidateQueries({ queryKey: ['home', 'summary'] });
  };

  const logMutation = useMutation({
    mutationFn: () => logWaterApi(),
    onSettled: invalidateBoth,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWaterApi(id),
    onSettled: invalidateBoth,
  });

  const handleDecrement = (): void => {
    if (count === 0 || logs.length === 0) return;
    deleteMutation.mutate(logs[0]._id);
  };

  const isLoading = logMutation.isPending || deleteMutation.isPending;

  const goalReached = count >= waterGoal;

  if (waterQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenHeader title="Nhật ký nước" showBack />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonControls} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (waterQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenHeader title="Nhật ký nước" showBack />
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Có lỗi xảy ra. Vui lòng thử lại.</Text>
            <Pressable
              onPress={() => { void waterQuery.refetch(); }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Sort logs newest first (logs from API should be sorted, but ensure)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Nhật ký nước" showBack />

        {/* Daily goal card */}
        <View style={styles.goalCard}>
          <View style={styles.goalDisplay}>
            <Text style={styles.countText}>{count}</Text>
            <Text style={styles.separatorText}> / </Text>
            <Text style={styles.goalText}>{waterGoal}</Text>
          </View>
          {goalReached ? (
            <Text style={styles.goalReachedText}>Đã đạt mục tiêu! Tuyệt vời</Text>
          ) : (
            <Text style={styles.subLabel}>ly hôm nay</Text>
          )}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(count / waterGoal, 1) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* +/- Controls */}
        <View style={styles.controlsWrapper}>
          <WaterControls
            count={count}
            onIncrement={() => logMutation.mutate()}
            onDecrement={handleDecrement}
            isLoading={isLoading}
          />
        </View>

        {/* History section */}
        <Text style={styles.sectionHeading}>Lịch sử hôm nay</Text>

        {sortedLogs.length === 0 ? (
          <Text style={styles.emptyText}>
            Chưa uống ly nào hôm nay. Hãy bắt đầu nhé!
          </Text>
        ) : (
          sortedLogs.map((log, i) => (
            <WaterLogItem
              key={log._id}
              index={count - i}
              loggedAt={log.loggedAt}
              onDelete={() => {
                Alert.alert(
                  'Xóa ly nước',
                  `Bạn có chắc muốn xóa ly ${count - i} không?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => deleteMutation.mutate(log._id),
                    },
                  ],
                );
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  // Goal card
  goalCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginTop: 16,
  },
  goalDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  countText: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY,
  },
  separatorText: {
    fontSize: 20,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  goalText: {
    fontSize: 20,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  subLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    marginBottom: 12,
  },
  goalReachedText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 12,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
  },
  // Controls
  controlsWrapper: {
    marginTop: 24,
    marginBottom: 8,
  },
  // History
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 24,
  },
  // Loading skeleton
  skeletonCard: {
    height: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginTop: 16,
    opacity: 0.4,
  },
  skeletonControls: {
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 24,
    opacity: 0.4,
  },
  // Error
  errorCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
});
