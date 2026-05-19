import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { getTodaySummaryApi, getShopUrlApi } from '../../lib/api/home.api';
import TodaySummaryRow from '../../components/ui/TodaySummaryRow';
import NutritionProgressCard from '../../components/ui/NutritionProgressCard';
import BMIWidget from '../../components/ui/BMIWidget';
import ShopBanner from '../../components/ui/ShopBanner';
import QuickActionsRow from '../../components/ui/QuickActionsRow';
import { BACKGROUND, TEXT, TEXT_SECONDARY } from '../../constants/colors';

const DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function getVietnameseDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
}

export default function HomeScreen(): React.JSX.Element {
  const auth = useAuth();
  const router = useRouter();

  const summaryQuery = useQuery({
    queryKey: ['home', 'summary'],
    queryFn: getTodaySummaryApi,
    staleTime: 30_000,
  });

  const shopUrlQuery = useQuery({
    queryKey: ['config', 'shop-url'],
    queryFn: getShopUrlApi,
    staleTime: 60 * 60 * 1000,
  });

  if (summaryQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.skeletonGreeting} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (summaryQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#FFA726" />
          <Text style={styles.errorText}>Có lỗi xảy ra. Thử lại</Text>
          <Pressable onPress={() => { void summaryQuery.refetch(); }} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const data = summaryQuery.data!;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Greeting Row */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greeting}>
              Xin chào, {auth.user?.name ?? 'bạn'}!
            </Text>
            <Text style={styles.dateSubline}>{getVietnameseDate()}</Text>
          </View>
          <Pressable
            style={styles.bellButton}
            accessibilityLabel="Thông báo"
            accessibilityRole="button"
            onPress={() => {}}
          >
            <Ionicons name="notifications-outline" size={24} color={TEXT} />
          </Pressable>
        </View>

        {/* 2. Today Summary Cards Row */}
        <View style={styles.section}>
          <TodaySummaryRow
            kcal={data.kcalConsumed}
            waterGlasses={data.waterGlasses}
            waterGoal={data.waterGoal}
            workoutMinutes={data.workoutMinutes}
            onWaterPress={() => router.push('/(home)/water')}
          />
        </View>

        {/* 3. Ủ Shop Banner */}
        <ShopBanner
          url={shopUrlQuery.data?.url ?? null}
          isLoading={shopUrlQuery.isLoading}
        />

        {/* 4. Quick Actions Row */}
        <View style={styles.section}>
          <QuickActionsRow
            onScan={() => router.push('/(food)/scan')}
            onWorkout={() => router.push('/(tabs)/exercises')}
            onHabits={() => router.push('/(tabs)/habits')}
          />
        </View>

        {/* 5. BMI Widget */}
        <View style={styles.section}>
          <BMIWidget
            bmi={data.bmi}
            onPress={() => router.push('/(tabs)/bmi')}
          />
        </View>

        {/* 6. Nutrition Summary */}
        <View style={styles.section}>
          <NutritionProgressCard
            kcal={data.kcalConsumed}
            macros={data.macros}
          />
        </View>
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
  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
  },
  dateSubline: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  // Loading skeleton
  skeletonGreeting: {
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    opacity: 0.4,
  },
  skeletonRow: {
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    opacity: 0.4,
  },
  skeletonCard: {
    height: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    opacity: 0.4,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
});
