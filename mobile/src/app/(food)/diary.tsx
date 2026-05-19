import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ui/ScreenHeader';
import DatePill from '../../components/ui/DatePill';
import FoodDiaryItem from '../../components/ui/FoodDiaryItem';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { getFoodLogsApi, deleteFoodLogApi } from '../../lib/api/food.api';
import type { IFoodLog } from '../../lib/api/types';

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

function toYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
};

function formatDateLabel(date: Date, isToday: boolean): string {
  if (isToday) return 'Hôm nay';
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const d = date.getDate();
  const m = date.getMonth() + 1;
  return `${weekday} ${d}/${m}`;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function buildDateOptions(): Array<{ dateStr: string; label: string }> {
  const today = new Date();
  const options: Array<{ dateStr: string; label: string }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    options.push({
      dateStr: toYYYYMMDD(d),
      label: formatDateLabel(d, i === 0),
    });
  }
  return options;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiaryScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const dateOptions = buildDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].dateStr);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['food-logs', selectedDate],
    queryFn: () => getFoodLogsApi(selectedDate),
  });

  const totalKcal = logs?.reduce((sum, log) => sum + log.totals.calories, 0) ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFoodLogApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['food-logs', selectedDate] });
    },
  });

  const handleDelete = (logId: string): void => {
    Alert.alert(
      'Xóa bữa ăn',
      'Bữa ăn này sẽ bị xóa vĩnh viễn. Bạn có chắc không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(logId);
          },
        },
      ],
    );
  };

  const renderLog: ListRenderItem<IFoodLog> = ({ item }) => (
    <FoodDiaryItem
      foodName={item.foods[0]?.name ?? 'Bữa ăn'}
      kcal={item.totals.calories}
      timestamp={formatTimestamp(item.createdAt)}
      onDelete={() => handleDelete(item._id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Nhật ký bữa ăn"
        subtitle="Lịch sử các bữa ăn của bạn"
        showBack
      />

      {/* Date selector row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateScrollView}
        contentContainerStyle={styles.dateScrollContent}
      >
        {dateOptions.map((opt) => (
          <DatePill
            key={opt.dateStr}
            label={opt.label}
            isActive={opt.dateStr === selectedDate}
            onPress={() => setSelectedDate(opt.dateStr)}
          />
        ))}
      </ScrollView>

      {/* Daily kcal summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng calo hôm nay</Text>
        <Text style={styles.summaryKcal}>{totalKcal}</Text>
        <Text style={styles.summaryGoal}>/ 2,000 kcal mục tiêu</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : logs?.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="restaurant-outline" size={56} color="#BDBDBD" />
          <Text style={styles.emptyHeading}>Chưa có bữa ăn nào</Text>
          <Text style={styles.emptyBody}>
            Quét bữa ăn hoặc tìm kiếm thủ công để ghi lại
          </Text>
          <View style={styles.emptyButton}>
            <PrimaryButton
              variant="filled"
              label="Quét bữa ăn"
              onPress={() => router.push('/(food)/scan')}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderLog}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dateScrollView: {
    marginVertical: 12,
  },
  dateScrollContent: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginBottom: 4,
  },
  summaryKcal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  summaryGoal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    width: '100%',
    marginTop: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
});
